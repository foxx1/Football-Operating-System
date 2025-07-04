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

### July 4, 2025 - Enhanced Team Creation with Youth Categories and Custom Categories
✓ **Expanded Team Categories**: Added Under 21, Under 19, Under 17, Under 15, and Academy-Rootgrass categories
✓ **Custom Category Option**: Users can now define their own team categories for specialized teams
✓ **Professional Form Design**: Enhanced team creation form with color-coded category badges and descriptions
✓ **Comprehensive Category Support**: Updated both form and display components to handle all new categories
✓ **Dynamic Category Input**: Custom category field appears when "Custom Category" is selected
✓ **Form Validation**: Added proper validation for custom category names when selected
✓ **Visual Enhancements**: Color-coded badges for each category type with consistent styling
✓ **Accessibility Improvements**: Fixed dialog accessibility warnings with proper titles and descriptions
✓ **Category Display**: Updated team cards to properly display and format all new category types
✓ **Database Integration**: Full backend support for storing and retrieving custom team categories

### July 3, 2025 - Complete Passport Management System with Expiry Tracking
✓ Enhanced database schema with passport issue and expiry date fields for both players and staff
✓ Added passport date fields to player and staff forms with real-time validation
✓ Implemented passport validity calculation showing remaining years, months, and days until expiry
✓ Added visual alerts for expired passports and renewal warnings (90 days before expiry)
✓ Enhanced print and PDF export to include passport dates and validity status
✓ Created professional passport validity indicators with color-coded status messages
✓ Comprehensive ID management: National ID, Passport Number, Issue Date, Expiry Date
✓ Real-time expiry calculations with user-friendly time remaining display
✓ Database migration completed successfully with new passport date fields

### July 3, 2025 - Enhanced Staff Page with Professional Card Interface and Print Functionality
✓ Updated staff page to use enhanced StaffCard components with complex hover and selection behaviors
✓ Implemented detailed preview functionality with print and export options for staff profiles
✓ Fixed TypeScript issues with currency formatting in staff components
✓ Added proper state management for staff card selection and previews
✓ Enhanced print functionality with professional single-page layout featuring organization branding
✓ Replaced card headers in print view with organization logo, team name, and generation date
✓ Created comprehensive print templates displaying all information in organized sections
✓ Updated PDF export to include organization header and professional formatting
✓ Staff cards now have same professional interface as player cards with full export capabilities
✓ Removed spaces between labels and values in print formatting (Email:email@domain.com)
✓ Aligned information sections vertically in single column layout for better readability

### July 3, 2025 - Player and Staff Card Image Display and Edit Functionality  
✓ Fixed player and staff profile image display issues with proper URL formatting
✓ Activated edit button functionality for player cards with pre-populated form data
✓ Enhanced AddPlayerDialog to support both add and edit modes with useEffect form reset
✓ Added PATCH API endpoint for player updates to match frontend expectations
✓ Fixed database storage issues for profile picture updates
✓ Player and staff cards now properly display uploaded profile images
✓ Complete edit workflow: click edit → form opens with current data → save updates database → images display on cards

### July 2, 2025 - React-Konva Professional Tactical Board Implementation
→ Completely rewriting tactical board with react-konva for professional-grade drawing capabilities
→ Building smooth 60fps interactions with draggable, selectable, deletable elements  
→ Implementing transformer handles, undo/redo stack, and keyboard shortcuts
→ Adding professional mouse behaviors with hover effects and selection highlighting
→ Creating modular DrawingElement components with snap-to-grid and layer management

### July 2, 2025 - Interactive Tactical Board with Draggable Drawing Tools and Complete Design System
✓ Built full-featured Interactive Tactical Board with dynamic draggable drawing tools system
✓ Implemented mode switching: Select (move elements), Draw (place tools), Player (add players)
✓ Created 8 draggable drawing tools: Pass arrows, run arrows, formation lines, zone circles, area markers, cones, balls, flags
✓ Added dynamic size adjustment: Users can click and drag to determine length of lines/arrows and size of circles/rectangles
✓ Built real-time preview system showing element dimensions while dragging before placement
✓ Enhanced tool customization: color picker with 8 presets, size slider (1-10), custom color input
✓ Built formation system with preset layouts: 4-4-2 and 4-3-3 with automatic player positioning
✓ Implemented drag-and-drop functionality for all drawing elements with boundary containment
✓ Added zoom controls (50%-200%) with reset functionality for detailed tactical planning
✓ Created professional sidebar tool panel with organized sections and visual feedback
✓ Integrated export functionality to PNG images for presentations and sharing
✓ Built clear-all functionality and contextual instructions for each drawing mode
✓ Enhanced UI with real-time tool preview, dynamic SVG arrows, and interactive element highlighting
✓ Designed responsive layout with left sidebar tools and main canvas area
✓ Added intelligent minimum size requirements to prevent accidental tiny elements
✓ Created comprehensive Bubble.io tactical board design guide with TacticalPad-style layout
✓ Designed complete database structure: Formation, Player_Position, Tactical_Setup, Drawing_Element data types
✓ Built detailed implementation guide with step-by-step Bubble.io workflows and configurations
✓ Specified required plugins: Draggable Elements and FabricJS Graphics Canvas for full functionality
✓ Created interactive wireframe component showing complete tactical board layout and features
✓ Created comprehensive pack of flat SVG tactical icons for football coaching and planning
✓ Player Icons: Red, blue, and green circles with white centers for team differentiation
✓ Arrow Icons: Straight, curved, diagonal, pass (green), and run (red dashed) arrows with proper arrowheads
✓ Line Icons: Solid and dashed lines for tactical formations and boundaries
✓ Equipment Icons: Training cones (orange), footballs with pentagon pattern, flags, and position markers
✓ Enhanced football pitch SVG with accurate penalty arc positioning outside penalty areas
✓ All components designed as scalable SVGs with consistent professional styling

