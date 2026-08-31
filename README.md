# ⚡ HƯỚNG DẪN TRIỂN KHAI QLBV (KHÔNG CẦN GITHUB & CÓ GITHUB)
> **Hệ thống Quản lý & Số hóa Biên bản Hàng rào điện Bảo tồn Voi Đồng Nai**  
> **Tác giả:** Lộc Vũ Trung

---

## 🌟 CÁCH 1: TRIỂN KHAI 100% BẰNG GOOGLE (CHỈ CẦN GMAIL - KHÔNG CẦN GITHUB)
> 💡 *Đây là cách đơn giản và tiện lợi nhất cho bạn của bạn! Chỉ cần có tài khoản Gmail thông thường là chạy được ngay lập tức, không cần tài khoản GitHub, không cài đặt phần mềm.*

### Các bước thực hiện (chỉ mất 2 phút):
1. **Bước 1**: Mở trình duyệt và truy cập vào [Google Sheets](https://sheets.google.com) bằng tài khoản Gmail của bạn.
2. **Bước 2**: Tạo 1 bảng tính mới (hoặc mở file [`backend/QLBV_GoogleSheets_Template.xlsx`](file:///g:/My%20Drive/GIS/Out/A%20Su%20K40%20QLBV/backend/QLBV_GoogleSheets_Template.xlsx) tải lên Drive).
3. **Bước 3**: Trên thanh menu Google Sheets, bấm vào: **Tiện ích mở rộng (Extensions)** ➔ **Apps Script**.
4. **Bước 4**:
   - Tại file `Code.gs`: Copy toàn bộ mã nguồn trong [`backend/Code.gs`](file:///g:/My%20Drive/GIS/Out/A%20Su%20K40%20QLBV/backend/Code.gs) dán vào.
   - Bấm dấu **+** ở cạnh "Tệp" (Files) ➔ Chọn **HTML** ➔ Đặt tên là `Index` ➔ Copy toàn bộ nội dung trong [`backend/Index.html`](file:///g:/My%20Drive/GIS/Out/A%20Su%20K40%20QLBV/backend/Index.html) dán vào.
5. **Bước 5**: Bấm biểu tượng **Lưu (Ctrl + S)**.
6. **Bước 6**: Bấm nút **Triển khai (Deploy)** (màu xanh góc trên bên phải) ➔ Chọn **Tùy chọn triển khai mới (New deployment)**:
   - **Loại (Type)**: Chọn biểu tượng bánh răng ⚙️ ➔ Chọn **Ứng dụng web (Web app)**.
   - **Mô tả**: `QLBV Mobile App`
   - **Thực thi dưới dạng**: `Tôi (Me)`
   - **Người có quyền truy cập**: **`Bất kỳ ai (Anyone)`** *(để mọi người trong đội có thể mở trên điện thoại)*.
7. **Bước 7**: Bấm **Triển khai (Deploy)** ➔ Cấp quyền xác nhận Google Account.
8. **Hoàn tất!** Google sẽ cung cấp 1 đường link duy nhất dạng:
   👉 `https://script.google.com/macros/s/AKfycb.../exec`
   
> 📱 **Gửi đường link này qua Zalo/Email cho bạn của bạn**:
> - Mở link trên **iPhone (Safari)** hoặc **Android (Chrome)** là WebApp xuất hiện với đầy đủ giao diện mượt mà, thanh điều hướng đáy màn hình, camera GPS và chức năng In/Xuất PDF!
> - Thêm vào màn hình chính: Bấm nút "Chia sẻ" ➔ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)** là dùng như 1 ứng dụng app thật trên điện thoại!

---

## 🚀 CÁCH 2: TRIỂN KHAI BẰNG GITHUB PAGES (DÀNH CHO LẬP TRÌNH VIÊN)
1. Đẩy các file ở thư mục gốc (`index.html`, `manifest.json`, `sw.js`, thư mục `css/`, `js/`) lên GitHub Repository.
2. Vào mục **Settings** ➔ **Pages** ➔ Chọn branch `main` folder `/ (root)` ➔ Bấm **Save**.
3. Mở link GitHub Pages trên điện thoại và nhập URL Web App của Google Apps Script vào phần Cài đặt.

---

## 👥 THÔNG TIN TÀI KHOẢN & PHÂN QUYỀN ĐĂNG NHẬP

| Tài khoản | Mật khẩu mặc định | Vai trò (Role) | Quyền hạn |
|-----------|-------------------|----------------|-----------|
| **`admin`** | `123456` | 👑 **Quản trị viên (Admin)** | Toàn quyền xem, sửa, xóa, duyệt bản ghi, đổi mật khẩu mọi người |
| **`giamsat`** | `123456` | 🔍 **Cán bộ Giám sát (Supervisor)** | Xem toàn bộ biên bản, ký duyệt, nhận xét nhật ký, xuất PDF A4 |
| **`baotri01`** | `123456` | 🛠️ **Đội Bảo trì (Worker)** | Lập biên bản hiện trường, chụp ảnh gắn GPS, tính diện tích tự động |
