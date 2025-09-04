# API Disabled Status

## Overview
The API has been disabled for this application. All song generation, voice cloning, and video animation features are currently unavailable.

## What's Disabled
- ✅ Song generation API calls
- ✅ Voice cloning API calls  
- ✅ Video animation API calls
- ✅ Provider health checks
- ✅ Status polling

## How It's Disabled
The API is disabled by setting `API_DISABLED = true` in `lib/api.ts`. This causes:

1. **API_ORIGIN** to point to a non-existent URL (`https://api-disabled.example.com`)
2. All API functions to return mock error responses
3. Users to see appropriate error messages when trying to use features

## User Experience
When the API is disabled:

1. **Banner**: A red banner appears at the top of the page warning users
2. **Form Submission**: Users get clear error messages when trying to submit forms
3. **Toast Notifications**: Additional toast notifications appear for API-related errors
4. **Graceful Degradation**: The UI remains functional but shows appropriate error states

## To Re-enable the API
1. Set `API_DISABLED = false` in `lib/api.ts`
2. Ensure the API server is running (typically on port 5001)
3. Verify environment variables are properly configured
4. Test the API endpoints

## Current Configuration
- **API_DISABLED**: `true`
- **API_ORIGIN**: `https://api-disabled.example.com` (non-existent)
- **API_BASE**: `https://api-disabled.example.com/api`

## Files Modified
- `lib/api.ts` - Main API configuration and functions
- `app/page.tsx` - Added API disabled banner and toast notifications

## Testing
To test the disabled state:
1. Try submitting a song generation form
2. Check that appropriate error messages appear
3. Verify the banner is visible
4. Confirm no actual API calls are made

## Notes
- The frontend application remains fully functional
- All UI components work normally
- Only the backend API integration is disabled
- Users can still navigate and view all pages
