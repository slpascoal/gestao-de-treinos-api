import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";

import { auth } from "../lib/auth.js";
import { WorkoutPlanSchema } from "../schemas/index.js";
import { CreateWorkoutPlan } from "../services/CreateWorkoutPlans.js";

export const aiRoutes = async (app: FastifyInstance) => {
  app.post("/ai", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.status(401).send({
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      });
    }

    const { messages } = request.body as { messages: UIMessage[] };
    const result = streamText({
      model: "google/gemini-3-flash",
      system: "",
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
              workoutDays: input.workoutDays,
            });

            return result;
          },
        }),
        getWorkoutPlans: tool({}),
        updateUserTrainData: tool({}),
        getUserTrainData: tool({}),
      },
      stopWhen: stepCountIs(5),
      messages: await convertToModelMessages(messages),
    });
    const response = result.toUIMessageStreamResponse();
    reply.status(response.status);
    response.headers.forEach((value, key) => reply.header(key, value));

    return reply.send(response.body);
  });
};
