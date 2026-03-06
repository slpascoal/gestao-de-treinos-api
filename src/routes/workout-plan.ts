import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import {
  NotFoundError,
  WorkoutPlanNotActiveError,
  WorkoutSessionAlreadyStartedError,
} from "../errors/index.js";
import { auth } from "../lib/auth.js";
import {
  ErrorSchema,
  UpdateWorkoutSessionBodySchema,
  UpdateWorkoutSessionParamsSchema,
  UpdateWorkoutSessionResponseSchema,
  WorkoutDayByIdParamsSchema,
  WorkoutDayByIdResponseSchema,
  WorkoutPlanByIdParamsSchema,
  WorkoutPlanByIdResponseSchema,
  WorkoutPlanSchema,
  WorkoutSessionParamsSchema,
  WorkoutSessionResponseSchema,
} from "../schemas/index.js";
import {
  CreateWorkoutPlan,
  type OutputDto,
} from "../services/CreateWorkoutPlans.js";
import {
  GetWorkoutDayById,
  type OutputDto as GetWorkoutDayByIdOutput,
} from "../services/GetWorkoutDayById.js";
import {
  GetWorkoutPlanById,
  type OutputDto as GetWorkoutPlanByIdOutput,
} from "../services/GetWorkoutPlanById.js";
import {
  type OutputDto as StartSessionOutput,
  StartWorkoutSession,
} from "../services/StartWorkoutSession.js";
import {
  type OutputDto as UpdateSessionOutput,
  UpdateWorkoutSession,
} from "../services/UpdateWorkoutSession.js";

export const workoutPlanRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Workout Plan"],
      summary: "Create a workout plan",
      body: WorkoutPlanSchema.omit({ id: true }),
      response: {
        201: WorkoutPlanSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        });
        if (!session) {
          return reply.status(401).send({
            error: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }
        const createWorkoutPlan = new CreateWorkoutPlan();
        const result: OutputDto = await createWorkoutPlan.execute({
          userId: session.user.id,
          name: request.body.name,
          coverImageUrl: request.body.coverImageUrl,
          workoutDays: request.body.workoutDays,
        });
        return reply.status(201).send(result);
      } catch (error) {
        app.log.error(error);
        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND",
          });
        }
        return reply.status(500).send({
          error: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:id",
    schema: {
      tags: ["Workout Plan"],
      summary: "Get a workout plan by id",
      params: WorkoutPlanByIdParamsSchema,
      querystring: z.object({}),
      response: {
        200: WorkoutPlanByIdResponseSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        });
        if (!session) {
          return reply.status(401).send({
            error: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const getWorkoutPlanById = new GetWorkoutPlanById();
        const result: GetWorkoutPlanByIdOutput =
          await getWorkoutPlanById.execute({
            userId: session.user.id,
            workoutPlanId: request.params.id,
          });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);
        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND",
          });
        }
        return reply.status(500).send({
          error: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:planId/days/:dayId",
    schema: {
      tags: ["Workout Plan"],
      summary: "Get a workout day by id",
      params: WorkoutDayByIdParamsSchema,
      querystring: z.object({}),
      response: {
        200: WorkoutDayByIdResponseSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        });
        if (!session) {
          return reply.status(401).send({
            error: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const getWorkoutDayById = new GetWorkoutDayById();
        const result: GetWorkoutDayByIdOutput = await getWorkoutDayById.execute(
          {
            userId: session.user.id,
            workoutPlanId: request.params.planId,
            workoutDayId: request.params.dayId,
          },
        );

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);
        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND",
          });
        }
        return reply.status(500).send({
          error: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/:planId/days/:dayId/sessions",
    schema: {
      tags: ["Workout Sessions"],
      summary: "Start a workout session",
      params: WorkoutSessionParamsSchema,
      body: z.object({}),
      response: {
        201: WorkoutSessionResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        });
        if (!session) {
          return reply.status(401).send({
            error: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const startService = new StartWorkoutSession();
        const result: StartSessionOutput = await startService.execute({
          userId: session.user.id,
          workoutPlanId: request.params.planId,
          workoutDayId: request.params.dayId,
        });

        return reply.status(201).send(result);
      } catch (error) {
        app.log.error(error);
        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND",
          });
        }
        if (error instanceof WorkoutPlanNotActiveError) {
          return reply.status(400).send({
            error: error.message,
            code: "WORKOUT_PLAN_NOT_ACTIVE",
          });
        }
        if (error instanceof WorkoutSessionAlreadyStartedError) {
          return reply.status(409).send({
            error: error.message,
            code: "SESSION_ALREADY_STARTED",
          });
        }
        return reply.status(500).send({
          error: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/:planId/days/:dayId/sessions/:sessionId",
    schema: {
      tags: ["Workout Sessions"],
      summary: "Update a workout session",
      params: UpdateWorkoutSessionParamsSchema,
      body: UpdateWorkoutSessionBodySchema,
      response: {
        200: UpdateWorkoutSessionResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        });
        if (!session) {
          return reply.status(401).send({
            error: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const updateService = new UpdateWorkoutSession();
        const result: UpdateSessionOutput = await updateService.execute({
          userId: session.user.id,
          workoutPlanId: request.params.planId,
          workoutDayId: request.params.dayId,
          workoutSessionId: request.params.sessionId,
          completedAt: request.body.completedAt,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);
        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND",
          });
        }
        return reply.status(500).send({
          error: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });
};
