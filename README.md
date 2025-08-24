# SongCreator Web Application

A comprehensive AI-powered song creation platform with voice cloning and video animation capabilities.

## Features

- 🎵 **AI Song Generation** - Create personalized songs using Suno AI
- 🎤 **Voice Cloning** - Clone voices for personalized audio content
- 🎬 **Video Animation** - Transform photos into animated videos
- 🔧 **Admin Panel** - Comprehensive management dashboard
- 🌍 **Multi-language Support** - Turkish, English, and Dutch

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **AI Services**: Suno AI, KITS AI, RunwayML
- **Styling**: Framer Motion, Lucide React

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Suno AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd song-webapp
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp server/env.example server/.env
   
   # Edit .env file with your API keys
   SUNO_API_KEY=your_suno_api_key_here
   KITS_API_KEY=your_kits_api_key_here
   RUNWAY_API_KEY=your_runway_api_key_here
   ```

4. **Start the application**
   ```bash
   # Terminal 1: Start backend server
   cd server && npm run dev
   
   # Terminal 2: Start frontend
   npm run dev
   ```

5. **Access the application**
   - Main app: http://localhost:3000
   - Admin panel: http://localhost:3000/admin
   - Backend API: http://localhost:5001

## Region/Egress Configuration for Suno API

Suno API may have region restrictions or geo-blocking. Configure your environment based on your deployment scenario:

### Local Development (with Proxy)

Use a proxy to bypass region restrictions:

```bash
# Set proxy and region
export SUNO_HTTP_PROXY="http://user:pass@proxy-us.example.com:8080"
export DEPLOY_REGION="us-proxy"

# Start development server
npm run dev

# Verify configuration
curl http://localhost:5001/api/status/suno
```

**Proxy Service Options:**
- **Residential Proxies**: Better success with geo-blocked APIs
- **Rotating Proxies**: Avoid rate limiting
- **US-based Proxies**: Often work better with Suno API

### Cloud Deployment (US/EU)

For production deployments in supported regions:

```bash
# Set environment variables on host
export SUNO_API_KEY="your_api_key_here"
export DEPLOY_REGION="us-east"  # or "eu-west", "us-west", etc.

# No proxy needed - direct connection
npm run dev
```

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SUNO_HTTP_PROXY` | HTTP proxy for bypassing region blocks | `http://user:pass@proxy-us.example.com:8080` |
| `DEPLOY_REGION` | Server deployment region for error reporting | `us-proxy`, `us-east`, `eu-west` |
| `SUNO_API_KEY` | Your Suno API key | `sk-...` |
| `SUNO_BASE_URL` | Suno API base URL | `https://api.suno.ai` |

## API Endpoints

### Song Generation
- `POST /api/song` - Submit song request
- `POST /api/song/simple` - Simple song generation
- `POST /api/song/test` - Test song generation
- `GET /api/song/:id` - Get song status

### Voice & Video
- `POST /api/voice` - Voice cloning request
- `POST /api/video` - Video animation request

### Admin & Debug
- `GET /api/admin/*` - Admin panel endpoints
- `GET /api/debug/*` - Debug information
- `GET /api/status/*` - Service health checks

## Debugging

### Suno API Issues

1. **Check service status**
   ```bash
   curl http://localhost:5001/api/status/suno
   ```

2. **View last API response**
   ```bash
   curl http://localhost:5001/api/debug/suno-last
   ```

3. **Run comprehensive diagnostic**
   ```bash
   curl http://localhost:5001/api/debug/suno-diagnose
   ```

4. **Test with minimal payload**
   ```bash
   curl -X POST "http://localhost:5001/api/song/simple" \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Test song","debugSmall":true}'
   ```

### Common Error Codes

- **503**: Suno API temporarily unavailable (try proxy or retry later)
- **401**: Invalid API key
- **403**: Insufficient credits or access denied
- **429**: Rate limit exceeded

### Diagnostic Endpoint

The `/api/debug/suno-diagnose` endpoint performs a minimal Suno API test to identify issues:

