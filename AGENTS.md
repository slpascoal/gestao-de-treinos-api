# AGENTS.md - Development Guidelines

This document provides essential guidance for agentic coding agents operating in this repository.

## Project Overview

- **Name:** Gestão de Treinos API
- **Language:** TypeScript
- **Framework:** Fastify (v5.7.4)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** Better-Auth
- **Validation:** Zod
- **Node Version:** 24.x

## Build, Test & Lint Commands

### Development

```bash
npm run dev              # Start dev server with hot-reload (tsx watch)
```

### Linting & Formatting

```bash
npm run lint            # Run ESLint on the entire codebase
npm run lint -- --fix   # Auto-fix linting issues
```

### Build

- No explicit build script (TypeScript compilation via tsx)
- Code is executed directly with tsx in dev mode

### Testing

- **No test framework currently configured** (Jest/Vitest not installed)
- To run a test when framework is added: `npm test -- path/to/test.ts`

## Code Style Guidelines

### Imports & Ordering

- Use `simple-import-sort` ESLint plugin (enforced)
- Import order:
  1. External libraries (npm packages)
  2. Relative imports (use `.js` extension for ES modules)
  3. Exports (if applicable)
- Example:

  ```typescript
  import Fastify from "fastify";
  import { ZodTypeProvider } from "fastify-type-provider-zod";

  import { CreateWorkoutPlan } from "../services/CreateWorkoutPlans.js";
  import { ErrorSchema } from "../schemas/index.js";
  ```

### Formatting & General Rules

- **Semicolons:** Always required (ESLint enforces `"semi": ["error", "always"]`)
- **Prettier:** Enabled with auto-format on save in VS Code
- **Line length:** Prettier default (80 characters)
- **Indentation:** 2 spaces

### TypeScript & Types

- **Strict Mode:** Enabled in `tsconfig.json`
- **Target:** ES2024
- **Module:** nodenext (ES modules)
- **File Extensions:** Use `.js` in import paths for ES modules
  ```typescript
  import { auth } from "../lib/auth.js"; // Correct
  ```
- Always explicitly type function parameters and return types
- Use interfaces for DTOs (Data Transfer Objects):
  ```typescript
  interface InputDto {
    userId: string;
    name: string;
  }
  ```

### Naming Conventions

- **Files:** kebab-case for routes/utilities (e.g., `workout-plan.ts`)
- **Classes:** PascalCase (e.g., `CreateWorkoutPlan`, `NotFoundError`)
- **Functions/Variables:** camelCase (e.g., `executeQuery`, `userId`)
- **Constants:** UPPER_SNAKE_CASE
- **Interfaces/Types:** PascalCase with prefix (e.g., `InputDto`, `OutputDto`)

### Error Handling

- Use custom error classes extending `Error` with descriptive names
- Example in `src/errors/index.ts`:
  ```typescript
  export class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "NotFoundError";
    }
  }
  ```
- Always catch errors in route handlers and return appropriate HTTP status codes
- Log errors using `app.log.error(error)` for debugging
- Return structured error responses with `error` and `code` fields:
  ```typescript
  reply.status(404).send({
    error: "Resource not found",
    code: "NOT_FOUND",
  });
  ```

### Validation & Schemas

- Use Zod for schema validation (enforced via `fastify-type-provider-zod`)
- Define schemas in `src/schemas/index.ts`
- Use schemas in route handlers via `request.body` (auto-validated)
- Example schema:
  ```typescript
  export const WorkoutPlanSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(1),
  });
  ```

### Database & ORM

- Use Prisma Client (`@prisma/client`)
- Initialize via `src/lib/db.js`
- Use transactions for multi-step operations:
  ```typescript
  return prisma.$transaction(async (prisma) => {
    // Multiple operations
  });
  ```
- Organize database operations in service classes
- Services use dependency injection pattern (pass prisma instance)

### Route Structure

- Define routes as async functions in `src/routes/` directory
- Use Fastify's `app.route()` with ZodTypeProvider
- Always define response schemas for all HTTP status codes
- Handler logic:
  1. Authenticate if needed
  2. Validate request (auto via Zod)
  3. Execute business logic
  4. Handle errors with try-catch
  5. Return appropriate status code with data

### Service Classes

- Implement business logic in `src/services/` directory
- Class names: PascalCase with action verb prefix (e.g., `CreateWorkoutPlan`)
- Use `async execute()` as primary method
- Accept DTOs with typed interfaces as parameters
- Throw custom errors for failure cases

### Project Structure

```
src/
├── index.ts              # Fastify app setup, route registration
├── errors/               # Custom error classes
├── lib/                  # Utilities (auth, db, etc.)
├── routes/               # API route handlers
├── schemas/              # Zod validation schemas
├── services/             # Business logic & use cases
└── generated/            # Auto-generated (Prisma)
```

## Development Workflow

1. **Before making changes:** Run `npm run lint` to check current state
2. **While developing:** Changes auto-format on save (Prettier)
3. **After changes:** Run `npm run lint -- --fix` to auto-fix issues
4. **Testing:** Add tests when framework is configured
5. **Environment:** Copy `.env` template and update with local values

## Notes for Agents

- **Avoid breaking changes** in public APIs without discussion
- **Keep routes stateless** (use services for state management)
- **Always close database connections** (Prisma handles this)
- **Use app.log** instead of console for logging
- **Test changes locally** with `npm run dev` before committing
- **Check for TypeScript errors** - strict mode is enabled
