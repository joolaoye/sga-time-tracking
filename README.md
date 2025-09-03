# 🕐 SGA Time Tracking System

A comprehensive time tracking system built for Student Government Association with Django REST API backend and Next.js frontends. Features role-based access control, IP-restricted kiosk mode, and comprehensive administrative tools.

## ✨ Features

- **🔐 Access Code Authentication**: Simple 6-digit access codes for secure login
- **⏰ Clock In/Out System**: Track work hours with automatic IP logging
- **🖥️ Dual Interface**: Separate kiosk and administrative interfaces
- **👥 Role-Based Access**: Admin, Chair, and Member roles with appropriate permissions
- **🔒 IP Restrictions**: Secure kiosk access with IP allowlisting
- **📊 Activity Tracking**: Real-time activity logs and timesheet management
- **🏢 Committee Management**: Organize users by committees and track team performance
- **📈 Analytics**: Time tracking reports and export capabilities

## 🏗️ Project Structure

```
sga-time-tracking/
├── apps/
│   ├── clock-kiosk/           # Shared kiosk interface (Next.js) - Port 3000
│   ├── members-hub/           # Administrative dashboard (Next.js) - Port 3001
│   └── api/                   # Django REST API backend - Port 8000
├── packages/
│   ├── ui/                    # Shared UI components (shadcn/ui)
│   ├── eslint-config/         # Shared ESLint configuration
│   └── typescript-config/     # Shared TypeScript configuration
├── docker-compose.yml         # Docker orchestration
└── CONTRIBUTING.md           # Contribution guidelines
```

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/)
- **Node.js 20+**: [Download here](https://nodejs.org/)
- **pnpm**: Install with `npm install -g pnpm`

### Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/Computer-Science-Club-SCSU-University/sga-time-tracking.git
cd sga-time-tracking

# 2. Start Docker Desktop (choose your OS)
pnpm docker:start:mac     # macOS
pnpm docker:start:linux   # Linux
pnpm docker:start:win     # Windows

# 3. Bootstrap the project (installs dependencies, sets up database)
pnpm bootstrap

# 4. Start all services
pnpm dev
```

### 🌐 Access the Applications

- **Clock Kiosk**: http://localhost:3000 (IP-restricted for shared terminals)
- **Members Hub**: http://localhost:3001 (Administrative interface)
- **Django API**: http://localhost:8000/api (REST API backend)

### 🧪 Development Test Accounts

- **Alice Johnson** (Admin): `123456`
- **Bob Smith** (Chair): `234567`
- **Carol Lee** (Member): `345678`

## 📱 Applications

### 🖥️ Clock Kiosk (`apps/clock-kiosk`)
- **Purpose**: Shared terminal interface for quick clock in/out
- **Security**: IP-restricted access for authorized locations
- **Features**: 
  - Simple access code login
  - One-click clock in/out
  - Real-time activity log
  - 2-minute session timeout for security
  - Automatic logout and code clearing

### 🏢 Members Hub (`apps/members-hub`)
- **Purpose**: Administrative dashboard for management
- **Access**: Role-based permissions (Admin, Chair, Member)
- **Features**:
  - User and committee management
  - Time tracking analytics
  - Timesheet exports
  - System administration
  - Team oversight tools

### 🔧 Django API (`apps/api`)
- **Purpose**: REST API backend with role-based endpoints
- **Features**:
  - Django REST Framework
  - Session-based authentication
  - PostgreSQL database
  - Django migrations
  - Custom middleware for IP restrictions

## 🛠️ Development Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm dev:detached          # Start in background
pnpm dev:rebuild           # Rebuild and start
pnpm logs                  # View logs
pnpm restart               # Restart services
pnpm cleanup               # Stop all services

# Database
pnpm db:migrate            # Apply migrations
pnpm db:makemigrations     # Create new migrations
pnpm db:reset              # Reset database (WARNING: deletes data)
pnpm db:shell              # PostgreSQL shell
pnpm api:shell             # Django shell

# Code Quality
pnpm lint                  # Run linting
pnpm format                # Format code
pnpm build                 # Build all packages
```

## 🔌 API Endpoints

### Authentication
- `POST /api/login/` - Login with access code
- `POST /api/logout/` - Logout current session
- `GET /api/me/` - Get current user information

### Time Tracking
- `POST /api/time-logs/clock_in/` - Clock in
- `POST /api/time-logs/clock_out/` - Clock out
- `GET /api/time-logs/` - Get user's time logs
- `GET /api/time-logs/current_status/` - Get current clock status
- `GET /api/time-logs/export_csv/` - Export timesheet as CSV

### Team Management (Chair/Admin)
- `GET /api/team/` - Get team members
- `GET /api/team/{id}/member_timesheet/` - Get member timesheet
- `GET /api/committees/` - Committee management
- `GET /api/admin/` - System statistics (Admin only)

### Administration (Admin Only)
- `GET /api/users/` - User management
- `POST /api/admin/create_user/` - Create new user
- `DELETE /api/admin/{id}/delete_user/` - Delete user
- `GET /api/allowed-ips/` - IP allowlist management

## 🔒 Security Features

- **Session-based Authentication**: Secure session management with role-based access
- **IP Restrictions**: Clock kiosk access limited to authorized IP addresses
- **CSRF Protection**: API endpoints with proper CSRF handling
- **CORS Configuration**: Secure cross-origin resource sharing
- **Environment Variables**: Sensitive configuration externalized
- **App-Specific Sessions**: Separate session configurations for kiosk vs admin

## 🗄️ Database Schema

- **`users`**: Organization members with access codes and roles
- **`time_logs`**: Clock in/out records with IP and timestamp tracking
- **`committees`**: Organizational committees and team structures
- **`user_committees`**: Many-to-many relationship between users and committees
- **`allowed_ips`**: IP addresses authorized for kiosk access

## 🐳 Docker Architecture

The application runs in a containerized environment:

- **`sga-time-tracking-db`**: PostgreSQL 15 database
- **`sga-time-tracking-api`**: Django REST API backend
- **`sga-time-tracking-clock-kiosk`**: Next.js kiosk interface
- **`sga-time-tracking-members-hub`**: Next.js administrative interface

All services communicate through a Docker network with proper health checks and dependency management.

## 🎨 Development

### Adding UI Components

To add components to your app, run the following command at the root:

```bash
pnpm dlx shadcn@latest add button -c apps/clock-kiosk
# or
pnpm dlx shadcn@latest add button -c apps/members-hub
```

This will place the UI components in the `packages/ui/src/components` directory.

### Using Components

Import components from the shared UI package:

```tsx
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
```

### Database Migrations

The project uses Django migrations as the single source of truth for database schema:

```bash
# Create new migrations after model changes
pnpm db:makemigrations

# Apply migrations
pnpm db:migrate

# View migration status
docker compose exec api python manage.py showmigrations
```

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- Setting up the development environment
- Making changes and submitting pull requests
- Code style guidelines
- Project structure and common tasks

### First-Time Contributors

Look for issues labeled with:
- `good first issue` - Great for beginners
- `help wanted` - We need help with these
- `documentation` - Help improve our docs

## 🚨 Troubleshooting

### Common Issues

**Docker not starting?**
```bash
# Make sure Docker Desktop is running
pnpm docker:start:mac  # or linux/win

# Check if containers are running
docker compose ps
```

**Database connection issues?**
```bash
# Reset the database
pnpm db:reset

# Check database logs
docker compose logs db
```

**CORS errors?**
- Ensure you're accessing the correct ports (3000 for kiosk, 3001 for hub)
- Check that the API is running on port 8000

**IP restrictions blocking access?**
- Clock Kiosk (port 3000) has IP restrictions for security
- Members Hub (port 3001) should work from any IP
- Check allowed IPs with: `pnpm api:shell` then `AllowedIP.objects.all()`

## 📄 License

This project is maintained by the Computer Science Club at SCSU University for the Student Government Association.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Computer-Science-Club-SCSU-University/sga-time-tracking/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/Computer-Science-Club-SCSU-University/sga-time-tracking/discussions)
- **CS Club Discord**: Join our community for real-time support

---

<p align="center">
  Built with ❤️ by the CS Club Community for SGA
</p>