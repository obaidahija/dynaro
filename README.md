# Dynaro - Real-time Promotional Display System

## Project Structure

```
dynaro/
├── backend/               # Node.js API server
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── models/       # MongoDB models
│   │   └── utils/        # Utilities
│   ├── package.json
│   └── README.md
├── frontend/             # Next.js applications
│   ├── dashboard/        # Store owner interface
│   ├── display/          # Customer display screen
│   ├── shared/           # Shared components & types
│   ├── package.json
│   └── README.md
└── docs/                 # Documentation
```

## Architecture Overview

### Core Services
1. **Dashboard Service** - Store owner interface
2. **Display Service** - Customer-facing screen
3. **API Service** - Business logic, data management
4. **Real-time Service** - WebSocket/SSE for live updates

### Data Flow
```
Owner (Dashboard) -> API -> Database -> Real-time Service -> Display Screen
```

## Getting Started

See individual app README files for setup instructions.