# Analytics Platform Sample

Sample Plotly Dash application with PostgreSQL authentication and modular dashboard architecture.

## Quick Start

```bash
# Run with Docker (includes PostgreSQL database)
docker-compose up --build

# Access dashboard at http://localhost:8050
# PostgreSQL available at localhost:5432
```

## Demo Accounts

| Username | Password | Access |
|----------|----------|--------|
| admin | password123 | All dashboards |
| analyst1 | analyst123 | Sales + Financial |
| scientist1 | science123 | Customer only |

## Architecture

### Project Structure
```
dashboard-sample/
├── app/
│   ├── app.py                          # Main application with routing
│   ├── database.py                     # PostgreSQL connection manager
│   └── dashboards/                     # Modular dashboard components
│       ├── customer_analytics.py       # Customer analytics dashboard
│       ├── sales_dashboard.py          # Sales performance dashboard
│       └── financial_reports.py        # Financial reports dashboard
├── data/                               # Sample CSV datasets
├── init.sql                           # Database initialization script
├── docker-compose.yml                 # Multi-service orchestration
├── Dockerfile                         # Application container
└── nginx.conf                         # Reverse proxy configuration
```

### URL Routes
- `/` - Home page with dashboard navigation
- `/customer-analytics` - Customer analytics dashboard
- `/sales-dashboard` - Sales performance dashboard  
- `/financial-reports` - Financial reports dashboard

## Features

- **Modular Architecture**: Each dashboard is a separate module with its own data loading
- **PostgreSQL Authentication**: Database-backed user authentication and permissions
- **Role-based Access Control**: Different users see different dashboards based on permissions
- **Session Persistence**: Login persists across page navigation
- **URL Routing**: Each dashboard has its own URL path
- **Navigation Bar**: Easy navigation between dashboards with logout functionality
- **Responsive Design**: Bootstrap-based responsive UI
- **Container-ready**: Multi-service Docker deployment with database

## Services

- **dashboard**: Main Dash application (port 8050)
- **postgres**: PostgreSQL database (port 5432) 
- **nginx**: Reverse proxy (port 80, production profile)

## Database Schema

- `users`: User accounts with hashed passwords
- `permissions`: Available dashboard permissions
- `user_permissions`: User-permission mapping

## Optional Production Setup

```bash
# Run with nginx reverse proxy
docker-compose --profile production up --build
# Access via http://localhost (port 80)
```