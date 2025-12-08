# GEMINI.md

## Project Overview

**jiachz_blog** is a modern, personal blog application built with Next.js 14+ (App Router), React 18, and TypeScript. It features a comprehensive admin dashboard, full-text search, and a robust authentication system. The project focuses on performance (SSR), SEO, and a polished user experience using Tailwind CSS and Shadcn/ui.

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (Canary) with App Router
- **Library:** React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Shadcn/ui (Radix UI primitives), generic CSS modules
- **State Management:** React Hooks, Ahooks
- **Markdown Editor:** Bytemd (with custom plugins)

### Backend
- **Database ORM:** Prisma
- **Database:** PostgreSQL (configured in `schema.prisma`), support for MySQL exists
- **Authentication:** NextAuth.js v5 (GitHub, Google, Credentials)
- **Search Engine:** Meilisearch
- **Caching/Stats:** Redis (ioredis)
- **Storage:** Cloudflare R2 (AWS S3 compatible) via `@aws-sdk/client-s3`
- **Image Processing:** Sharp

## Architecture

The project follows a **Feature-Based Architecture**, organizing code by domain rather than just technical type.

### Directory Structure
- **`app/`**: Next.js App Router routes and layouts.
  - `(root)/`: Public-facing pages (Blog, About, etc.).
  - `admin/`: Protected admin dashboard pages.
  - `api/`: Backend API routes (Next.js Route Handlers).
- **`features/`**: Core logic split by feature (e.g., `blog`, `auth`, `admin`, `note`, `user`). Contains actions, components, and hooks specific to that feature.
- **`components/`**: Shared/Global UI components (Header, Footer, specialized UI elements).
- **`lib/`**: Utility functions, external service configurations (Prisma, Redis, Meilisearch, S3).
- **`prisma/`**: Database schema (`schema.prisma`) and migrations.
- **`config/`**: App-wide configuration files.
- **`constants/`**: Static constants and info.

## Development & Usage

### Core Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the development server on port 6121 |
| `pnpm build` | Builds the production application (runs `build-and-notify.sh`) |
| `pnpm start` | Starts the production server on port 3000 |
| `pnpm lint` | Runs ESLint |
| `pnpm lint:fix` | Runs ESLint and automatically fixes issues |
| `pnpm formate` | Formats code using Prettier |

### Database Workflow

| Command | Description |
| :--- | :--- |
| `pnpm db:push` | Pushes the schema state to the database (prototyping) |
| `pnpm db:gen` | Generates the Prisma Client (run after schema changes) |
| `pnpm db:dev` | Runs migrations for development |
| `pnpm db:studio` | Opens Prisma Studio to view/edit data in the browser |

### Environment Setup

1.  **Node.js**: Requires Node.js >= 20.
2.  **Package Manager**: `pnpm`.
3.  **Environment Variables**:
    *   Create `.env` for `DATABASE_URL` (PostgreSQL) and `REDIS` config.
    *   Create `.env.development` for Auth secrets (`AUTH_GITHUB_ID`, `AUTH_GOOGLE_ID`) and Meilisearch config (`NEXT_PUBLIC_MEILISEARCH_HOST`).
4.  **Services**: Ensure PostgreSQL, Redis, and Meilisearch are running (Docker is recommended).

## Conventions & Standards

- **Commits**: Follows Conventional Commits (via `commitizen` / `cz-git`).
- **Styling**: Tailwind CSS for utility classes. Components often use `shadcn/ui` patterns.
- **Types**: Strict TypeScript usage. Run `pnpm db:gen` to update Prisma types after schema changes.
- **Notifications**: Integrated Bark notification system for build status and app events.
- **Linting**: ESLint + Prettier for code quality and formatting.
