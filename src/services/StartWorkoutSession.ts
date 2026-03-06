import {
  NotFoundError,
  WorkoutPlanNotActiveError,
  WorkoutSessionAlreadyStartedError,
} from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}

export interface OutputDto {
  userWorkoutSessionId: string;
}

export class StartWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutDay = await prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId },
      include: {
        workoutPlan: true,
        sessions: true,
      },
    });

    if (!workoutDay || workoutDay.workoutPlanId !== dto.workoutPlanId) {
      throw new NotFoundError("Workout day not found");
    }

    const plan = workoutDay.workoutPlan;

    if (plan.userId !== dto.userId) {
      throw new NotFoundError("Workout plan not found");
    }

    if (!plan.isActive) {
      throw new WorkoutPlanNotActiveError("Workout plan is not active");
    }

    if (workoutDay.sessions.length > 0) {
      throw new WorkoutSessionAlreadyStartedError(
        "Workout session already started for this day",
      );
    }

    const session = await prisma.workoutSession.create({
      data: {
        workoutDayId: dto.workoutDayId,
        startedAt: new Date(),
      },
    });

    return {
      userWorkoutSessionId: session.id,
    };
  }
}
