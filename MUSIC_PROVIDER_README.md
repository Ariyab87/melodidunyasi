# Music Provider System

This document describes the new music provider system that supports both the official Suno API and the SunoAPI.org reseller service.

## Overview

The music provider system allows you to switch between different AI music generation services via environment configuration. This provides flexibility and redundancy when one service is unavailable.

## Supported Providers

### 1. Official Suno API (`suno_official`)
- **Base URL**: `https://api.suno.ai`
- **Authentication**: Bearer token via `SUNO_API_KEY`
- **Endpoints**: Standard Suno API endpoints
- **Features**: Full Suno API capabilities

### 2. SunoAPI.org Reseller (`sunoapi_org`)
- **Base URL**: `https://sunoapi.org/api`
- **Authentication**: Bearer token via `SUNOAPI_KEY`
- **Endpoints**: Reseller API endpoints
- **Features**: Suno API access via reseller

## Environment Configuration

### Required Variables

```bash
# Music Provider Selection
MUSIC_PROVIDER=suno_official   # or sunoapi_org

# Official Suno API Configuration
SUNO_BASE_URL=https://api.suno.ai
SUNO_API_KEY=your-suno-api-key-here

# SunoAPI.org Configuration
SUNOAPI_BASE_URL=https://sunoapi.org/api
SUNOAPI_KEY=your-sunoapi-org-key-here

# Optional: Proxy Configuration
SUNO_HTTP_PROXY=http://USER:PASS@proxy-host:PORT
```

### Example Configurations

#### For Official Suno API:
```bash
export MUSIC_PROVIDER=suno_official
export SUNO_API_KEY=sk_xxx
export SUNO_BASE_URL=https://api.suno.ai
```

#### For SunoAPI.org Reseller:
```bash
export MUSIC_PROVIDER=sunoapi_org
export SUNOAPI_KEY=sa_xxx
export SUNOAPI_BASE_URL=https://sunoapi.org/api
```

## Architecture

```
server/services/
├── musicProvider.js          # Main provider orchestrator
├── providers/
│   ├── sunoOfficial.js       # Official Suno API implementation
│   └── sunoApiOrg.js         # SunoAPI.org implementation
└── sunoService.js            # Updated service using music provider
```

### Key Components

1. **`musicProvider.js`**: Main service that delegates to the configured provider
2. **Provider Classes**: Each provider implements the same interface:
   - `generateSong(payload)`
   - `health()`
   - `diagnose()`
3. **Common Response Format**: All providers return data in a standardized shape

## Testing

### 1. Test SunoAPI.org Configuration

```bash
# Set environment variables
export MUSIC_PROVIDER=sunoapi_org
export SUNOAPI_KEY=sa_xxx
export SUNOAPI_BASE_URL=https://sunoapi.org/api

# Start the server
npm run dev

# Test health endpoint
curl http://localhost:5001/api/status/music

# Test song generation
curl -X POST http://localhost:5001/api/song \
  -H "Content-Type: application/json" \
  -d '{"prompt":"10s test song", "duration":10}'
```

### 2. Test Official Suno Configuration

```bash
# Set environment variables
export MUSIC_PROVIDER=suno_official
export SUNO_API_KEY=sk_xxx
export SUNO_BASE_URL=https://api.suno.ai

# Start the server
npm run dev

# Test health endpoint
curl http://localhost:5001/api/status/music

# Test song generation
curl -X POST http://localhost:5001/api/song \
  -H "Content-Type: application/json" \
  -d '{"prompt":"10s test song", "duration":10}'
```

### 3. Test Provider Switching

```bash
# Test with SunoAPI.org
export MUSIC_PROVIDER=sunoapi_org
curl http://localhost:5001/api/status/music

# Switch to Official Suno
export MUSIC_PROVIDER=suno_official
curl http://localhost:5001/api/status/music

# Check system status
curl http://localhost:5001/api/status
```

## API Endpoints

### New Endpoints

- **`GET /api/status/music`**: Check music provider health
- **`GET /api/status/suno`**: Legacy endpoint (redirects to music status for sunoapi_org)

