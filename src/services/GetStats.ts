import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { prisma } from "../lib/db.js";

dayjs.extend(utc);

interface InputDto {
  userId: string;
  from: string;
  to: string;
}

interface ConsistencyItemDto {
  workoutDayStarted: boolean;
  workoutDayCompleted: boolean;
}

export interface OutputDto {
  workoutStreak: number;
  consistencyByDay: Record<string, ConsistencyItemDto>;
  completedWorkoutsCount: number;
  conclusionRate: number;
  totalTimeInSeconds: number;
}

export class GetStats {
  async execute(dto: InputDto): Promise<OutputDto> {
    const fromDate = dayjs(dto.from).utc().startOf("day");
    const toDate = dayjs(dto.to).utc().endOf("day");

    const sessions = await prisma.workoutSession.findMany({
      where: {
        startedAt: {
          gte: fromDate.toDate(),
          lte: toDate.toDate(),
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
      orderBy: {
        startedAt: "asc",
      },
    });

    const consistencyByDay: Record<string, ConsistencyItemDto> = {};

    sessions.forEach((session) => {
      const key = dayjs(session.startedAt).utc().format("YYYY-MM-DD");
      const current = consistencyByDay[key] ?? {
        workoutDayStarted: false,
        workoutDayCompleted: false,
      };

      consistencyByDay[key] = {
        workoutDayStarted: true,
        workoutDayCompleted:
          current.workoutDayCompleted || session.completedAt !== null,
      };
    });

    const completedWorkoutsCount = sessions.filter(
      (session) => session.completedAt !== null,
    ).length;

    const totalTimeInSeconds = sessions.reduce((total, session) => {
      if (!session.completedAt) {
        return total;
      }

      const startedAt = dayjs(session.startedAt).utc();
      const completedAt = dayjs(session.completedAt).utc();

      return total + completedAt.diff(startedAt, "second");
    }, 0);

    const conclusionRate =
      sessions.length > 0 ? completedWorkoutsCount / sessions.length : 0;

    const completedDays = Array.from(
      new Set(
        sessions
          .filter((session) => session.completedAt !== null)
          .map((session) =>
            dayjs(session.startedAt).utc().format("YYYY-MM-DD"),
          ),
      ),
    ).sort((left, right) => left.localeCompare(right));

    let workoutStreak = 0;
    let currentStreak = 0;
    let previousDay: string | null = null;

    completedDays.forEach((day) => {
      if (!previousDay) {
        currentStreak = 1;
      } else {
        const diffInDays = dayjs(day)
          .utc()
          .startOf("day")
          .diff(dayjs(previousDay).utc().startOf("day"), "day");

        currentStreak = diffInDays === 1 ? currentStreak + 1 : 1;
      }

      if (currentStreak > workoutStreak) {
        workoutStreak = currentStreak;
      }

      previousDay = day;
    });

    return {
      workoutStreak,
      consistencyByDay,
      completedWorkoutsCount,
      conclusionRate,
      totalTimeInSeconds,
    };
  }
}
