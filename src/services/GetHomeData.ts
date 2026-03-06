import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

interface InputDto {
  userId: string;
  date: string;
}

interface ConsistencyItemDto {
  workoutDayCompleted: boolean;
  workoutDayStarted: boolean;
}

export interface OutputDto {
  activeWorkoutPlanId: string;
  todayWorkoutDay: {
    id: string;
    name: string;
    isRestDay: boolean;
    weekDay: WeekDay;
    estimatedTimeInSeconds: number;
    coverImageUrl?: string;
    exercisesCount: number;
  };
  workoutStreak: number;
  consistencyByDay: Record<string, ConsistencyItemDto>;
}

const weekDayByIndex: Record<number, WeekDay> = {
  0: WeekDay.SUNDAY,
  1: WeekDay.MONDAY,
  2: WeekDay.TUESDAY,
  3: WeekDay.WEDNESDAY,
  4: WeekDay.THURSDAY,
  5: WeekDay.FRIDAY,
  6: WeekDay.SATURDAY,
};

export class GetHomeData {
  async execute(dto: InputDto): Promise<OutputDto> {
    const targetDate = dayjs(dto.date).utc();

    const dayStart = targetDate.startOf("day");
    const dayEnd = targetDate.endOf("day");
    const weekStart = dayStart.subtract(dayStart.day(), "day");
    const weekEnd = weekStart.add(6, "day").endOf("day");

    const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActive: true,
      },
      include: {
        workoutDays: {
          include: {
            exercises: true,
          },
        },
      },
    });

    if (!activeWorkoutPlan) {
      throw new NotFoundError("Active workout plan not found");
    }

    const expectedWeekDay = weekDayByIndex[dayStart.day()];
    const todayWorkoutDay = activeWorkoutPlan.workoutDays.find(
      (workoutDay) => workoutDay.weekDay === expectedWeekDay,
    );

    if (!todayWorkoutDay) {
      throw new NotFoundError("Workout day not found for provided date");
    }

    const weekSessions = await prisma.workoutSession.findMany({
      where: {
        startedAt: {
          gte: weekStart.toDate(),
          lte: weekEnd.toDate(),
        },
        workoutDay: {
          workoutPlan: {
            userId: dto.userId,
          },
        },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    const consistencyByDay: Record<string, ConsistencyItemDto> = {};

    Array.from({ length: 7 }).forEach((_, index) => {
      const key = weekStart.add(index, "day").format("YYYY-MM-DD");
      consistencyByDay[key] = {
        workoutDayCompleted: false,
        workoutDayStarted: false,
      };
    });

    weekSessions.forEach((session) => {
      const key = dayjs(session.startedAt).utc().format("YYYY-MM-DD");
      const current = consistencyByDay[key];

      if (!current) {
        return;
      }

      consistencyByDay[key] = {
        workoutDayStarted: true,
        workoutDayCompleted:
          current.workoutDayCompleted || !!session.completedAt,
      };
    });

    const completedSessions = await prisma.workoutSession.findMany({
      where: {
        startedAt: {
          lte: dayEnd.toDate(),
        },
        completedAt: {
          not: null,
        },
        workoutDay: {
          workoutPlan: {
            userId: dto.userId,
          },
        },
      },
      select: {
        startedAt: true,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    const completedDays = new Set(
      completedSessions.map((session) =>
        dayjs(session.startedAt).utc().format("YYYY-MM-DD"),
      ),
    );

    let workoutStreak = 0;
    let cursorDate = dayStart;

    while (completedDays.has(cursorDate.format("YYYY-MM-DD"))) {
      workoutStreak += 1;
      cursorDate = cursorDate.subtract(1, "day");
    }

    return {
      activeWorkoutPlanId: activeWorkoutPlan.id,
      todayWorkoutDay: {
        id: todayWorkoutDay.id,
        name: todayWorkoutDay.name,
        isRestDay: todayWorkoutDay.isRest,
        weekDay: todayWorkoutDay.weekDay,
        estimatedTimeInSeconds: todayWorkoutDay.estimatedDurationInSeconds,
        ...(todayWorkoutDay.coverImageUrl
          ? { coverImageUrl: todayWorkoutDay.coverImageUrl }
          : {}),
        exercisesCount: todayWorkoutDay.exercises.length,
      },
      workoutStreak,
      consistencyByDay,
    };
  }
}
