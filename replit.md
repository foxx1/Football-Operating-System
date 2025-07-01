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

## Recent Changes

### July 1, 2025 - Database Migration and Currency Format Enhancement
✓ Migrated from MemStorage to DatabaseStorage for data persistence
✓ Switched to PostgreSQL database with permanent settings storage
✓ Fixed logo display in sidebar with persistent logo_url setting
✓ Updated currency formatting to use English abbreviations (BD, SR, AED, etc.)
✓ Replaced DollarSign icon with Wallet icon for multi-currency support
✓ Dashboard Monthly Budget now shows "BD15,000" format for Bahraini Dinar
✓ Settings persist across server restarts with database storage

### June 30, 2025 - Global Settings Context and Currency Integration
✓ Created global SettingsContext for cross-component settings sharing
✓ Fixed timezone and currency dropdown refresh issues in Settings page
✓ Implemented logo upload functionality with preview and global application
✓ Updated TopBar to display organization logo and name from global settings
✓ Added file upload API endpoint with proper validation (2MB limit, images only)
✓ Enhanced Dashboard with currency formatting examples using global settings
✓ Settings now save and apply globally with page refresh functionality
✓ Fixed dropdown value persistence for timezone and currency selections

### June 30, 2025 - Regional Settings and Currency Support
✓ Added comprehensive AST (Arabian Standard Time) timezone support for Middle East regions
✓ Implemented multi-currency preferences: USD, EUR, SAR, QAR, AED, OMR, KWD, BHD, GBP, JPY
✓ Enhanced Settings page with dedicated "Regional & Currency Settings" section
✓ Fixed all API request format issues in Staff and Settings components
✓ Added date format preferences (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY)
✓ Staff management now fully functional with proper CRUD operations
✓ Settings persist correctly with database integration

### June 29, 2025 - Runtime Error Resolution and TypeScript Fixes
✓ Fixed critical "Cannot read properties of undefined (reading 'id')" runtime error
✓ Resolved all TypeScript type issues in Players component with proper null checking
✓ Implemented defensive programming practices to prevent undefined object errors
✓ Updated AddPlayerDialog component integration and removed conflicting PlayerForm references
✓ Application now runs without runtime errors and maintains type safety
✓ API endpoints tested and confirmed working correctly for player CRUD operations

### June 29, 2025 - Database Integration and Form Optimization
✓ Fixed database connection issues and implemented fallback to in-memory storage
✓ Resized Add Player form to be screen-friendly (max-w-4xl, responsive grid layouts)
✓ Successfully tested API endpoints for player CRUD operations
✓ Verified application functionality with proper data flow
✓ PostgreSQL database provisioned and configured for future migration

### June 29, 2025 - Initial Setup
✓ Complete application foundation with React.js frontend and Node.js backend
✓ All 10 core modules: Dashboard, Players, Teams, Staff, Training, Matches, Tactics, Analytics, Reports, Settings
✓ Professional UI with sidebar navigation and modern design
✓ Database schema created with comprehensive football management entities

## User Preferences

Preferred communication style: Simple, everyday language.