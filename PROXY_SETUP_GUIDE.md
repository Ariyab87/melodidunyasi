# Proxy Setup Guide for Suno API

This guide will help you set up proxy routing for all Suno API requests to bypass regional restrictions.

## ✅ What's Already Implemented

1. **Proxy Library**: `https-proxy-agent` is installed
2. **Proxy Configuration**: `lib/proxy.js` created with proxy agent functions
3. **Environment Variables**: `PROXY_URL` added to configuration
4. **Provider Updates**: Both Suno providers now use the proxy configuration
5. **Status Endpoints**: All status endpoints now show proxy information

## 🔧 How to Configure the Proxy

### Step 1: Set Environment Variables

Create a `.env.local` file in your project root (or set environment variables directly):

```bash
# Music Provider Configuration
MUSIC_PROVIDER=suno_official

# Official Suno API Configuration
SUNO_API_KEY=your_actual_api_key_here
SUNO_BASE_URL=https://api.suno.ai

# Proxy Configuration
PROXY_URL=http://username:password@proxyserver:port

# Examples:
# PROXY_URL=http://proxy.example.com:8080
# PROXY_URL=http://user:pass@proxy.example.com:8080
# PROXY_URL=socks5://user:pass@proxy.example.com:1080
```

### Step 2: Test with a Free Proxy (Optional)

For testing purposes, you can use a free proxy service:

```bash
# Example free proxy (replace with actual working proxy)
export PROXY_URL=http://free-proxy.example.com:8080
```

### Step 3: Restart the Server

```bash
# Stop the current server
pkill -f "node.*server.js"

# Start with new environment
cd server && npm run dev
```

## 🧪 Testing the Proxy Configuration

### Test 1: Check Proxy Status

```bash
# Check if proxy is configured
curl http://localhost:5001/api/status

# Expected response should show:
# "proxy": {"configured": true, "url": "your_proxy_url"}
```

### Test 2: Check Music Provider Health

```bash
# Check music provider health with proxy
curl http://localhost:5001/api/status/music

# Expected response should show:
# "viaProxy": true,
# "proxyUrl": "your_proxy_url"
```

### Test 3: Check Server Logs

Look for these log messages:

```
🔍 [PROXY] Global proxy configured: http://your_proxy_url
🔍 [PROXY] Official Suno provider using proxy: http://your_proxy_url
🔍 [STATUS] Using proxy: http://your_proxy_url
```

## 🔍 Troubleshooting

### Issue 1: Proxy Not Being Used

**Symptoms**: Logs show "Using proxy: none"

**Solutions**:
1. Check if `PROXY_URL` is set correctly
2. Restart the server after setting environment variables
3. Verify the proxy URL format is correct

### Issue 2: Proxy Connection Failed

**Symptoms**: Network errors or timeouts

**Solutions**:
1. Verify proxy server is accessible
2. Check proxy credentials if authentication is required
3. Test proxy with a simple curl command:
   ```bash
   curl --proxy http://your_proxy_url https://api.suno.ai/v1
   ```

### Issue 3: Still Getting 503 Errors

**Symptoms**: Suno API returns 503 even with proxy

**Solutions**:
1. Proxy might be blocked by Suno
2. Try a different proxy server
3. Check if proxy supports HTTPS
4. Verify proxy is in a different region

## 🌐 Proxy Service Recommendations

### Free Proxy Services (for testing)
- **HideMyAss**: Free proxy list
- **ProxyNova**: Free proxy database
- **FreeProxyList**: Open proxy lists

### Paid Proxy Services (for production)
- **Bright Data**: Residential proxies
- **SmartProxy**: Datacenter and residential
- **Oxylabs**: Premium proxy solutions
- **ProxyMesh**: Rotating proxies

### Proxy Types
1. **HTTP Proxy**: Basic proxy support
2. **HTTPS Proxy**: Secure proxy support
3. **SOCKS5 Proxy**: Advanced proxy protocol
4. **Residential Proxy**: Uses real IP addresses

## 📊 Monitoring Proxy Usage

### Health Check Response

```json
{
  "ok": true,
  "status": 200,
  "provider": "suno_official",
  "baseUrl": "https://api.suno.ai",
  "region": "local",
  "viaProxy": true,
  "proxyUrl": "http://your_proxy_url",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Official Suno API is responding"
}
```

### System Status Response

```json
{
  "system": "OK",
  "music": {
    "provider": "suno_official",
    "baseUrl": "https://api.suno.ai",
    "configured": true,
    "proxy": {
      "configured": true,
      "url": "http://your_proxy_url"
    }
  },
  "proxy": {
    "configured": true,
    "url": "http://your_proxy_url",
    "global": "http://your_proxy_url",
    "legacy": null
  }
}
```

## 🚀 Production Deployment

### Vercel
```bash
# Set environment variables in Vercel dashboard
PROXY_URL=http://username:password@proxyserver:port
MUSIC_PROVIDER=suno_official
SUNO_API_KEY=your_api_key
```

### Railway
```bash
# Set environment variables in Railway dashboard
PROXY_URL=http://username:password@proxyserver:port
MUSIC_PROVIDER=suno_official
SUNO_API_KEY=your_api_key
```

### Docker
```dockerfile
ENV PROXY_URL=http://username:password@proxyserver:port
ENV MUSIC_PROVIDER=suno_official
ENV SUNO_API_KEY=your_api_key
```

## 🔒 Security Considerations

1. **Never commit proxy credentials** to version control
2. **Use environment variables** for sensitive information
3. **Rotate proxy credentials** regularly
4. **Monitor proxy usage** for unusual activity
5. **Use HTTPS proxies** when possible

## 📝 Example Proxy Configuration

### Basic HTTP Proxy
```bash
export PROXY_URL=http://proxy.example.com:8080
```

### Authenticated HTTP Proxy
```bash
export PROXY_URL=http://username:password@proxy.example.com:8080
```

### SOCKS5 Proxy
```bash
export PROXY_URL=socks5://username:password@proxy.example.com:1080
```

### HTTPS Proxy
```bash
export PROXY_URL=https://username:password@proxy.example.com:8443
```

## ✅ Success Indicators

When the proxy is working correctly, you should see:

1. **Logs show proxy usage**:
   ```
   🔍 [PROXY] Global proxy configured: http://your_proxy_url
   🔍 [PROXY] Official Suno provider using proxy: http://your_proxy_url
   ```

2. **Status endpoints show proxy info**:
   ```json
   "viaProxy": true,
   "proxyUrl": "http://your_proxy_url"
   ```

3. **Suno API returns 200 instead of 503**:
   ```json
   "ok": true,
   "status": 200,
   "message": "Official Suno API is responding"
   ```

## 🆘 Getting Help

If you're still experiencing issues:

1. **Check server logs** for detailed error messages
2. **Verify proxy connectivity** with simple curl tests
3. **Test with different proxy servers**
4. **Check proxy server status** and region
5. **Verify Suno API key** is valid and has credits

## 🔄 Next Steps

1. **Set up your proxy server** or service
2. **Configure environment variables**
3. **Test the configuration**
4. **Monitor performance** and reliability
5. **Scale up** with multiple proxy servers if needed
