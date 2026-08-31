/**
 * CẤU HÌNH HỆ THỐNG QLBV (CONFIG)
 */
const QLBV_CONFIG = {
  // URL Google Apps Script Web App
  APPS_SCRIPT_URL: localStorage.getItem('qlbv_gas_url') || "https://script.google.com/macros/s/AKfycbyJyPtwdFM91yO8alpyzZK_un1BknzkcCNuVfiKj8YKZ5dTLrNpghT0of18QQn6ullmzw/exec",
  
  APP_NAME: "QLBV - Quản Lý Hàng Rào Điện",
  VERSION: "2.0.0",
  LEGAL_BASIS: "Quyết định 704/QĐ-SNNMT ngày 30/6/2026 & 595/QĐ-SNNMT ngày 30/3/2026",
  PROJECT_NAME: "Dự án khẩn cấp Bảo tồn Voi TP. Đồng Nai",
  
  // Thời gian hết hạn phiên đăng nhập (8 tiếng)
  SESSION_TIMEOUT_MS: 8 * 60 * 60 * 1000,
  
  // Giới hạn kích thước ảnh nén (tối đa 1280px, chất lượng 0.75 JPEG)
  IMAGE_MAX_WIDTH: 1280,
  IMAGE_QUALITY: 0.75
};

/**
 * Lưu URL Google Apps Script vào LocalStorage
 */
function setAppsScriptUrl(url) {
  QLBV_CONFIG.APPS_SCRIPT_URL = url.trim();
  localStorage.setItem('qlbv_gas_url', url.trim());
}
