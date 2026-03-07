import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
}

export interface OutputDto {
  userId: string;
  userName: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
}

export class GetUserTrainData {
  async execute(dto: InputDto): Promise<OutputDto | null> {
    const user = await prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
      select: {
        id: true,
        name: true,
        weightInGrams: true,
        heightInCm: true,
        age: true,
        bodyFatPercentage: true,
      },
    });

    if (!user) {
      return null;
    }

    if (
      user.weightInGrams === null ||
      user.heightInCm === null ||
      user.age === null ||
      user.bodyFatPercentage === null
    ) {
      return null;
    }

    return {
      userId: user.id,
      userName: user.name,
      weightInGrams: user.weightInGrams,
      heightInCentimeters: user.heightInCm,
      age: user.age,
      bodyFatPercentage: user.bodyFatPercentage,
    };
  }
}
