# LocalGov Thailand - No-Code Local Government App

## Overview
LocalGov Thailand is a comprehensive no-code mobile/web application designed to support Thai local administrative organizations (อบต., ทต., ทม., ทน., อบจ.) in delivering services, managing data, and engaging citizens. Currently branded for "อบต.วังสามหมอ - Tour Der Wang" with personalized welcome for "กฤษนันทน์ นำแปง", featuring modern UI/UX with glass effects, animations, and crocodile logo branding. The application serves as a digital bridge between local government and citizens, offering services like tax payments, permit applications, complaint submissions, and real-time communication.

## User Preferences
Preferred communication style: Simple, everyday language.
Project Status: Production-ready with Thai government branding and responsive design.

## Recent Changes (July 24, 2025)
✓ Implemented complete Thai government platform with modern UI/UX
✓ Added Tour Der Wang branding with crocodile logo
✓ Created mobile-responsive design with glass effects and animations
✓ Integrated personalized welcome for กฤษนันทน์ นำแปง
✓ Fixed all TypeScript errors for smooth operation
✓ Confirmed application working with real-time WebSocket notifications
✓ Established complete five-section navigation: Home, Services, Reports, Announcements, Profile
✓ Integrated PostgreSQL database with Drizzle ORM for persistent data storage
✓ Migrated from memory storage to database storage for production readiness
✓ Seeded database with sample Thai government data and citizen information
✓ Integrated real Thai government APIs for authentic citizen verification
✓ Implemented NDID blockchain-based verification system (IAL3 security level)
✓ Added DOPA civil registration database integration
✓ Created ThaID mobile app verification support with biometric authentication
✓ Built comprehensive Thai ID verification service with error handling
✓ Updated database schema to support government verification records
✓ Documented API requirements and environment configuration

## System Architecture
The application follows a modern full-stack architecture with clear separation between client and server:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn/ui component library
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with custom styling
- **Animations**: Framer Motion for smooth user interactions
- **Theme**: Dark/light mode support with CSS variables

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM for persistent data storage
- **Database Driver**: Neon Database serverless PostgreSQL
- **Real-time**: WebSocket server for live notifications
- **Build**: ESBuild for server bundling
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### Database Schema
The application uses five main entities:
- **Citizens**: User profiles with Thai ID verification, biometric support
- **Services**: Service requests (tax, permits, complaints, QR codes) with tracking
- **Reports**: Financial and community data categorized by type and year
- **Announcements**: News, events, and emergency notifications with priority levels
- **Notifications**: Real-time messaging system for users

### Authentication & Security
- Thai ID integration for citizen verification
- Biometric authentication support
- Session-based authentication approach
- Role-based access control for different user types

### Service Management
Four main service types:
1. **Tax Payments**: Digital tax processing with amount tracking
2. **Permit Applications**: Building and business permit requests
3. **Complaint System**: Issue reporting with status tracking
4. **QR Code Services**: Quick access to common functions

### Real-time Features
- WebSocket connection for instant notifications
- Live status updates for service requests
- Emergency alert broadcasting
- Real-time chat capabilities with officials

## Data Flow

### Client-Server Communication
1. Client makes API requests through TanStack Query
2. Express server processes requests and interacts with PostgreSQL
3. Real-time updates pushed via WebSocket connections
4. Response data cached on client for optimal performance

### Service Request Flow
1. Citizen submits service request through mobile/web interface
2. System generates unique tracking ID
3. Request stored in database with "pending" status
4. Real-time notification sent to citizen
5. Status updates propagated through WebSocket
6. Completion notification with relevant documents/receipts

### Notification System
1. Server-side events trigger notification creation
2. WebSocket server identifies connected clients
3. Notifications pushed to relevant users in real-time
4. Client displays toast notifications with appropriate styling
5. Notification history maintained in database

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database queries and migrations
- **WebSocket**: Native Node.js WebSocket implementation

### UI & Styling
- **Shadcn/ui**: Pre-built accessible components
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless component primitives
- **Lucide React**: Icon library

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development server and build tool
- **ESBuild**: Fast JavaScript bundler for production

### Production Integrations
- **NDID Platform**: Blockchain-based digital identity verification (implemented)
- **DOPA Database**: Direct civil registration system access (implemented)
- **ThaID Mobile App**: Official government app integration (implemented)
- **Payment Gateway**: Krungthai Bank or local payment processors (planned)
- **SMS/Push Notifications**: For critical alerts and reminders (planned)

## Deployment Strategy

### Development Environment
- Local development with Vite dev server
- Hot module replacement for rapid iteration
- TypeScript compilation for type checking
- Database migrations through Drizzle Kit

### Production Build
- Client built as static assets via Vite
- Server bundled with ESBuild for Node.js deployment
- Database migrations applied automatically
- Environment-specific configuration management

### Hosting Considerations
- **Frontend**: Can be deployed to any static hosting service
- **Backend**: Requires Node.js runtime environment
- **Database**: Configured for Neon serverless PostgreSQL
- **WebSocket**: Requires persistent connection support

### Scalability Approach
- Stateless server architecture for horizontal scaling
- Database connection pooling for concurrent users
- Caching strategy for frequently accessed data
- CDN integration for static asset delivery

The architecture prioritizes simplicity, maintainability, and user experience while providing the foundation for a comprehensive local government service platform. The modular design allows for easy extension of features and integration with existing government systems.