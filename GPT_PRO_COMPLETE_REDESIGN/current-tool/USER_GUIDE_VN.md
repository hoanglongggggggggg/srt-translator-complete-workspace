# Hướng Dẫn Sử Dụng SRT Translator

## Dành cho người không rành kỹ thuật

---

## ✨ Cách Dùng MIỄN PHÍ với ProxyPal (Khuyên dùng!)

### Bước 1: Cài ProxyPal (Đã có sẵn!)

Nếu bạn đang dùng Cursor hoặc Copilot, **bạn đã có ProxyPal rồi!**

1. Mở ProxyPal
2. Đảm bảo nó đang chạy (icon ở system tray)
3. Port mặc định: `8317`

### Bước 2: Cài SRT Translator

1. Mở app **SRT Translator**
2. Click **⚙️ Settings**
3. Chọn **🆓 ProxyPal** (nút đầu tiên, màu xanh)
4. Click **💾 Save Settings**

**Xong! Không cần API key, không tốn tiền!** 🎉

### Bước 3: Dịch Phụ Đề

1. Click **📁 Click to select SRT file**
2. Chọn file `.srt` của bạn
3. Click **🚀 Translate Now**
4. Đợi progress bar chạy
5. File dịch xong: `ten_file_translated.srt`

**Hoàn toàn MIỄN PHÍ vì dùng subscription Cursor/Copilot có sẵn!** 💰

---

## 🔑 Cách Dùng với API Key riêng (Trả phí)

> Chỉ dùng nếu không có ProxyPal hoặc muốn dùng riêng

### Bước 1: Lấy API Key

#### OpenAI:
1. Vào https://platform.openai.com/
2. Đăng ký tài khoản
3. Vào **API Keys** → **Create new secret key**
4. Copy key (bắt đầu với `sk-...`)

**Chi phí:** ~$0.15 (3.5k VNĐ) cho 1000 dòng

#### Claude:
1. Vào https://console.anthropic.com/
2. Tương tự OpenAI
3. Key bắt đầu với `sk-ant-...`

### Bước 2: Cấu hình

1. Mở **SRT Translator**
2. Click **⚙️ Settings**
3. Chọn **OpenAI** hoặc **Anthropic**
4. Paste API key
5. Click **💾 Save Settings**

### Bước 3: Dịch

Giống như với ProxyPal ở trên!

---

## So Sánh 2 Cách

| | ProxyPal (Miễn phí) | API Key (Trả phí) |
|---|---|---|
| **Chi phí** | 🆓 Miễn phí | 💰 ~3-5k VNĐ/1000 dòng |
| **Cần setup** | ✅ Rất đơn giản | ⚠️ Phải có API key |
| **Tốc độ** | ✅ Nhanh | ✅ Nhanh |
| **Chất lượng** | ✅ Giống nhau | ✅ Giống nhau |
| **Giới hạn** | ⚠️ Share với Cursor | ✅ Không giới hạn |

**Khuyên dùng:** ProxyPal nếu bạn đã có subscription!

---

## Câu Hỏi Thường Gặp

### ❓ ProxyPal là gì?

App giúp Cursor/Copilot kết nối với nhiều AI model. Nếu bạn dùng Cursor, bạn đã có!

### ❓ Tôi có ProxyPal không?

Kiểm tra:
- Bạn có dùng Cursor IDE không?
- Có icon ProxyPal ở system tray không?
- Nếu có → Dùng miễn phí!

### ❓ Dịch bằng ProxyPal có ảnh hưởng Cursor không?

Ít thôi! Vì:
- Dịch phụ đề dùng ít quota
- ProxyPal quản lý quota thông minh
- Chỉ khi dịch file rất lớn (5000+ dòng) mới cần chú ý

### ❓ Nếu không có ProxyPal?

Dùng OpenAI/Claude với API key (trả phí). Vẫn rẻ lắm (~3k VNĐ/1000 dòng).

### ❓ App dịch mất bao lâu?

- 100 dòng: ~30 giây
- 500 dòng: ~2-3 phút
- 1000 dòng: ~5 phút

### ❓ Dịch có chính xác không?

✅ Rất chính xác! Dùng GPT-4/Claude:
- Chất lượng như người dịch
- Giữ nguyên thời gian
- Giữ nguyên định dạng (in nghiêng, đậm...)

### ❓ Gặp lỗi "Connection refused"?

**Với ProxyPal:**
1. Kiểm tra ProxyPal có đang chạy không
2. Port có đúng 8317 không
3. Thử restart ProxyPal

**Với API key:**
1. Kiểm tra key có đúng không
2. Xem còn credit không

---

## Tóm Tắt - Siêu Nhanh!

### Với ProxyPal (Miễn phí):
```
1. Mở ProxyPal (đã có sẵn)
2. Settings → Chọn "ProxyPal" → Save
3. Chọn file .srt → Translate Now
```

### Với API key (Trả phí):
```
1. Lấy API key từ OpenAI/Claude
2. Settings → Paste key → Save  
3. Chọn file .srt → Translate Now
```

**Dễ vậy thôi!** 🎉

---

## Mẹo Hay

### 💡 Dịch nhanh hơn
- Tăng **Threads** lên 4-5
- Tăng **Batch Size** lên 30-40

### 💡 Chất lượng tốt hơn
- Giảm **Batch Size** xuống 15-20
- AI có nhiều context hơn

### 💡 Tiết kiệm quota (ProxyPal)
- Dịch vào lúc không code (sáng sớm, tối khuya)
- Giảm threads xuống 2-3

---

**Chúc bạn dịch phụ đề vui vẻ!** 😊
