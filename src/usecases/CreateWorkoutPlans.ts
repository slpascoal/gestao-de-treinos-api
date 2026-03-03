import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  name: string;
  workoutDays: Array<{
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    exercices: Array<{
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

export class CreateWorkoutPlan {
  async execute(dto: InputDto) {
    const existingActivePlan = await prisma.workoutPlan.findFirst({
      where: {
        isActive: true,
      },
    });

    return prisma.$transaction(async (prisma) => {
      if (existingActivePlan) {
        await prisma.workoutPlan.update({
          where: {
            id: existingActivePlan.id,
          },
          data: {
            isActive: false,
          },
        });
      }

      const workoutPlan = await prisma.workoutPlan.create({
        data: {
          userId: dto.userId,
          name: dto.name,
          isActive: true,
          workoutDays: {
            create: dto.workoutDays.map((day) => ({
              name: day.name,
              weekDay: day.weekDay,
              isRest: day.isRest,
              estimatedDurationInSeconds: day.estimatedDurationInSeconds,
              exercices: {
                create: day.exercices.map((exercice) => ({
                  order: exercice.order,
                  name: exercice.name,
                  sets: exercice.sets,
                  reps: exercice.reps,
                  restTimeInSeconds: exercice.restTimeInSeconds,
                })),
              },
            })),
          },
        },
      });

      const result = await prisma.workoutPlan.findUnique({
        where: {
          id: workoutPlan.id,
        },
        include: {
          workoutDays: {
            include: {
              exercices: true,
            },
          },
        },
      });

      if (!result) {
        throw new Error("Workout plan not found after creation");
      }

      return result;
    });
  }
}
