# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands

- `pnpm dev` - Start development server on port 6121
- `pnpm build` - Build production bundle (runs build-and-notify.sh)
- `pnpm start` - Start production server on port 3000
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm formate` - Format code with Prettier

### Database Commands

- `pnpm db:push` - Push database schema changes to database
- `pnpm db:gen` - Generate Prisma client types
- `pnpm db:dev` - Run database migrations in development
- `pnpm db:studio` - Launch Prisma Studio for database management

### Other Commands

- `pnpm postbuild` - Generate sitemap after build
- `pnpm build:analyzer` - Build with bundle analyzer
- `pnpm cz` - Use commitizen for conventional commits

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: NextAuth v5 (GitHub/Google OAuth)
- **Search**: Meilisearch for full-text search
- **Caching**: Redis with ioredis
- **Markdown**: Bytemd for editing and rendering
- **File Storage**: Cloudflare R2 (AWS S3 compatible) for image uploads
- **Image Processing**: Sharp for WebP compression

### Core Models

- **User**: Authentication and user management
- **Blog**: Blog posts with markdown content
- **Note**: Simple notes (admin only)
- **Tag**: Categorization system with type enum (ALL, BLOG, NOTE)
- **MessageBoard**: Public message board functionality

### Directory Structure

- `app/` - Next.js 14 app directory with route handlers
- `features/` - Feature-based architecture with actions, API, components, pages
- `components/` - Reusable UI components
- `lib/` - Utility libraries and configurations
- `config/` - Configuration files (auth, db, env)
- `prisma/` - Database schema and migrations
- `constants/` - Application constants and configuration

### Key Features

- **Feature-based Architecture**: Each feature (blog, note, tag, auth, admin, home, statistics, upload, user) has its own directory with actions, API, components, and pages
- **Admin Panel**: Full CRUD operations for content management at `/admin`
- **Search Integration**: Meilisearch powers full-text search across blogs
- **Image Optimization**: Sharp converts uploads to WebP format
- **SEO**: Automatic sitemap generation and meta tag handling
- **Theming**: Dark/light theme support with next-themes

### Development Workflow

1. Database changes require running `pnpm db:push` followed by `pnpm db:gen`
2. After running `pnpm db:gen`, restart VS Code to reload TypeScript types
3. Admin access is controlled by `NEXT_PUBLIC_ADMIN_EMAILS` environment variable
4. Use Prisma Studio (`pnpm db:studio`) for database inspection during development

### Build Process

- **Custom Build Script**: Uses `build-and-notify.sh` that runs `next build` and sends build status notifications via Bark
- **Post-Build**: Automatically generates sitemap using `next-sitemap`
- **Bundle Analysis**: Use `pnpm build:analyzer` to analyze bundle size with webpack analyzer
- **Build Notifications**: Sends success/failure notifications to Bark service at `https://bark.jiachz.com/` with status, timestamp, and server IP

### Environment Setup

- Requires Node.js >= 20 and pnpm
- Database: PostgreSQL (can be MySQL by changing datasource in schema.prisma)
- Redis for caching and analytics (host: `REDIS_HOST`, port: `REDIS_PORT`)
- Meilisearch for search functionality (host: `NEXT_PUBLIC_MEILISEARCH_HOST`, key: `NEXT_PUBLIC_MEILISEARCH_KEY`)
- Configure `.env` for Prisma DATABASE_URL
- Configure `.env.development` for NextAuth and other services

### Authentication Configuration

- **NextAuth v5**: JWT session strategy for Edge compatibility
- **OAuth Providers**: GitHub (`AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`) and Google (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)
- **Admin Control**: Email whitelist in `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated)
- **Password Auth**: bcrypt-based credential provider with database user creation
- **Session Management**: Prisma adapter with automatic account linking

### Search Configuration

- **Meilisearch Server**: Dedicated search server for full-text search
- **Search Indexes**:
  - `blogs` - Blog post search index
- **Environment Variables**: `NEXT_PUBLIC_MEILISEARCH_HOST` and `NEXT_PUBLIC_MEILISEARCH_KEY`

### File Storage

- **Provider**: Cloudflare R2 (AWS S3 compatible)
- **Bucket**: `jiachz-blog` (configurable per environment)
- **Image Processing**: Sharp compression to WebP format
- **Upload Directory**: `images/` prefix for all uploads
- **Configuration**: AWS SDK credentials for R2 access

### Custom Components

- **Bytemd Integration**: Custom markdown editor with plugins for enhanced editing
- **Icon System**: Uses @iconify with custom icon components organized by category (fa6-brands, logos, skills)
- **Illustrations**: Custom SVG illustrations with dark/light theme variants
- **UI Components**: Built on Radix UI primitives with Tailwind styling

### User Activity Logging

- **Comprehensive Logging**: Tracks all user activities with UserActivityLog model
- **Activity Types**: Login, registration, CRUD operations, file uploads, admin access
- **Security Analysis**: Suspicious activity detection, risk scoring, device fingerprinting
- **Location Tracking**: IP-based location detection with country, region, city
- **Device Detection**: Browser, OS, and device type identification

### Important Notes

- **Personal Information**: Site configuration in `constants/info.ts` contains personal details
- **Build Notifications**: Custom build script sends notifications to Bark service
- **Admin Control**: Admin access controlled by `NEXT_PUBLIC_ADMIN_EMAILS` environment variable
- **Next.js 15 Compatibility**: Includes workarounds for Next.js 15 sync dynamic API checks

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