```bash
curl http://localhost:5001/api/debug/suno-diagnose
```

**Response Interpretation:**

- **`"status": 503`** → Region/Network block (Cloudflare 503)
- **`"status": 401|402|403|429`** → Credits or subscription issue
- **`"status": 200`** → Suno reachable and credits are fine

**Example Response:**
```json
{
  "success": true,
  "message": "Suno API diagnostic completed",
  "data": {
    "status": 503,
    "ok": false,
    "region": "local",
    "viaProxy": false,
    "body": "Service Unavailable"
  }
}
```

This diagnostic helps quickly determine whether failures are from:
- **Region restrictions** (503 errors)
- **Credit/subscription limits** (4xx errors)
- **Network connectivity** (network errors)

### Troubleshooting Region Blocks

If you encounter 503 errors (region blocks):

1. **Check current region**:
   ```bash
   curl http://localhost:5001/api/status/suno
   ```

2. **Set up proxy for local development**:
   ```bash
   export SUNO_HTTP_PROXY="http://user:pass@proxy-us.example.com:8080"
   export DEPLOY_REGION="us-proxy"
   npm run dev
   ```

3. **Verify proxy configuration**:
   ```bash
   curl http://localhost:5001/api/debug/suno-diagnose
   ```

4. **Check admin panel banner** for region-specific error messages

## Development

### Project Structure
```
song-webapp/
├── app/                 # Next.js app directory
├── components/          # React components
├── server/             # Backend Express server
│   ├── routes/         # API route handlers
│   ├── services/       # External service integrations
│   └── uploads/        # File uploads
├── lib/                # Shared utilities
└── public/             # Static assets
```

### Adding New Features

1. **Backend**: Add routes in `server/routes/`
2. **Frontend**: Create components in `components/`
3. **Services**: Implement in `server/services/`
4. **Admin**: Add to admin panel components

## Troubleshooting

### Server Won't Start
- Check if ports 3000/5001 are available
- Verify environment variables are set
- Check Node.js version (18+ required)

### Suno API Errors
- Verify API key is valid
- Check if you have sufficient credits
- Try using a proxy if geo-blocked
- Check service status endpoint

### File Upload Issues
- Ensure uploads directory exists
- Check file size limits
- Verify file types are supported

## Deploy Summary

### 🚀 **Frontend (Static Export) - Turhost cPanel**

**Build Command:**
```bash
npm run build:static
```

**Deploy:**
1. Upload contents of `/out` folder to `public_html` on Turhost
2. Set environment variables in cPanel:
   - `NEXT_PUBLIC_API_URL=https://melodidunyasi.com`
   - `NEXT_PUBLIC_POLL_MAX_DELAY=15000`
   - `NEXT_PUBLIC_POLL_INITIAL_DELAY=1000`

**Zip for Upload:**
```bash
npm run zip:front
```

### 🔧 **Backend (Node.js API) - Render**

**Deploy to Render:**
1. Connect GitHub repository
2. Set root directory to `api/`
3. Build command: `npm ci`
4. Start command: `node server.js`
5. Health check path: `/health`
6. Set environment variables from `api/.env.example`

**Alternative: Turhost Node.js (if enabled)**
- App Root: `public_html/api`
- Startup file: `server.js`
- Set environment variables in cPanel

**Zip for Upload:**
```bash
npm run zip:api
```

### 🌐 **Environment Configuration**

**Frontend (.env.production):**
```bash
NEXT_PUBLIC_API_URL=https://melodidunyasi.com
NEXT_PUBLIC_POLL_MAX_DELAY=15000
NEXT_PUBLIC_POLL_INITIAL_DELAY=1000
```

**Backend (.env):**
```bash
NODE_ENV=production
CORS_ORIGINS=https://melodidunyasi.com,https://www.melodidunyasi.com
SUNOAPI_ORG_API_KEY=226c6f04c6b35974342adb1821e8cafc
# ... other variables from api/.env.example
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the debug endpoints
- Review server logs
- Check Suno API documentation
- Open an issue on GitHub
