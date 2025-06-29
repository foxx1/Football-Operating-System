# ProCoach - Football Team Management System

## Overview

ProCoach is a comprehensive football team management application built as a full-stack web application. The system provides coaches and staff with tools to manage players, teams, training sessions, matches, tactics, and generate performance reports. The application follows a modern architecture with a React frontend and Express.js backend, utilizing PostgreSQL for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: express-session with PostgreSQL store
- **API Design**: RESTful endpoints with proper HTTP status codes

### Database Design
The system uses PostgreSQL with the following core entities:
- **Users**: Authentication and role-based access control
- **Players**: Player profiles with personal and performance data
- **Teams**: Team organization and categorization
- **Training Sessions**: Scheduling and session management
- **Matches**: Match scheduling and results
- **Tactical Formations**: Team formations and strategies
- **Analytics Reports**: Performance tracking and reporting

## Key Components

### Authentication & Authorization
- Role-based access control (head_coach, assistant_coach, admin)
- Session-based authentication with PostgreSQL storage
- Permission-based UI rendering and API access control

### Player Management
- Comprehensive player profiles with personal information
- Position-based categorization and jersey number assignment
- Medical notes and emergency contact information
- Player statistics and performance tracking

### Team Organization
- Multiple team categories (first_team, reserves, youth)
- Dynamic player assignment to teams
- Team-specific formations and tactics

### Training System
- Flexible training session scheduling
- Session type categorization (technical, fitness, tactical, match_prep)
- Attendance tracking and participation management
- Session notes and objectives

### Tactical Planning
- Interactive tactics board with drag-and-drop functionality
- Formation templates and custom formations
- Player positioning and role assignments
- Formation sharing and collaboration

### Analytics & Reporting
- Performance metrics and KPI tracking
- Automated report generation
- Data visualization and trend analysis
- Export capabilities for external analysis

## Data Flow

### Client-Server Communication
1. Frontend makes HTTP requests to Express.js API endpoints
2. API routes validate requests and authenticate users
3. Business logic processes requests using Drizzle ORM
4. Database operations are performed on PostgreSQL
5. Responses are formatted and returned to the client
6. TanStack Query handles caching and state synchronization

### Database Operations
- Drizzle ORM provides type-safe database queries
- Schema definitions shared between frontend and backend
- Migration system for database version control
- Connection pooling with Neon serverless PostgreSQL

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Custom session-based implementation
- **File Storage**: Local file system (expandable to cloud storage)
- **Email**: Prepared for integration with email service providers

### Third-Party Integrations
- **UI Components**: Radix UI for accessible, unstyled components
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation and formatting
- **Form Validation**: Zod for runtime type checking and validation

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with hot module replacement
- tsx for TypeScript execution in development
- Concurrent development of frontend and backend
- Environment-specific configuration management

### Production Build
- Frontend: Vite build with optimized bundle splitting
- Backend: esbuild compilation to ESM format
- Static asset serving through Express.js
- Database migrations through Drizzle Kit

### Environment Configuration
- Environment variables for database connections
- Separate configurations for development and production
- Replit-optimized development workflow
- Support for various deployment platforms

## Changelog

Changelog:
- June 29, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.