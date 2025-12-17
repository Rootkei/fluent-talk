# English Voice Chat - AI-Powered Speaking Practice

A real-time English conversation practice application powered by AI, featuring voice activity detection, phrase highlighting, and role-play scenarios.

![Build](https://github.com/Rootkei/fluent-talk/workflows/Build%20and%20Test/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

### Core Features
- 🎤 **Voice Activity Detection (VAD)** - Automatic speech detection
- 🗣️ **Groq Whisper API** - High-accuracy English transcription
- 🔊 **Text-to-Speech** - Natural English voice responses
- 💬 **Real-time Chat** - WebSocket-based communication
- 🎯 **Topic & Level Selection** - Customize conversation context (A1-C2)

### Learning Features
- 💡 **Phrase Highlighter** - AI marks useful phrases automatically
- 📚 **Phrase Bank** - Save and categorize important expressions
- 🎭 **Role-Play Scenarios** - Practice 12 real-world situations:
  - Restaurant, Airport, Interview, Shopping
  - Hotel, Doctor, Bank, Taxi
  - Phone Call, Meeting, Party, Complaint

### UI/UX
- 🌓 **Dark/Light Theme** - Toggle between themes
- 📱 **Fully Responsive** - Works on desktop, tablet, mobile
- 🔍 **Search Messages** - Find past conversations
- ⚙️ **Customizable Settings** - Voice gender, speech rate, sound effects
- 🎨 **Modern Design** - Glassmorphism, smooth animations

## 🚀 Quick Start

### Prerequisites
- Go 1.21 or higher
- Groq API key ([Get it here](https://console.groq.com))
- Modern web browser

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Rootkei/fluent-talk.git
cd fluent-talk
```

2. **Setup Backend**
```bash
cd backend
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
go mod download
```

3. **Run the server**
```bash
go run cmd/server/main.go
```

4. **Open Frontend**
```bash
# Open in browser
http://localhost:5500/frontend/index.html

# Or use Live Server extension in VS Code
```

## 📁 Project Structure

```
.
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go          # Entry point
│   ├── internal/
│   │   ├── domain/              # Business logic
│   │   ├── infrastructure/      # External services
│   │   │   ├── ai/              # Groq AI client
│   │   │   └── config/          # Configuration
│   │   └── interfaces/          # HTTP handlers
│   │       └── http/
│   ├── go.mod
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── index.html               # Main entry
│   ├── app-premium.js           # Main controller
│   └── assets/
│       ├── css/                 # Stylesheets
│       │   ├── premium.css
│       │   ├── phrase-highlighter.css
│       │   └── scenarios.css
│       └── js/                  # JavaScript modules
│           ├── advanced-features.js
│           ├── phrase-scenarios.js
│           └── polish.js
│
└── .github/
    └── workflows/               # CI/CD pipelines
        ├── build.yml
        ├── deploy.yml
        ├── pages.yml
        └── release.yml
```

## 🔧 Configuration

### Backend (.env)
```env
GROQ_API_KEY=your_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
PORT=8080
```

### Frontend
No configuration needed. All settings available in UI.

## 🎯 Usage

### Basic Conversation
1. Click the microphone button
2. Speak in English
3. AI responds with helpful feedback
4. Click highlighted phrases to save them

### Role-Play Practice
1. Click 🎭 button
2. Choose a scenario (e.g., Restaurant)
3. AI acts as the character
4. Practice real-world conversations

### Phrase Learning
1. AI highlights useful phrases in yellow
2. Click to save to your phrase bank
3. Access saved phrases via 💡 button
4. Search and filter by category

## 🚀 Deployment

### Production Deployment

**Backend Options:**
- [Render.com](./RENDER_DEPLOYMENT.md) - Easiest, free tier available
- [AWS](./AWS_DEPLOYMENT.md) - Multiple options (EC2, App Runner, ECS, Elastic Beanstalk)
- [Northflank](./NORTHFLANK_DEPLOYMENT.md) - Developer-friendly platform

**Frontend:**
- [GitHub Pages](/.github/workflows/PAGES_README.md) - Free static hosting

**Current Production:**
- Backend: https://fluent-talk.onrender.com
- Frontend: https://rootkei.github.io/fluent-talk/

### Local Development

```bash
# Backend
cd backend
go run cmd/server/main.go

# Frontend
# Use Live Server or any static file server
# Open http://localhost:5500/frontend/index.html
```

## 🛠️ Development

### Run Tests
```bash
cd backend
go test -v ./...
```

### Build for Production
```bash
cd backend
go build -o server cmd/server/main.go
```

### Lint Code
```bash
golangci-lint run ./...
```

## 📦 Docker

### Build Image
```bash
cd backend
docker build -t english-voice-chat .
```

### Run Container
```bash
docker run -p 8080:8080 \
  -e GROQ_API_KEY=your_key \
  english-voice-chat
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Groq](https://groq.com) - AI inference platform
- [Whisper](https://openai.com/research/whisper) - Speech recognition
- Web Speech API - Text-to-speech

## 📧 Contact

For questions or support, please open an issue on GitHub.

## 🌟 Star History

If you find this project helpful, please consider giving it a star!

---

**Made with ❤️ for English learners worldwide**
