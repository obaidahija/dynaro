# Dynaro Frontend

This contains both the Dashboard (store owner interface) and Display (customer screen) applications.

## Structure

- **dashboard/** - Next.js app for store owners to manage their menu and promotions
- **display/** - Next.js app for customer-facing display screens
- **shared/** - Shared components, types, and utilities

## Development

```bash
# Install all dependencies
npm run install:all

# Run both apps in development
npm run dev

# Run individual apps
npm run dev:dashboard  # Runs on http://localhost:3000
npm run dev:display    # Runs on http://localhost:3001

# Build for production
npm run build
```

## Environment Setup

Create `.env.local` files in both dashboard/ and display/ directories:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## Apps

### Dashboard (Port 3000)
- Store management interface
- Menu item CRUD
- Promotion management
- Real-time preview
- Template customization

### Display (Port 3001)
- Customer-facing screen
- Real-time menu updates
- Promotion display
- Template rendering
- Auto-refresh functionality