### July 2, 2025 - Enhanced Staff Form with Official ID and Complete Contract Management
✓ Added Official ID/Passport Number field to staff database schema and form interface
✓ Completely rewritten Staff form to match player form structure with enhanced features
✓ Added comprehensive contract management: start date, end date, monthly salary with automatic total calculation
✓ Integrated profile picture, ID document, and contract document upload sections
✓ Enhanced form validation and error handling with proper TypeScript types
✓ Professional layout with organized sections: Basic Info, Contact, ID Information, Role & Department, Employment, Contract, Documents
✓ Currency preferences integration for salary display and calculations
✓ Successfully tested with sample staff members (Head Coach and Physiotherapist)
✓ All database operations working correctly with new ID number field
✓ Form includes: name, email, phone, official ID number, emergency contact, role, department, employment type, contract details, qualifications, and document uploads

### July 2, 2025 - Interactive Player Performance Dashboard with Animated Charts
✓ Completely redesigned Analytics page with comprehensive interactive dashboard
✓ Implemented 5-tab navigation: Performance, Fitness, Position Analysis, Training, Comparison
✓ Added animated charts using Recharts library: Area, Line, Pie, Bar, Radar, RadialBar charts
✓ Created performance KPIs with progress indicators and real-time data visualization
✓ Built fitness radar chart showing multi-dimensional player attributes
✓ Added training intensity analysis with weekly breakdown and recovery metrics
✓ Implemented position-based performance analysis with comparative data
✓ Created team vs individual performance comparison charts
✓ All charts feature smooth animations with staggered timing for enhanced user experience
✓ Responsive design ensures optimal viewing across all device sizes
✓ Player selection dropdown for individual performance analysis
✓ Professional dashboard with modern UI and interactive tooltips
✓ Comprehensive export functionality with PDF reports, CSV data export, and chart image downloads
✓ Multi-format export options: PDF reports with tables, CSV data files, and PNG chart images
✓ Professional report generation with player-specific data and automated file naming
✓ Enhanced PDF reports with organization branding: logo, name, team information, and season data
✓ Professional PDF headers with organization logo, team name, and current season information
✓ Branded footer with ProCoach app name and copyright information on all pages
✓ Multi-page PDF reports with consistent branding and page numbering
✓ Professional table styling with color themes and improved data organization
✓ Fixed PDF layout with proper chart-table spacing to prevent overlapping content
✓ Centered footer formatting with two-line layout for professional appearance
✓ Optimized chart dimensions and table positioning for clean PDF generation

### July 1, 2025 - Monthly Budgets and Financial Management System
✓ Implemented comprehensive Monthly Budgets management with salary summation and expense control
✓ Added budget and expense database schema with proper validation and TypeScript types
✓ Created monthly-budgets.tsx page with multi-tab interface: Overview, Expense Management, Budget Analysis
✓ Built API endpoints for budget CRUD operations (/api/budgets, /api/expenses, /api/player-contracts)
✓ Integrated salary summation for staff and players with auto-calculation in budget creation
✓ Added expense tracking with approval workflow for club admin and admin users
✓ Implemented budget vs actual analysis with category-wise spending breakdown
✓ Added comprehensive progress indicators and budget utilization tracking
✓ Enhanced sidebar navigation with Monthly Budgets menu item using Wallet icon
✓ Financial dashboard includes: Total Budget, Salary Costs, Actual Expenses, Remaining Budget
✓ Expense filtering, approval system, and detailed financial reporting capabilities
✓ Ready for production use with proper error handling and data validation

### July 1, 2025 - Enhanced Catapult OpenField API Integration
✓ Added Catapult OpenField integration to sidebar under wearables section with official Catapult logo
✓ Created comprehensive Catapult OpenField page with API connection functionality
✓ Built API endpoints (/api/catapult/connect, /api/catapult/players/:id/data) for OpenField integration
✓ Implemented player performance data display with GPS tracking, load metrics, and heart rate zones
✓ Added multi-tab interface: Overview, Connected Athletes, Session Data, Performance Metrics, Analytics
✓ Created mock data structure matching Catapult's actual API format for demonstration
✓ Added performance insights and benchmark comparisons with team averages
✓ Integrated comprehensive dashboard with load trends, wellness indicators, and sprint analysis
✓ Enhanced with data export and sync management functionality (Export Data, Sync Data buttons)
✓ Added Catapult Connect integration banner with real-time API status indicator
✓ Included injury risk monitoring and AI-powered performance insights
✓ Comprehensive heart rate zone analysis and load vs target comparisons
✓ Ready for production API key integration with secure connection management
✓ Updated with official Catapult logo image and proper asset import system
✓ Renamed sidebar navigation to "CATAPULT-OpenField" with custom icon component

### July 1, 2025 - Custom Wearable Device Integration System
✓ Completely removed Terra-inspired data models and references
✓ Built independent wearable device management system with custom data structures
✓ Implemented provider support: Fitbit, Garmin, Oura, Apple Watch, Polar devices
✓ Created Wearables page with device connection, activity tracking, and health analytics
✓ Developed custom data models for device management, activity data, sleep analysis
✓ Built webhook system for processing wearable device data (/api/wearable/webhook)
✓ Replaced Terra references with custom provider abstraction and device categories
✓ Independent system - fully custom implementation with own data processing and API patterns

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