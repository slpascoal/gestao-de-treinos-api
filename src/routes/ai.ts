import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { auth } from "../lib/auth.js";
import {
  ErrorSchema,
  updateUserTrainDataInputSchema,
  WorkoutPlanSchema,
} from "../schemas/index.js";
import { CreateWorkoutPlan } from "../services/CreateWorkoutPlans.js";
import { GetUserTrainData } from "../services/GetUserTrainData.js";
import { ListWorkoutPlans } from "../services/ListWorkoutPlans.js";
import { UpsertUserTrainData } from "../services/UpsertUserTrainData.js";
import { aiSystem } from "../utils/aiSystem.js";

const aiRequestBodySchema = z.object({
  messages: z.array(z.unknown()),
});

export const aiRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["AI"],
      summary: "Chat with virtual personal trainer",
      body: aiRequestBodySchema,
      response: {
        200: z.unknown(),
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session) {
        return reply.status(401).send({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      const messages = request.body.messages as UIMessage[];
      const result = streamText({
        model: "google/gemini-3-flash",
        system: aiSystem,
        tools: {
          createWorkoutPlan: tool({
            description:
              "Create a workout plan for the user based on their preferences and goals.",
            inputSchema: WorkoutPlanSchema,
            execute: async (input) => {
              const createWorkoutPlan = new CreateWorkoutPlan();
              const result = await createWorkoutPlan.execute({
                userId: session.user.id,
                name: input.name,
                coverImageUrl: input.coverImageUrl,
                workoutDays: input.workoutDays,
              });

              return result;
            },
          }),
          getWorkoutPlans: tool({
            description: "List all workout plans for the authenticated user.",
            inputSchema: z.object({}),
            execute: async () => {
              const listWorkoutPlans = new ListWorkoutPlans();
              const result = await listWorkoutPlans.execute({
                userId: session.user.id,
              });

              return result;
            },
          }),
          updateUserTrainData: tool({
            description:
              "Create or update authenticated user train data. Weight must be sent in grams.",
            inputSchema: updateUserTrainDataInputSchema,
            execute: async (input) => {
              const upsertUserTrainData = new UpsertUserTrainData();
              const result = await upsertUserTrainData.execute({
                userId: session.user.id,
                weightInGrams: input.weightInGrams,
                heightInCentimeters: input.heightInCentimeters,
                age: input.age,
                bodyFatPercentage: input.bodyFatPercentage,
              });

              return result;
            },
          }),
          getUserTrainData: tool({
            description: "Get authenticated user train data.",
            inputSchema: z.object({}),
            execute: async () => {
              const getUserTrainData = new GetUserTrainData();
              const result = await getUserTrainData.execute({
                userId: session.user.id,
              });

              return result;
            },
          }),
        },
        stopWhen: stepCountIs(5),
        messages: await convertToModelMessages(messages),
      });
      const response = result.toUIMessageStreamResponse();
      reply.status(200);
      response.headers.forEach((value, key) => reply.header(key, value));

      return reply.send(response.body);
    },
  });
};
