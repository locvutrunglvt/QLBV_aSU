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

---

## 🖥️ CÁCH 3: TRIỂN KHAI BẰNG VERCEL (NHANH NHẤT, TỰ ĐỘNG CẬP NHẬT)

> Vercel phục vụ trực tiếp thư mục gốc của repo. Cấu hình đã có sẵn trong [`vercel.json`](vercel.json).

1. Truy cập [vercel.com/new](https://vercel.com/new) và đăng nhập bằng tài khoản GitHub.
2. Chọn **Import** repository `QLBV_aSU`.
3. Giữ nguyên toàn bộ thiết lập mặc định:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./`
   - **Build Command / Output Directory**: để trống
4. Bấm **Deploy**. Sau khoảng 30 giây sẽ có link dạng `https://qlbv-a-su.vercel.app`.

Từ lần sau, **mỗi lần `git push` lên nhánh `main` Vercel sẽ tự động deploy lại**.

Nếu muốn deploy bằng dòng lệnh:

```bash
npm i -g vercel
vercel login          # xác thực 1 lần qua trình duyệt
vercel --prod
```

---

## 🔧 BUILD LẠI BẢN CHO GOOGLE APPS SCRIPT

Ứng dụng có **hai bản dùng chung một mã nguồn**:

| Bản | File | Dùng khi |
|-----|------|----------|
| Web / PWA | `index.html` + `css/` + `js/` | Vercel, GitHub Pages |
| Google Apps Script | `backend/Index.html` | Chạy thẳng trên Google Sheets |

`backend/Index.html` **được sinh tự động**, không sửa tay. Sau khi thay đổi giao diện hoặc mã nguồn, chạy:

```bash
node build_backend.js
```

Lệnh này gộp `index.html` + `css/style.css` + toàn bộ `js/*.js` thành một file duy nhất cho Apps Script. Trước đây hai bản được chép tay nên luôn bị lệch nhau — sửa bên này nhưng bên kia vẫn hiện bản cũ.

---

## 🔐 GHI CHÚ VỀ ĐĂNG NHẬP

- Mặc định phiên đăng nhập **chỉ tồn tại trong tab đang mở**. Đóng ứng dụng rồi mở lại là phải đăng nhập lại.
- Tick **"Ghi nhớ đăng nhập"** thì phiên mới được lưu trên máy, tự hết hạn sau 8 tiếng.
- Chưa đăng nhập thì không màn hình nào trong ứng dụng mở được.
- Tài khoản có trạng thái **Đang khóa** sẽ không đăng nhập được.

## 👥 THÔNG TIN TÀI KHOẢN & PHÂN QUYỀN ĐĂNG NHẬP

| Tài khoản | Mật khẩu mặc định | Vai trò (Role) | Quyền hạn |
|-----------|-------------------|----------------|-----------|
| **`admin`** | `123456` | 👑 **Quản trị viên (Admin)** | Toàn quyền xem, sửa, xóa, duyệt bản ghi, đổi mật khẩu mọi người |
| **`giamsat`** | `123456` | 🔍 **Cán bộ Giám sát (Supervisor)** | Xem toàn bộ biên bản, ký duyệt, nhận xét nhật ký, xuất PDF A4 |
| **`baotri01`** | `123456` | 🛠️ **Đội Bảo trì (Worker)** | Lập biên bản hiện trường, chụp ảnh gắn GPS, tính diện tích tự động |
