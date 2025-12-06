# OakBun 🌳

> 🚧 **Status: Alpha / Active Development**
>
> This framework is currently in an early **Alpha** stage. APIs are subject to change without notice. Please use with caution in production environments. Feedback and contributions are highly appreciated\!

A lightweight, opinionated backend framework for **Bun**, built on top of **Hono** and **Drizzle ORM**.

OakBun prioritizes type safety and a structured architecture. It abstracts common patterns (Services, Controllers, Routes) to boost productivity while maintaining full flexibility when you need it.

## Features

  * 🚀 **Bun Native:** Optimized specifically for the Bun runtime.
  * 🗄️ **Drizzle ORM Integration:** Type-safe database schemas and queries out of the box.
  * 🛡️ **Validation:** Integrated Zod validation directly within the router.
  * ⚡ **Hono Powered:** Utilizing an ultra-fast HTTP layer under the hood.
  * 🧩 **Modular Architecture:** Clear separation of concerns: Schema, Service, Controller, and Route.
  * 🔌 **Plugin System:** Easily extensible (e.g., Audit Logs, Auth).

## Installation

```bash
bun add oakbun
bun add drizzle-orm # Peer Dependency
bun add -d drizzle-kit # For migrations
```

## Quick Start

OakBun follows a clear structure. Here is an example of a simple "Todo" resource.

### 1\. Define Schema (Database)

Create your tables using `defineTable`. Timestamp columns (`createdAt`, `updatedAt`) are included automatically via `.timestamps()`.

```typescript
// src/schema/todo.ts
import { text, boolean } from "drizzle-orm/pg-core";
import { defineTable } from "oakbun/schema";

export const todoTable = defineTable('todo').columns({
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    done: boolean('done').default(false)
}).timestamps().build();
```

### 2\. Define Service (Logic)

Services contain your business logic. You can utilize hooks (`beforeStore`, `afterUpdate`, etc.) to intercept operations.

```typescript
// src/api/todo/service.ts
import { defineService } from "oakbun";

export const todoService = defineService('todo')
    .hooks({
        beforeStore: async (data) => {
            console.log('Creating new Todo:', data);
            return data;
        }
    });
```

### 3\. Define Controller (HTTP)

Connects your Service to the HTTP layer. Standard CRUD operations (Index, Show, Store, Update, Destroy) are generated automatically but can be overridden or extended.

```typescript
// src/api/todo/controller.ts
import { defineController } from "oakbun";

export const todoController = defineController('todo');
```

### 4\. Define Route (Wiring & Validation)

Maps the Controller to URLs and validates input using Zod **before** the request reaches the Controller.

```typescript
// src/api/todo/route.ts
import { defineRoute } from "oakbun";
import { z } from "zod";

export const todoRoute = defineRoute('todo')
    .validate({
        store: z.object({
            title: z.string().min(3),
            done: z.boolean().optional()
        })
    });
```

### 5\. Start the App

Bind everything together in your `src/index.ts`. OakBun automatically loads your defined resources.

```typescript
// src/index.ts
import { defineApplication } from "oakbun";

const { app } = await defineApplication(() => ({
    log: { showRoutes: true }
}));

export default {
    port: 3000,
    fetch: app.fetch
};
```

## CLI

OakBun comes with a CLI to help manage your development workflow.

```bash
# Starts the app (if configured in package.json)
bun run dev
```

## Repository & Contributing

The source code is available on GitHub. Bug reports and pull requests are welcome\!

👉 **[GitHub Repository: https://github.com/TortoiseCrafter/OakBun](https://github.com/TortoiseCrafter/OakBun)**

## License

MIT