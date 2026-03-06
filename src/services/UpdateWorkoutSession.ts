import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
  workoutSessionId: string;
  completedAt: string;
}

export interface OutputDto {
  id: string;
  startedAt: string;
  completedAt: string;
}

export class UpdateWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutSession = await prisma.workoutSession.findUnique({
      where: {
        id: dto.workoutSessionId,
      },
      include: {
        workoutDay: {
          include: {
            workoutPlan: true,
          },
        },
      },
    });

    if (!workoutSession) {
      throw new NotFoundError("Workout session not found");
    }

    if (workoutSession.workoutDay.id !== dto.workoutDayId) {
      throw new NotFoundError("Workout session not found");
    }

    if (workoutSession.workoutDay.workoutPlan.id !== dto.workoutPlanId) {
      throw new NotFoundError("Workout session not found");
    }

    if (workoutSession.workoutDay.workoutPlan.userId !== dto.userId) {
      throw new NotFoundError("Workout session not found");
    }

    const updatedWorkoutSession = await prisma.workoutSession.update({
      where: {
        id: dto.workoutSessionId,
      },
      data: {
        completedAt: dto.completedAt,
      },
    });

    return {
      id: updatedWorkoutSession.id,
      startedAt: updatedWorkoutSession.startedAt.toISOString(),
      completedAt:
        updatedWorkoutSession.completedAt?.toISOString() ?? dto.completedAt,
    };
  }
}
