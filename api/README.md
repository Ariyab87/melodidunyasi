# 🎵 SongCreator Backend Server

A comprehensive backend server for the SongCreator webapp that integrates with multiple AI APIs for song generation, voice cloning, and video animation.

## 🚀 Features

- **🎵 Song Generation**: Integration with Suno API for AI-powered music creation
- **🎤 Voice Cloning**: Integration with KITS AI for voice replication
- **🎬 Video Animation**: Integration with RunwayML Gen-3 for photo/video animation
- **📁 File Upload**: Secure file handling for audio and media files
- **🔒 Security**: Rate limiting, CORS, helmet security headers
- **📊 Monitoring**: Health checks, status monitoring, and error handling
- **🌍 Multi-language**: Support for Turkish, English, and Dutch

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Multer** - File upload handling
- **Axios** - HTTP client for API calls
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API request throttling

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- API keys for:
  - Suno API (song generation)
  - KITS AI (voice cloning)
  - RunwayML (video generation)

## ⚙️ Installation

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your API keys:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # API Keys
   SUNO_API_KEY=your_suno_api_key_here
   KITS_API_KEY=your_kits_ai_api_key_here
   RUNWAY_API_KEY=your_runwayml_api_key_here
   
   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   ALLOWED_AUDIO_TYPES=mp3,wav,m4a,aac
   ALLOWED_MEDIA_TYPES=jpg,jpeg,png,mp4,mov,avi
   ```

4. **Create upload directories:**
   ```bash
   mkdir -p uploads/{audio,images,videos,temp}
   ```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## 📡 API Endpoints

### 🎵 Song Generation (Suno API)

#### Generate Song
```http
POST /api/song/generate
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "specialOccasion": "Wedding",
  "songStyle": "Romantic Ballad",
  "mood": "Emotional",
  "tempo": "Slow",
  "namesToInclude": "Sarah & John",
  "yourStory": "Our love story...",
  "additionalNotes": "Include guitar solo"
}
```

#### Check Song Status
```http
GET /api/song/status/:songId
```

#### Get Available Models
```http
GET /api/song/models
```

#### Health Check
```http
GET /api/song/health
```

### 🎤 Voice Cloning (KITS AI)

#### Clone Voice
```http
POST /api/voice/clone
Content-Type: multipart/form-data

audio: [audio file]
fullName: "John Doe"
email: "john@example.com"
purpose: "Personal songs"
additionalNotes: "Clear voice sample"
targetLanguage: "en"
quality: "high"
```

#### Check Voice Status
```http
GET /api/voice/status/:voiceId
```

#### Generate Speech
```http
POST /api/voice/synthesize
Content-Type: application/json

{
  "voiceId": "voice_123",
  "text": "Hello, this is my cloned voice!",
  "speed": 1.0,
  "pitch": 1.0,
  "emotion": "neutral"
}
```

#### Get Supported Formats
```http
GET /api/voice/supported-formats
```

### 🎬 Video Generation (RunwayML)

#### Generate Video
```http
POST /api/video/generate
Content-Type: multipart/form-data

media: [media files]
fullName: "John Doe"
email: "john@example.com"
animationStyle: "cinematic"
desiredDuration: "15"
animationPrompt: "Make photos dance and move smoothly"
videoScenario: "Wedding celebration"
additionalNotes: "Keep it elegant"
```

#### Check Video Status
```http
GET /api/video/status/:videoId
```

#### Get Animation Styles
```http
GET /api/video/styles
```

#### Get Duration Options
```http
GET /api/video/durations
```

### 📁 File Upload

#### Upload Info
```http
GET /api/upload/info
```

#### Storage Usage
```http
GET /api/upload/storage
```

#### Cleanup Files
```http
DELETE /api/upload/cleanup?type=temp
```

#### Health Check
```http
GET /api/upload/health
```

### 🏥 General Health

#### Server Health
```http
GET /health
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `SUNO_API_KEY` | Suno API key | Required |
| `KITS_API_KEY` | KITS AI API key | Required |
| `RUNWAY_API_KEY` | RunwayML API key | Required |
| `MAX_FILE_SIZE` | Max file size in bytes | `10485760` (10MB) |
| `ALLOWED_AUDIO_TYPES` | Comma-separated audio types | `mp3,wav,m4a,aac` |
| `ALLOWED_MEDIA_TYPES` | Comma-separated media types | `jpg,jpeg,png,mp4,mov,avi` |

### File Upload Limits

- **Audio Files**: Max 10MB, formats: MP3, WAV, M4A, AAC
- **Media Files**: Max 50MB total, formats: JPG, PNG, MP4, MOV, AVI
- **Max Files**: 10 files per request
- **Max Fields**: 20 form fields per request

## 🚨 Error Handling

The server includes comprehensive error handling for:

- **API Errors**: Invalid keys, rate limits, service outages
- **File Errors**: Size limits, format validation, upload failures
- **Validation Errors**: Missing fields, invalid formats
- **System Errors**: File system issues, network problems

All errors return structured JSON responses with:
- Error type and message
- HTTP status codes
- Timestamps
- Detailed error information (in development)

## 📊 Monitoring & Logging

### Health Checks
- `/health` - Overall server health
- `/api/song/health` - Suno API status
- `/api/voice/health` - KITS AI API status
- `/api/video/health` - RunwayML API status
- `/api/upload/health` - File system status

### Logging
- Request logging with timestamps
- API call logging with parameters
- Error logging with stack traces
- File upload logging with sizes and types

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin access
- **Rate Limiting**: Request throttling per IP
- **File Validation**: Type and size restrictions
- **Input Validation**: Request parameter validation

## 🧪 Testing

### Manual Testing
```bash
# Test song generation
curl -X POST http://localhost:5000/api/song/generate \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@test.com","specialOccasion":"Test","songStyle":"Pop","mood":"Happy","tempo":"Fast","yourStory":"Test story"}'

# Test health check
curl http://localhost:5000/health

# Test upload info
curl http://localhost:5000/api/upload/info
```

### Automated Testing
```bash
npm test
```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set all required API keys
2. **File Storage**: Use cloud storage (AWS S3, Google Cloud Storage)
3. **Database**: Add user management and request tracking
4. **Monitoring**: Add application performance monitoring
5. **SSL**: Enable HTTPS with valid certificates
6. **Load Balancing**: For high-traffic scenarios

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions:
- Email: eviewsyardim@gmail.com
- Phone: +32651544223

## 🔄 API Integration Status

- ✅ **Suno API**: Song generation fully integrated
- ✅ **KITS AI**: Voice cloning fully integrated  
- ✅ **RunwayML**: Video generation fully integrated
- ✅ **File Upload**: Audio and media file handling
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Security**: Rate limiting and validation
- ✅ **Monitoring**: Health checks and logging

Your backend is now ready to handle real AI-powered song creation, voice cloning, and video animation! 🎉
