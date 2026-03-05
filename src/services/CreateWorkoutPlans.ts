import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  name: string;
  coverImageUrl?: string | null;
  workoutDays: Array<{
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    coverImageUrl?: string | null;
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

export interface OutputDto {
  id: string;
  name: string;
  coverImageUrl: string | null;
  workoutDays: Array<{
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    coverImageUrl: string | null;
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
  async execute(dto: InputDto): Promise<OutputDto> {
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
          ...(dto.coverImageUrl !== undefined && {
            coverImageUrl: dto.coverImageUrl,
          }),
          isActive: true,
          workoutDays: {
            create: dto.workoutDays.map((day) => ({
              name: day.name,
              weekDay: day.weekDay,
              isRest: day.isRest,
              ...(day.coverImageUrl !== undefined && {
                coverImageUrl: day.coverImageUrl,
              }),
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
        select: {
          id: true,
          name: true,
          coverImageUrl: true,
          workoutDays: {
            select: {
              id: true,
              name: true,
              weekDay: true,
              isRest: true,
              coverImageUrl: true,
              estimatedDurationInSeconds: true,
              exercices: true,
            },
          },
        },
      });

      if (!result) {
        throw new NotFoundError("Workout plan not found");
      }

      return {
        id: result.id,
        name: result.name,
        coverImageUrl: result.coverImageUrl ?? null,
        workoutDays: result.workoutDays.map((day) => ({
          name: day.name,
          weekDay: day.weekDay,
          isRest: day.isRest,
          coverImageUrl: day.coverImageUrl ?? null,
          estimatedDurationInSeconds: day.estimatedDurationInSeconds,
          exercices: day.exercices.map((exercice) => ({
            order: exercice.order,
            name: exercice.name,
            sets: exercice.sets,
            reps: exercice.reps,
            restTimeInSeconds: exercice.restTimeInSeconds,
          })),
        })),
      };
    });
  }
}
