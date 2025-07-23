# LocalGov Thailand - No-Code Local Government App

## Overview
LocalGov Thailand is a comprehensive no-code mobile/web application designed to support Thai local administrative organizations (อบต., ทต., ทม., ทน., อบจ.) in delivering services, managing data, and engaging citizens. The application serves as a digital bridge between local government and citizens, offering services like tax payments, permit applications, complaint submissions, and real-time communication.

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server for live notifications
- **Build**: ESBuild for server bundling

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

### Planned Integrations
- **ThaID/D.DOPA**: Thai digital identity verification
- **Payment Gateway**: Krungthai Bank or local payment processors
- **SMS/Push Notifications**: For critical alerts and reminders

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