import {
  GetWorkoutPlans,
  type OutputDto as GetWorkoutPlansOutput,
} from "./GetWorkoutPlans.js";

interface InputDto {
  userId: string;
}

export class ListWorkoutPlans {
  async execute(dto: InputDto): Promise<GetWorkoutPlansOutput[]> {
    const getWorkoutPlans = new GetWorkoutPlans();

    return getWorkoutPlans.execute({
      userId: dto.userId,
    });
  }
}
