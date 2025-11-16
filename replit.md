# ProCoach - Football Team Management System

## Overview

ProCoach is a comprehensive full-stack web application designed for football team management. It empowers coaches and staff to manage players, teams, training sessions, matches, tactics, and generate performance reports. The project aims to provide a modern, efficient, and user-friendly platform for all aspects of football team administration, tracking player development, optimizing tactical approaches, and streamlining club operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query for server state
- **UI Framework**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Session Management**: express-session with PostgreSQL store

### Database Design
Core entities include Users, Players, Teams, Training Sessions, Matches, Tactical Formations, and Analytics Reports.

### Key Features
- **Authentication & Authorization**: Role-based access control (head_coach, assistant_coach, admin) with session-based authentication.
- **Player Management**: Comprehensive profiles, statistics, and performance tracking.
- **Team Organization**: Multiple team categories and dynamic player assignment.
- **Training System**: Flexible scheduling, attendance tracking, and session categorization (technical, fitness, tactical, match_prep).
- **Tactical Planning**: Interactive board with drag-and-drop, formation templates, and custom formations.
- **Analytics & Reporting**: Performance metrics, KPI tracking, automated report generation, data visualization, and export capabilities.
- **Financial Management**: Monthly budgets, salary summation, and expense control.
- **Wearable Device Integration**: Custom system for Fitbit, Garmin, Oura, Apple Watch, Polar device data.
- **Regional Settings**: Support for multiple timezones and currencies (USD, EUR, SAR, QAR, AED, OMR, KWD, BHD, GBP, JPY).
- **UI/UX**: Professional design with sidebar navigation, modern components, interactive charts (Recharts), and responsive layouts. Custom SVG icons and a consistent design system are used throughout.
- **Dashboard Navigation**: All dashboard cards and quick actions are fully clickable with navigation to their respective pages. Includes hover effects, visual feedback, and smooth transitions for better user experience.

## External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Form Validation**: Zod
- **Charting**: Recharts
- **Tactical Board Drawing**: React-Konva
- **External APIs**: Prepared for email service providers, Catapult OpenField API (with mock data structure), and custom wearable device APIs.