# Admin Free Access Guide

## Overview
Admin users have free access to all services while regular users need to pay. This is controlled through the `ADMIN_SECRET_KEY` environment variable and the `x-admin-key` header.

## How It Works

### 1. Environment Setup
Set the `ADMIN_SECRET_KEY` environment variable in your `.env` file:
```bash
ADMIN_SECRET_KEY=your_secret_admin_key_here
```

### 2. Admin Authentication
Admin users must include the `x-admin-key` header in their requests:
```bash
curl -H "x-admin-key: your_secret_admin_key_here" \
     -X POST http://localhost:3000/api/song \
     -H "Content-Type: application/json" \
     -d '{"name":"Admin User","email":"admin@example.com",...}'
```

### 3. Services Available for Free (Admin Only)

#### Song Generation
- **Endpoint**: `POST /api/song`
- **Admin Access**: Free (with valid `x-admin-key`)
- **Regular Users**: Need to pay 500 TL
- **File**: `api/routes/songRoutes.js`

#### Voice Cloning
- **Endpoint**: `POST /api/voice/clone`
- **Admin Access**: Free (with valid `x-admin-key`)
- **Regular Users**: Need to pay 250 TL
- **File**: `api/routes/voiceRoutes.js`

#### Video Animation
- **Endpoint**: `POST /api/video/generate`
- **Admin Access**: Free (with valid `x-admin-key`)
- **Regular Users**: Need to pay 500 TL
- **File**: `api/routes/videoRoutes.js`

### 4. Admin Pricing API
Admin users can check their free pricing through:
```bash
curl -H "x-admin-key: your_secret_admin_key_here" \
     http://localhost:3000/api/admin/pricing
```

This will return all services with `basePrice: 0` for admin users.

### 5. Security Notes
- The `ADMIN_SECRET_KEY` should be a strong, unique key
- Only share this key with trusted admin users
- The key is validated on every admin request
- If no key is set, admin access is disabled
- Admin middleware is applied to all service routes

### 6. Example Admin Requests

#### Song Generation
```bash
curl -H "x-admin-key: your_secret_admin_key_here" \
     -X POST http://localhost:3000/api/song \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Admin User",
       "email": "admin@example.com",
       "songStyle": "Pop",
       "mood": "Happy",
       "specialOccasion": "Testing",
       "tempo": "Medium",
       "story": "This is a test song for admin"
     }'
```

#### Voice Cloning
```bash
curl -H "x-admin-key: your_secret_admin_key_here" \
     -X POST http://localhost:3000/api/voice/clone \
     -F "fullName=Admin User" \
     -F "email=admin@example.com" \
     -F "purpose=Testing" \
     -F "audioFile=@/path/to/audio.mp3"
```

#### Video Generation
```bash
curl -H "x-admin-key: your_secret_admin_key_here" \
     -X POST http://localhost:3000/api/video/generate \
     -F "fullName=Admin User" \
     -F "email=admin@example.com" \
     -F "animationPrompt=Create a beautiful sunset animation" \
     -F "mediaFiles=@/path/to/photo.jpg"
```

## Frontend Integration
When building admin interfaces, include the `x-admin-key` header in all API requests to ensure free access to services.

## Implementation Details
- Admin middleware is applied to all service routes
- `req.isAdmin` flag is set for admin users
- All services check for admin status before applying pricing
- Admin pricing API returns `basePrice: 0` for all services

## Troubleshooting
- **401 Unauthorized**: Check that `x-admin-key` header matches `ADMIN_SECRET_KEY`
- **Admin access not working**: Verify `ADMIN_SECRET_KEY` is set in environment
- **Regular users still charged**: Ensure admin middleware is properly applied
- **Service not found**: Check that admin middleware is applied to the specific route
