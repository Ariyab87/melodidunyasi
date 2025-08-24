# Admin Panel Documentation

## Overview

The SongCreator Admin Panel provides comprehensive management capabilities for monitoring and controlling all aspects of the AI-powered song creation web application. This secure, role-based interface gives administrators full visibility into system performance, service status, and user activities.

## Features

### 🎯 Dashboard
- **Real-time System Metrics**: Monitor system uptime, memory usage, and performance
- **Service Status Overview**: View the health and status of all AI services (Suno, KITS AI, RunwayML)
- **Storage Analytics**: Track file storage usage across audio, video, image, and temporary directories
- **Live Updates**: Auto-refreshing data every 30 seconds for real-time monitoring

### ⚙️ Services Management
- **Service Configuration**: View and edit API keys, base URLs, and rate limits
- **Health Monitoring**: Real-time status monitoring for all AI services
- **Connection Testing**: Test service connectivity and API responses
- **Service Logs**: Access detailed logs for each service

### 💾 Storage Management
- **Directory Monitoring**: Track file counts and sizes across all storage directories
- **Storage Analytics**: Visual breakdown of storage usage by file type
- **Cleanup Operations**: Automated cleanup of temporary and old files
- **Storage Recommendations**: Best practices for storage optimization

### 📊 Request Monitoring
- **Request Tracking**: Monitor all user requests (song, voice, video)
- **Status Filtering**: Filter by request type, status, and service
- **Search & Pagination**: Advanced search and pagination for large datasets
- **Request Statistics**: Real-time counts of completed, processing, and failed requests

### 📝 System Logs
- **Log Monitoring**: View system logs with filtering by level and service
- **Log Export**: Export logs to CSV for external analysis
- **Log Analytics**: Statistics on log levels (info, warning, error)
- **Troubleshooting**: Detailed logs for debugging and issue resolution

## Access & Security

### Authentication
- **Admin Key Required**: Secure access using environment variable `ADMIN_SECRET_KEY`
- **Session Management**: Persistent authentication using localStorage
- **Secure Headers**: All admin API calls include the admin key in headers

### Security Features
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive validation of all admin inputs
- **Error Handling**: Secure error messages that don't expose system details
- **CORS Protection**: Restricted access to authorized origins only

## Setup Instructions

### 1. Environment Configuration
```bash
# Copy the example environment file
cp server/env.example server/.env

# Edit the .env file and set your admin key
ADMIN_SECRET_KEY=your-super-secure-admin-key-here
```

### 2. Admin Key Requirements
- **Minimum Length**: 32 characters
- **Complexity**: Include uppercase, lowercase, numbers, and special characters
- **Security**: Never commit the actual key to version control
- **Rotation**: Change the key regularly for security

### 3. Access the Admin Panel
```
URL: http://localhost:3000/admin
Admin Key: [Enter the key from your .env file]
```

## API Endpoints

### Dashboard
- `GET /api/admin/dashboard` - System statistics and metrics
- `GET /api/admin/services` - Service configuration and status
- `POST /api/admin/services/update` - Update service configuration

### Storage
- `GET /api/admin/storage` - Storage information and analytics
- `POST /api/admin/storage/cleanup` - Perform storage cleanup operations

### Monitoring
- `GET /api/admin/requests` - Service request monitoring
- `GET /api/admin/logs` - System logs with filtering

### System
- `POST /api/admin/system/restart` - Restart system services

## Usage Examples

### Monitoring Service Health
1. Navigate to **Services** tab
2. View real-time status of all AI services
3. Check API key configuration and connectivity
4. Monitor rate limits and usage

### Storage Cleanup
1. Go to **Storage** tab
2. Review current storage usage
3. Select cleanup type (temporary files or all old files)
4. Set age threshold for file removal
5. Execute cleanup operation

### Request Analysis
1. Access **Requests** tab
2. Use filters to focus on specific request types
3. Monitor request success rates and processing times
4. Identify patterns in user behavior

### System Troubleshooting
1. Check **System Logs** tab
2. Filter logs by level (error, warning, info)
3. Search for specific error messages or services
4. Export logs for external analysis

## Best Practices

### Monitoring
- **Regular Checks**: Review dashboard metrics daily
- **Alert Setup**: Monitor error logs for critical issues
- **Performance Tracking**: Track system uptime and response times
- **Storage Management**: Regular cleanup of temporary files

### Security
- **Key Management**: Use strong, unique admin keys
- **Access Control**: Limit admin access to authorized personnel only
- **Audit Logging**: Monitor admin actions and system changes
- **Regular Updates**: Keep admin panel and dependencies updated

### Maintenance
- **Storage Optimization**: Regular cleanup and monitoring
- **Service Health**: Proactive monitoring of AI service status
- **Performance Tuning**: Optimize based on usage patterns
- **Backup Strategy**: Regular backup of configuration and logs

## Troubleshooting

### Common Issues

#### Admin Access Denied
- Verify `ADMIN_SECRET_KEY` is set correctly in `.env`
- Check that the key matches exactly (case-sensitive)
- Ensure the backend server is running

#### Services Not Loading
- Check backend server status
- Verify API endpoints are accessible
- Check browser console for error messages
- Ensure CORS is configured correctly

#### Storage Information Missing
- Verify upload directories exist
- Check file permissions on storage directories
- Ensure `fs-extra` package is installed

### Error Codes
- **401 Unauthorized**: Invalid or missing admin key
- **500 Internal Server Error**: Backend service issue
- **404 Not Found**: API endpoint not available

## Support

For technical support or feature requests:
1. Check the system logs for detailed error information
2. Verify all environment variables are set correctly
3. Ensure all required packages are installed
4. Check server console for backend errors

## Future Enhancements

- **User Management**: Admin user accounts with role-based permissions
- **Advanced Analytics**: Detailed usage statistics and trends
- **Automated Alerts**: Email/SMS notifications for critical issues
- **Backup Management**: Automated backup and restore operations
- **API Documentation**: Interactive API testing interface
- **Mobile Support**: Responsive admin interface for mobile devices
