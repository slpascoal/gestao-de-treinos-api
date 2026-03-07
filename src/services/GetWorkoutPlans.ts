import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  active?: boolean;
}

export interface OutputDto {
  id: string;
  name: string;
  coverImageUrl: string | null;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  workoutDays: Array<{
    id: string;
    name: string;
    workoutPlanId: string;
    isRest: boolean;
    weekDay: WeekDay;
    estimatedDurationInSeconds: number;
    coverImageUrl: string | null;
    createdAt: string;
    updatedAt: string;
    exercises: Array<{
      id: string;
      name: string;
      order: number;
      workoutDayId: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
}

export class GetWorkoutPlans {
  async execute(dto: InputDto): Promise<OutputDto[]> {
    const workoutPlans = await prisma.workoutPlan.findMany({
      where: {
        userId: dto.userId,
        ...(dto.active !== undefined ? { isActive: dto.active } : {}),
      },
      include: {
        workoutDays: {
          include: {
            exercises: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return workoutPlans.map((workoutPlan) => ({
      id: workoutPlan.id,
      name: workoutPlan.name,
      coverImageUrl: workoutPlan.coverImageUrl,
      userId: workoutPlan.userId,
      isActive: workoutPlan.isActive,
      createdAt: workoutPlan.createdAt.toISOString(),
      updatedAt: workoutPlan.updatedAt.toISOString(),
      workoutDays: workoutPlan.workoutDays.map((workoutDay) => ({
        id: workoutDay.id,
        name: workoutDay.name,
        workoutPlanId: workoutDay.workoutPlanId,
        isRest: workoutDay.isRest,
        weekDay: workoutDay.weekDay,
        estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
        coverImageUrl: workoutDay.coverImageUrl,
        createdAt: workoutDay.createdAt.toISOString(),
        updatedAt: workoutDay.updatedAt.toISOString(),
        exercises: workoutDay.exercises.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          order: exercise.order,
          workoutDayId: exercise.workoutDayId,
          sets: exercise.sets,
          reps: exercise.reps,
          restTimeInSeconds: exercise.restTimeInSeconds,
          createdAt: exercise.createdAt.toISOString(),
          updatedAt: exercise.updatedAt.toISOString(),
        })),
      })),
    }));
  }
}
