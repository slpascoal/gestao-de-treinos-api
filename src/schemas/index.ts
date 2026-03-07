import z from "zod";

import { WeekDay } from "../generated/prisma/enums.js";

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

export const WorkoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
  coverImageUrl: z.string().nullable().optional(),
  workoutDays: z.array(
    z.object({
      name: z.string().trim().min(1),
      weekDay: z.enum(WeekDay),
      isRest: z.boolean().default(false),
      coverImageUrl: z.string().nullable().optional(),
      estimatedDurationInSeconds: z.number().min(1),
      exercises: z.array(
        z.object({
          order: z.number().min(0),
          name: z.string().trim().min(1),
          sets: z.number().min(1),
          reps: z.number().min(1),
          restTimeInSeconds: z.number().min(1),
        }),
      ),
    }),
  ),
});

export const WorkoutSessionParamsSchema = z.object({
  planId: z.uuid(),
  dayId: z.uuid(),
});

export const WorkoutPlansQuerySchema = z.object({
  active: z.coerce.boolean().optional(),
});

export const WorkoutPlansResponseSchema = z.array(
  z.object({
    id: z.uuid(),
    name: z.string(),
    coverImageUrl: z.string().nullable(),
    userId: z.string(),
    isActive: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    workoutDays: z.array(
      z.object({
        id: z.uuid(),
        name: z.string(),
        workoutPlanId: z.uuid(),
        isRest: z.boolean(),
        weekDay: z.enum(WeekDay),
        estimatedDurationInSeconds: z.number(),
        coverImageUrl: z.string().nullable(),
        createdAt: z.iso.datetime(),
        updatedAt: z.iso.datetime(),
        exercises: z.array(
          z.object({
            id: z.uuid(),
            name: z.string(),
            order: z.number(),
            workoutDayId: z.uuid(),
            sets: z.number(),
            reps: z.number(),
            restTimeInSeconds: z.number(),
            createdAt: z.iso.datetime(),
            updatedAt: z.iso.datetime(),
          }),
        ),
      }),
    ),
  }),
);

export const WorkoutPlanByIdParamsSchema = z.object({
  id: z.uuid(),
});

export const WorkoutPlanByIdResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  workoutDays: z.array(
    z.object({
      id: z.uuid(),
      weekDay: z.enum(WeekDay),
      name: z.string(),
      isRestDay: z.boolean(),
      coverImageUrl: z.string().optional(),
      estimatedDurationInSeconds: z.number(),
      exercisesCount: z.number(),
    }),
  ),
});

export const WorkoutDayByIdParamsSchema = z.object({
  planId: z.uuid(),
  dayId: z.uuid(),
});

export const WorkoutDayByIdResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  isRest: z.boolean(),
  coverImageUrl: z.string().optional(),
  estimatedDurationInSeconds: z.number(),
  exercises: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      order: z.number(),
      workoutDayId: z.uuid(),
      sets: z.number(),
      reps: z.number(),
      restTimeInSeconds: z.number(),
    }),
  ),
  weekDay: z.enum(WeekDay),
  sessions: z.array(
    z.object({
      id: z.uuid(),
      workoutDayId: z.uuid(),
      startedAt: z.string().optional(),
      completedAt: z.string().optional(),
    }),
  ),
});

export const UpdateWorkoutSessionParamsSchema = z.object({
  planId: z.uuid(),
  dayId: z.uuid(),
  sessionId: z.uuid(),
});

export const UpdateWorkoutSessionBodySchema = z.object({
  completedAt: z.iso.datetime(),
});

export const WorkoutSessionResponseSchema = z.object({
  userWorkoutSessionId: z.uuid(),
});

export const UpdateWorkoutSessionResponseSchema = z.object({
  id: z.uuid(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
});

export const HomeParamsSchema = z.object({
  date: z.iso.date(),
});

export const HomeResponseSchema = z.object({
  activeWorkoutPlanId: z.uuid(),
  todayWorkoutDay: z.object({
    id: z.uuid(),
    name: z.string(),
    isRestDay: z.boolean(),
    weekDay: z.enum(WeekDay),
    estimatedTimeInSeconds: z.number(),
    coverImageUrl: z.string().optional(),
    exercisesCount: z.number(),
  }),
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.iso.date(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
});

export const StatsQuerySchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
});

export const StatsResponseSchema = z.object({
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.iso.date(),
    z.object({
      workoutDayStarted: z.boolean(),
      workoutDayCompleted: z.boolean(),
    }),
  ),
  completedWorkoutsCount: z.number(),
  conclusionRate: z.number(),
  totalTimeInSeconds: z.number(),
});
