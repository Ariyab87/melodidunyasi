# Static Export Guide

This project has been configured to support static export for deployment to static hosting services like Turhost.

## Building for Static Export

### 1. Build the Static Frontend

```bash
npm run build:static
```

This command will:
- Build the Next.js application with static export enabled
- Generate static HTML files in the `./out` directory
- Create a fully static frontend ready for deployment

### 2. Generated Files

After running `npm run build:static`, the following structure will be created:

```
./out/
├── index.html              # Main homepage
├── admin/
│   └── index.html         # Admin dashboard
├── song-status/
│   └── index.html         # Song status page
├── _next/                 # Static assets (JS, CSS, images)
├── images/                # Static images
└── 404.html              # 404 error page
```

## Deployment

### Turhost Deployment

1. **Upload to public_html**: Upload all contents of the `./out` folder to your `public_html` directory on Turhost
2. **Set API URL**: Ensure your production environment variables are set correctly:
   - `NEXT_PUBLIC_API_URL=https://melodidunyasi.com`
   - `NEXT_PUBLIC_POLL_MAX_DELAY=15000`
   - `NEXT_PUBLIC_POLL_INITIAL_DELAY=1000`

### Environment Configuration

Copy `.env.production.example` to `.env.production` and update the values:

```bash
cp .env.production.example .env.production
```

Then edit `.env.production` with your production values.

## Important Notes

### Static Export Limitations

- **No Server-Side Rendering**: All pages are pre-rendered at build time
- **No API Routes**: The frontend will make API calls to your external backend
- **No Dynamic Routes**: Dynamic routes like `/song-status/[songId]` are not included in static export
- **No Rewrites**: URL rewrites configured in `next.config.js` won't work in static export

### API Configuration

The frontend is configured to make API calls to:
- **Development**: `http://localhost:5001` (via rewrites)
- **Production**: `https://melodidunyasi.com` (via environment variable)

### Song Status Functionality

The static export includes a song status search page at `/song-status` that allows users to:
- Enter a song ID to check status
- Get redirected to the dynamic status page (if available)
- View helpful information about song IDs

## Development vs Production

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production (without static export)
npm run start        # Start production server
```

### Production (Static)
```bash
npm run build:static # Build static export
# Upload ./out folder to web server
```

## Troubleshooting

### Build Errors
- Ensure all TypeScript errors are resolved
- Check that all components are properly typed
- Verify that no dynamic routes are included in static export

### Runtime Issues
- Check that `NEXT_PUBLIC_API_URL` is set correctly
- Verify that your backend API is accessible from the frontend
- Ensure CORS is properly configured on your backend

### Performance
- Static files are served directly by the web server
- No server-side processing required
- Fast loading times for static content
- API calls are made directly to your backend server
