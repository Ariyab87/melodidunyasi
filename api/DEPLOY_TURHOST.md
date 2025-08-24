# Turhost cPanel Deployment Guide

This guide will help you deploy the SongCreator API backend to Turhost using cPanel's Node.js application feature.

## Prerequisites

- cPanel access to your Turhost hosting account
- Node.js 18.x or 20.x support enabled
- MongoDB Atlas database (or other MongoDB instance)

## Step 1: Setup Node.js App in cPanel

1. **Login to cPanel**
   - Access your cPanel dashboard at `https://yourdomain.com/cpanel`

2. **Navigate to Node.js Apps**
   - Find and click on "Setup Node.js App" or "Node.js Apps"

3. **Create New Application**
   - Click "Create Application"
   - Fill in the following details:
     - **App Root**: `public_html/api`
     - **App URL**: `https://yourdomain.com/api`
     - **Startup File**: `server.js`
     - **Node.js Version**: Select 18.x or 20.x
     - **App Mode**: Production
     - **Passenger**: Enabled (if available)

## Step 2: Upload API Files

1. **Upload the API folder contents**
   - Upload all files from the `api/` folder to `public_html/api/`
   - Ensure the file structure is maintained

2. **Install Dependencies**
   - In cPanel's Terminal or SSH access:
     ```bash
     cd public_html/api
     npm install --production
     ```

## Step 3: Configure Environment Variables

1. **Set Environment Variables**
   - In your Node.js app settings, add these environment variables:
     ```
     NODE_ENV=production
     PORT=5001
     MONGODB_URI=<your MongoDB Atlas URI>
     JWT_SECRET=<generate a strong secret>
     SESSION_SECRET=<generate another strong secret>
     CORS_ORIGINS=https://melodidunyasi.com,https://www.melodidunyasi.com
     BACKEND_PUBLIC_URL=https://melodidunyasi.com
     FRONTEND_URL=https://melodidunyasi.com
     SUNOAPI_ORG_API_KEY=226c6f04c6b35974342adb1821e8cafc
     SUNOAPI_ORG_BASE_URL=https://api.sunoapi.org/api/v1
     SUNOAPI_ORG_CALLBACK_URL=https://melodidunyasi.com/api/webhook
     ```

2. **Generate Secrets**
   - Use a secure random generator for JWT_SECRET and SESSION_SECRET
   - Example: `openssl rand -hex 32`

## Step 4: Start the Application

1. **Restart the Node.js App**
   - In cPanel, click "Restart" for your Node.js application

2. **Check Application Status**
   - Ensure the app shows as "Running"

## Step 5: Test the Deployment

1. **Health Check**
   - Test the health endpoint: `https://yourdomain.com/api/api/health`
   - Should return a JSON response with status "OK"

2. **API Endpoints**
   - Test other endpoints like:
     - `https://yourdomain.com/api/api/song`
     - `https://yourdomain.com/api/api/voice`
     - `https://yourdomain.com/api/api/video`

## Step 6: Update Frontend Configuration

1. **Update Frontend Environment**
   - Set `NEXT_PUBLIC_API_URL=https://yourdomain.com/api` in your frontend
   - This ensures the frontend calls the correct API endpoints

## Troubleshooting

### Common Issues

1. **App Not Starting**
   - Check the error logs in cPanel
   - Verify all environment variables are set
   - Ensure Node.js version is compatible

2. **CORS Errors**
   - Verify CORS_ORIGINS includes your frontend domain
   - Check that the frontend URL is correct

3. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Check network access from your hosting provider

4. **File Upload Issues**
   - Ensure upload directories have proper permissions
   - Check file size limits in your hosting configuration

### Logs and Debugging

1. **View Application Logs**
   - Check cPanel's error logs
   - Use the Terminal feature to view real-time logs

2. **Test Locally First**
   - Test the API locally before deploying
   - Use `npm run dev` to start the development server

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive data to version control
   - Use strong, unique secrets for JWT and sessions

2. **Rate Limiting**
   - The API includes built-in rate limiting
   - Adjust limits based on your hosting plan

3. **CORS Configuration**
   - Only allow necessary origins
   - Restrict to your production domains

## Performance Optimization

1. **Compression**
   - The API uses compression middleware
   - Monitor response times and optimize as needed

2. **File Uploads**
   - Consider using a CDN for file storage in production
   - Implement proper file cleanup

## Support

If you encounter issues during deployment:

1. Check the cPanel error logs
2. Verify all environment variables are set correctly
3. Test the API endpoints individually
4. Contact Turhost support if hosting-related issues persist

## Next Steps

After successful deployment:

1. Update your frontend to use the new API URL
2. Test all major functionality
3. Monitor the application logs for any errors
4. Set up monitoring and alerting if needed
