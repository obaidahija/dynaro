# Dynaro Backend API

Node.js + Express + MongoDB backend for Dynaro promotional display system.

## Features

- **RESTful API** with Express.js
- **MongoDB** with Mongoose ODM
- **Real-time updates** with Socket.IO
- **JWT authentication**
- **Template rendering** with Handlebars
- **Image uploads** with Cloudinary
- **Rate limiting** and security middleware
- **Comprehensive logging**

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new store owner
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Stores
- `GET /api/stores/my-store` - Get current user's store
- `PUT /api/stores/my-store` - Update store settings
- `PUT /api/stores/my-store/branding` - Update branding

### Menu Items
- `GET /api/menu/:storeId` - Get all menu items for store
- `POST /api/menu` - Create menu item
- `PUT /api/menu/:itemId` - Update menu item
- `DELETE /api/menu/:itemId` - Delete menu item

### Promotions
- `GET /api/promotions/:storeId` - Get all promotions for store
- `POST /api/promotions` - Create promotion
- `PUT /api/promotions/:promoId` - Update promotion
- `DELETE /api/promotions/:promoId` - Delete promotion

### Templates
- `GET /api/templates` - Get all available templates
- `GET /api/templates/:templateId` - Get specific template
- `POST /api/templates/:templateId/render/:storeId` - Render template with store data

## Real-time Events

The API broadcasts real-time updates via Socket.IO:

- `menu_update` - Menu items changed
- `promotion_update` - Promotions changed
- `store_update` - Store settings changed

Clients join store-specific rooms: `store-${storeId}`

## Environment Variables

See `.env.example` for all required environment variables.