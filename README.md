# Real-Time AI Chat Application

Ứng dụng chat real-time với AI Groq, sử dụng WebSocket để giao tiếp giữa frontend và backend.

## 🚀 Tính năng

- ✨ Giao diện hiện đại với glassmorphism và gradient
- 💬 Chat real-time với AI Groq (Llama 3.3 70B)
- 🔄 Tự động kết nối lại khi mất kết nối
- 📱 Responsive design cho mọi thiết bị
- ⚡ WebSocket cho hiệu suất cao
- 🎨 Animations mượt mà và hiệu ứng đẹp mắt

## 🛠️ Công nghệ sử dụng

### Backend
- **Golang** - WebSocket server
- **gorilla/websocket** - WebSocket implementation
- **Groq API** - AI chat với Llama 3.3 70B

### Frontend
- **HTML5** - Cấu trúc semantic
- **CSS3** - Styling hiện đại với animations
- **Vanilla JavaScript** - WebSocket client

## 📋 Yêu cầu

- Go 1.21 trở lên
- Groq API Key (đăng ký tại [console.groq.com](https://console.groq.com))
- Trình duyệt web hiện đại

## 🔧 Cài đặt

### 1. Clone repository

```bash
cd c:\Mine\test
```

### 2. Cấu hình Backend

```bash
cd backend

# Tạo file .env từ template
copy .env.example .env

# Chỉnh sửa .env và thêm Groq API key của bạn
# GROQ_API_KEY=your_actual_api_key_here
# PORT=8080
```

### 3. Cài đặt dependencies

```bash
go mod download
```

## 🚀 Chạy ứng dụng

### 1. Khởi động Backend

```bash
cd backend
go run main.go
```

Server sẽ chạy tại `http://localhost:8080`

### 2. Mở Frontend

Mở file `frontend/index.html` trong trình duyệt web của bạn, hoặc sử dụng Live Server:

```bash
cd frontend
# Mở index.html bằng trình duyệt hoặc Live Server
```

## 📝 Cấu trúc thư mục

```
c:\Mine\test\
├── backend/
│   ├── main.go           # WebSocket server và Groq API integration
│   ├── go.mod            # Go dependencies
│   ├── .env.example      # Environment variables template
│   └── .env              # Your actual environment variables (create this)
├── frontend/
│   ├── index.html        # HTML structure
│   ├── style.css         # Styling và animations
│   └── app.js            # WebSocket client logic
└── README.md             # Documentation
```

## 🔑 Lấy Groq API Key

1. Truy cập [console.groq.com](https://console.groq.com)
2. Đăng ký/đăng nhập tài khoản
3. Tạo API key mới
4. Copy API key và paste vào file `.env`

## 💡 Sử dụng

1. Đảm bảo backend đang chạy
2. Mở frontend trong trình duyệt
3. Đợi status indicator hiển thị "Đã kết nối"
4. Nhập tin nhắn và nhấn Enter hoặc click nút gửi
5. AI sẽ phản hồi trong thời gian thực

## 🎨 Tùy chỉnh

### Thay đổi model AI

Trong `backend/main.go`, tìm dòng:

```go
Model: "llama-3.3-70b-versatile",
```

Thay đổi thành model khác của Groq (ví dụ: `mixtral-8x7b-32768`)

### Thay đổi port

Trong file `.env`:

```env
PORT=8080  # Thay đổi thành port bạn muốn
```

Và trong `frontend/app.js`:

```javascript
const WS_URL = 'ws://localhost:8080/ws';  // Cập nhật port tương ứng
```

## 🐛 Xử lý lỗi

### Backend không kết nối được

- Kiểm tra GROQ_API_KEY trong file `.env`
- Đảm bảo port 8080 không bị sử dụng bởi ứng dụng khác
- Kiểm tra logs trong terminal

### Frontend không kết nối WebSocket

- Đảm bảo backend đang chạy
- Kiểm tra URL WebSocket trong `app.js`
- Mở Developer Console để xem lỗi

## 📄 License

MIT License - Tự do sử dụng cho mục đích cá nhân và thương mại.

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Hãy tạo issue hoặc pull request.

## 📧 Liên hệ

Nếu có câu hỏi hoặc góp ý, vui lòng tạo issue trên repository.
