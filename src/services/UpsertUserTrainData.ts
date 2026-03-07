import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
}

export interface OutputDto {
  userId: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
}

export class UpsertUserTrainData {
  async execute(dto: InputDto): Promise<OutputDto> {
    const existingUser = await prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
      select: {
        id: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    const user = await prisma.user.update({
      where: {
        id: dto.userId,
      },
      data: {
        weightInGrams: dto.weightInGrams,
        heightInCm: dto.heightInCentimeters,
        age: dto.age,
        bodyFatPercentage: dto.bodyFatPercentage,
      },
      select: {
        id: true,
        weightInGrams: true,
        heightInCm: true,
        age: true,
        bodyFatPercentage: true,
      },
    });

    return {
      userId: user.id,
      weightInGrams: user.weightInGrams ?? dto.weightInGrams,
      heightInCentimeters: user.heightInCm ?? dto.heightInCentimeters,
      age: user.age ?? dto.age,
      bodyFatPercentage: user.bodyFatPercentage ?? dto.bodyFatPercentage,
    };
  }
}