### Updated Endpoints

- **`GET /api/status`**: Now includes music provider information
- **`POST /api/song`**: Uses configured music provider

## Response Format

### Common Song Response Shape

```json
{
  "audio_url": "https://...",
  "job_id": "unique_id",
  "status": "completed",
  "duration": 30,
  "prompt": "original prompt",
  "provider": "suno_official|sunoapi_org",
  "metadata": {
    "model": "suno-music-1",
    "apiVersion": "v1",
    "processingTime": null
  }
}
```

### Health Check Response

```json
{
  "ok": true,
  "status": 200,
  "provider": "suno_official",
  "baseUrl": "https://api.suno.ai",
  "region": "local",
  "viaProxy": false,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Official Suno API is responding"
}
```

## Error Handling

### Provider-Specific Errors

- **Configuration Errors**: Missing API keys or invalid provider
- **Network Errors**: Connection issues, timeouts
- **API Errors**: Rate limits, authentication failures, service unavailability

### Fallback Behavior

- If the configured provider fails, the system will log errors but won't automatically switch
- Health checks return detailed error information for debugging
- Diagnostic endpoints provide comprehensive provider status

## Monitoring & Debugging

### Health Checks

- **Automatic**: Every 60 seconds in the admin panel
- **Manual**: Via `/api/status/music` endpoint
- **Diagnostic**: Via provider-specific diagnose methods

### Logging

- Provider selection and configuration
- API request/response details
- Error conditions and retry attempts
- Health check results

### Debug Files

- Provider responses are saved to `server/uploads/`
- Separate files for each provider type
- Timestamped for debugging purposes

## Migration Guide

### From Old Suno Service

1. **Update Environment**: Add `MUSIC_PROVIDER=suno_official`
2. **Verify Configuration**: Ensure `SUNO_API_KEY` and `SUNO_BASE_URL` are set
3. **Test Health**: Check `/api/status/music` endpoint
4. **Monitor Logs**: Verify provider initialization

### To SunoAPI.org

1. **Get API Key**: Obtain key from SunoAPI.org
2. **Update Environment**: Set `MUSIC_PROVIDER=sunoapi_org`
3. **Configure Keys**: Set `SUNOAPI_KEY` and `SUNOAPI_BASE_URL`
4. **Test Integration**: Verify health checks and song generation

## Troubleshooting

### Common Issues

1. **Provider Not Configured**
   - Check `MUSIC_PROVIDER` environment variable
   - Verify API keys are set
   - Check server logs for configuration errors

2. **Health Check Failures**
   - Verify API keys are valid
   - Check network connectivity
   - Review provider-specific error messages

3. **Song Generation Failures**
   - Check provider health status
   - Verify request payload format
   - Review provider logs for detailed errors

### Debug Commands

```bash
# Check environment
echo "MUSIC_PROVIDER: $MUSIC_PROVIDER"
echo "SUNO_API_KEY: ${SUNO_API_KEY:0:10}..."
echo "SUNOAPI_KEY: ${SUNOAPI_KEY:0:10}..."

# Test provider health
curl -v http://localhost:5001/api/status/music

# Check system status
curl http://localhost:5001/api/status

# View server logs
tail -f server/logs/app.log
```

## Security Considerations

- **API Keys**: Never logged or exposed in responses
- **Proxy Support**: Maintains existing proxy configuration
- **Rate Limiting**: Inherits from existing rate limiting setup
- **CORS**: Maintains existing CORS configuration

## Performance

- **Connection Pooling**: HTTP agents with keep-alive
- **Retry Logic**: Exponential backoff for transient failures
- **Timeout Handling**: Configurable timeouts for different operations
- **Response Caching**: Health check results cached briefly

## Future Enhancements

- **Provider Auto-Switching**: Automatic fallback to backup providers
- **Load Balancing**: Distribute requests across multiple providers
- **Metrics Collection**: Provider performance and reliability metrics
- **Provider Plugins**: Easy addition of new music providers
