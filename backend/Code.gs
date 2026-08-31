/**
 * ============================================================================
 * HỆ THỐNG QUẢN LÝ BẢO TRÌ TUYẾN HÀNG RÀO ĐIỆN (QLBV) - ALL-IN-ONE GOOGLE WEB APP
 * Chạy 100% trên Google Drive / Gmail - KHÔNG CẦN GITHUB HAY HOSTING NGOÀI!
 * Tác giả: Lộc Vũ Trung
 * ============================================================================
 */

// Cấu hình tên Sheet trong Google Spreadsheet
const SHEETS = {
  USERS: 'Users',
  MASTER_DATA: 'MasterData',
  BB_BAOTRI: 'BB_BaoTri',
  BB_VESINH: 'BB_VeSinh',
  NHATKY: 'NhatKy_ThiCong',
  LOGS: 'SystemLogs'
};

const PHOTO_FOLDER_NAME = "QLBV_Field_Photos";

/**
 * 1. NẠP VÀ HIỂN THỊ GIAO DIỆN WEB CHO IPHONE / ANDROID / PC
 */
function doGet(e) {
  // Nếu là gọi API lấy dữ liệu
  if (e && e.parameter && e.parameter.action) {
    return handleApiGet(e);
  }

  // Mặc định: Hiển thị giao diện WebApp trực tiếp từ Google Apps Script
  const htmlOutput = HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle("QLBV - Quản Lý Hàng Rào Điện Đồng Nai")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
  return htmlOutput;
}

/**
 * 2. XỬ LÝ POST REQUEST (Lưu dữ liệu, Đăng nhập, Quản lý Nhân sự, Quên mật khẩu)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let response = { success: false, message: "Action không hợp lệ" };

    switch (action) {
      case 'login':
        response = handleLogin(ss, data.username, data.passwordHash);
        break;

      case 'changePassword':
        response = handleChangePassword(ss, data.username, data.oldPasswordHash, data.newPasswordHash);
        break;

      case 'forgotPassword':
        response = handleForgotPassword(ss, data.usernameOrEmail);
        break;

      case 'getUsers':
        response = handleGetUsers(ss, data.adminUsername);
        break;

      case 'addUser':
        response = handleAddUser(ss, data.adminUsername, data.userData);
        break;

      case 'updateUser':
        response = handleUpdateUser(ss, data.adminUsername, data.userData);
        break;

      case 'resetUserPassword':
        response = handleResetUserPassword(ss, data.adminUsername, data.targetUsername, data.newPasswordHash);
        break;

      case 'deleteUser':
        response = handleDeleteUser(ss, data.adminUsername, data.targetUsername);
        break;

      case 'saveRecord':
        response = handleSaveRecord(ss, data);
        break;

      case 'getMasterData':
        response = getMasterData(ss);
        break;

      case 'getRecords':
        response = getRecords(ss, data.formType, data.limit || 50);
        break;

      default:
        response = { success: false, message: "Chức năng không tồn tại: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleApiGet(e) {
  try {
    const action = e.parameter.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let response = { success: false };

    if (action === 'getMasterData') {
      response = getMasterData(ss);
    } else if (action === 'getRecords') {
      response = getRecords(ss, e.parameter.formType, parseInt(e.parameter.limit) || 50);
    } else if (action === 'ping') {
      response = { success: true, message: "QLBV Apps Script Online!" };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 3. LẤY DANH MỤC MASTER DATA
 */
function getMasterData(ss) {
  let sheet = ss.getSheetByName(SHEETS.MASTER_DATA);
  if (!sheet) {
    sheet = initMasterDataSheet(ss);
  }

  const data = sheet.getDataRange().getValues();
  const master = {
    tuyenList: [],
    donViBaoTri: [],
    chuRungList: [],
    kiemLamList: [],
    thietBiList: [],
    suCoList: [],
    chuDauTuList: [],
    tuVanGiamSatList: []
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const category = String(row[0] || '').trim();
    const code = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    const extra = String(row[3] || '').trim();

    if (!name) continue;
    const item = { code: code, name: name, extra: extra };

    if (category === 'Tuyen') master.tuyenList.push(item);
    else if (category === 'DonViBaoTri') master.donViBaoTri.push(item);
    else if (category === 'ChuRung') master.chuRungList.push(item);
    else if (category === 'KiemLam') master.kiemLamList.push(item);
    else if (category === 'ThietBi') master.thietBiList.push(item);
    else if (category === 'SuCo') master.suCoList.push(item);
    else if (category === 'ChuDauTu') master.chuDauTuList.push(item);
    else if (category === 'TuVanGiamSat') master.tuVanGiamSatList.push(item);
  }

  return { success: true, data: master };
}

/**
 * 4. XÁC THỰC ĐĂNG NHẬP & PHÂN QUYỀN
 */
function handleLogin(ss, username, passwordHash) {
  let sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) {
    sheet = initUsersSheet(ss);
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const u = String(row[1] || '').trim();
    const p = String(row[2] || '').trim();
    const status = String(row[7] || '').trim();

    if (u.toLowerCase() === username.toLowerCase()) {
      if (status.toLowerCase() === 'inactive' || status.toLowerCase() === 'khoá') {
        return { success: false, message: "Tài khoản này hiện đang bị khóa!" };
      }

      if (p === passwordHash) {
        sheet.getRange(i + 1, 9).setValue(new Date());
        return {
          success: true,
          message: "Đăng nhập thành công",
          user: {
            userId: row[0],
            username: row[1],
            fullName: row[3],
            role: row[4], // Admin, Supervisor, Worker
            organization: row[5],
            phone: row[6]
          }
        };
      } else {
        return { success: false, message: "Mật khẩu không chính xác!" };
      }
    }
  }

  return { success: false, message: "Tài khoản không tồn tại trên hệ thống!" };
}

/**
 * 5. ĐỔI MẬT KHẨU
 */
function handleChangePassword(ss, username, oldHash, newHash) {
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return { success: false, message: "Không tìm thấy sheet Users" };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const u = String(row[1] || '').trim();
    const p = String(row[2] || '').trim();

    if (u.toLowerCase() === username.toLowerCase()) {
      if (p === oldHash) {
        sheet.getRange(i + 1, 3).setValue(newHash);
        return { success: true, message: "Đổi mật khẩu thành công!" };
      } else {
        return { success: false, message: "Mật khẩu hiện tại không đúng!" };
      }
    }
  }
  return { success: false, message: "Không tìm thấy thông tin tài khoản!" };
}

/**
 * 5.1. QUÊN MẬT KHẨU (Gửi yêu cầu hoặc Reset về mặc định 123456)
 */
function handleForgotPassword(ss, usernameOrEmail) {
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return { success: false, message: "Không tìm thấy sheet Users" };

  const data = sheet.getDataRange().getValues();
  const defaultHash = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"; // 123456

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const u = String(row[1] || '').trim();
    const phone = String(row[6] || '').trim();

    if (u.toLowerCase() === usernameOrEmail.toLowerCase() || phone === usernameOrEmail) {
      // Đặt lại mật khẩu về mặc định 123456
      sheet.getRange(i + 1, 3).setValue(defaultHash);
      return {
        success: true,
        message: "Mật khẩu của tài khoản [" + u + "] đã được đặt lại về mặc định là: 123456. Vui lòng đăng nhập và đổi lại mật khẩu mới!"
      };
    }
  }

  return { success: false, message: "Không tìm thấy tài khoản hoặc số điện thoại này trong hệ thống!" };
}

/**
 * 5.2. ADMIN: LẤY DANH SÁCH TẤT CẢ NHÂN SỰ
 */
function handleGetUsers(ss, adminUsername) {
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return { success: false, message: "Không tìm thấy sheet Users" };

  const data = sheet.getDataRange().getValues();
  const users = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[1]) continue;
    users.push({
      userId: row[0],
      username: row[1],
      fullName: row[3],
      role: row[4], // Admin, Supervisor, Worker
      organization: row[5],
      phone: row[6],
      status: row[7] || 'Active',
      lastLogin: row[8] ? Utilities.formatDate(new Date(row[8]), "GMT+7", "dd/MM/yyyy HH:mm") : "Chưa đăng nhập"
    });
  }

  return { success: true, users: users };
}

/**
 * 5.3. ADMIN: THÊM NHÂN SỰ MỚI
 */
function handleAddUser(ss, adminUsername, userData) {
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return { success: false, message: "Không tìm thấy sheet Users" };

  const data = sheet.getDataRange().getValues();
  const username = String(userData.username || '').trim();

  // Kiểm tra trùng username
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1] || '').trim().toLowerCase() === username.toLowerCase()) {
      return { success: false, message: "Tên đăng nhập này đã tồn tại!" };
    }
  }

  const userId = "U" + ("000" + data.length).slice(-3);
  const defaultHash = userData.passwordHash || "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"; // 123456

  sheet.appendRow([
    userId,
    username,
    defaultHash,
    userData.fullName || '',
    userData.role || 'Worker',
    userData.organization || '',
    userData.phone || '',
    userData.status || 'Active',
    ''
  ]);

  return { success: true, message: "Đã thêm nhân sự [" + userData.fullName + "] thành công!" };
}

/**
 * 5.4. ADMIN: CẬP NHẬT THÔNG TIN / PHÂN QUYỀN NHÂN SỰ
 */
function handleUpdateUser(ss, adminUsername, userData) {
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return { success: false, message: "Không tìm thấy sheet Users" };

  const data = sheet.getDataRange().getValues();
  const username = String(userData.username || '').trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1] || '').trim().toLowerCase() === username.toLowerCase()) {
      if (userData.fullName) sheet.getRange(i + 1, 4).setValue(userData.fullName);
      if (userData.role) sheet.getRange(i + 1, 5).setValue(userData.role);
      if (userData.organization) sheet.getRange(i + 1, 6).setValue(userData.organization);
      if (userData.phone) sheet.getRange(i + 1, 7).setValue(userData.phone);
      if (userData.status) sheet.getRange(i + 1, 8).setValue(userData.status);

      return { success: true, message: "Đã cập nhật thông tin nhân sự thành công!" };
    }
  }

  return { success: false, message: "Không tìm thấy tài khoản để cập nhật!" };
}

/**
 * 5.5. ADMIN: RESET MẬT KHẨU CHO NHÂN SỰ
 */
function handleResetUserPassword(ss, adminUsername, targetUsername, newPasswordHash) {
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return { success: false, message: "Không tìm thấy sheet Users" };

  const data = sheet.getDataRange().getValues();
  const hashToSet = newPasswordHash || "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"; // 123456

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1] || '').trim().toLowerCase() === targetUsername.toLowerCase()) {
      sheet.getRange(i + 1, 3).setValue(hashToSet);
      return { success: true, message: "Đã đặt lại mật khẩu cho [" + targetUsername + "] về mặc định: 123456!" };
    }
  }

  return { success: false, message: "Không tìm thấy tài khoản!" };
}

/**
 * 5.6. ADMIN: XÓA HOẶC KHÓA TÀI KHOẢN
 */
function handleDeleteUser(ss, adminUsername, targetUsername) {
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return { success: false, message: "Không tìm thấy sheet Users" };

  if (targetUsername.toLowerCase() === 'admin') {
    return { success: false, message: "Không thể xóa tài khoản Quản trị cấp cao (Admin)!" };
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1] || '').trim().toLowerCase() === targetUsername.toLowerCase()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Đã xóa tài khoản [" + targetUsername + "] khỏi hệ thống!" };
    }
  }

  return { success: false, message: "Không tìm thấy tài khoản để xóa!" };
}

/**
 * WRAPPER CHO GOOGLE.SCRIPT.RUN TỪ GIAO DIỆN WEB
 */
function handleSaveRecordClient(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return handleSaveRecord(ss, payload);
}

function handleLoginClient(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return handleLogin(ss, username, password);
}

function getInitialDataClient() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    master: getMasterData(ss),
    users: getLocalUsersFromSheet(ss)
  };
}

function getLocalUsersFromSheet(ss) {
  const sheet = ss.getSheetByName(SHEETS.USERS) || initUsersSheet(ss);
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    list.push({
      userId: data[i][0],
      username: data[i][1],
      fullName: data[i][3],
      role: data[i][4],
      organization: data[i][5],
      phone: data[i][6],
      status: data[i][7]
    });
  }
  return list;
}

/**
 * 6. LƯU BẢN GHI VÀO GOOGLE SHEETS
 */
function handleSaveRecord(ss, payload) {
  const formType = payload.formType || (payload.record && payload.record.type) || 'baotri';
  const record = payload.record || {};
  const username = payload.username || record.createdBy || 'unknown';

  let targetSheetName = '';
  let rowData = [];
  const timestamp = new Date();
  const recordId = record.recordId || record.id || ("QLBV_" + Utilities.formatDate(timestamp, "GMT+7", "yyyyMMdd_HHmmss") + "_" + Math.floor(Math.random()*1000));

  // Upload ảnh lên Google Drive nếu có ảnh Base64
  let photoUrls = [];
  if (record.photos && record.photos.length > 0) {
    try {
      photoUrls = savePhotosToDrive(record.photos, recordId);
    } catch (err) {
      Logger.log("Lỗi lưu ảnh Drive: " + err.toString());
    }
  }

  // Chuẩn hóa dữ liệu tương thích
  const ngayLap = record.ngayLap || record.date || Utilities.formatDate(timestamp, "GMT+7", "yyyy-MM-dd");
  const gioLap = record.gioLap || record.time || Utilities.formatDate(timestamp, "GMT+7", "HH:mm");
  const diaDiem = record.diaDiem || record.loc || '';
  const tuyenHrd = record.tuyenHrd || record.tuyen || '';
  const daiDienBaoTri = record.daiDienBaoTri || (record.ddBt ? record.ddBt.split(';') : []);
  const daiDienChuRung = record.daiDienChuRung || (record.ddCr ? record.ddCr.split(';') : []);
  const daiDienKiemLam = record.daiDienKiemLam || (record.ddKl ? record.ddKl.split(';') : []);
  const suCo = record.suCo || '';
  const nguyenNhan = record.nguyenNhan || record.reason || '';
  const dsNhanCong = record.dsNhanCong || (record.workers ? [record.workers] : []);
  const tongChieuDai = record.tongChieuDai || record.len || '0';
  const tongDienTich = record.tongDienTich || record.area || '0';
  const noiDungCongViec = record.noiDungCongViec || record.work || '';
  const danhGiaGiamSat = record.danhGiaGiamSat || record.eval || '';
  const cacDoan = record.cacDoanVeSinh || [];

  if (formType === 'baotri') {
    targetSheetName = SHEETS.BB_BAOTRI;
    ensureSheetExists(ss, targetSheetName, [
      "record_id", "created_at", "created_by", "ngay_lap", "gio_lap", "dia_diem", "tuyen_hrd",
      "dai_dien_baotri", "dai_dien_churung", "dai_dien_kiemlam", "su_co", "nguyen_nhan",
      "thiet_bi_hong", "thiet_bi_thay_the", "ket_qua_khac_phuc", "tinh_trang", "photos_url", "signature", "notes"
    ]);
    rowData = [
      recordId, timestamp, username, ngayLap, gioLap, diaDiem, tuyenHrd,
      JSON.stringify(daiDienBaoTri), JSON.stringify(daiDienChuRung), JSON.stringify(daiDienKiemLam),
      suCo, nguyenNhan, JSON.stringify(record.thietBiHong || []), JSON.stringify(record.thietBiThayThe || []),
      record.ketQuaKhacPhuc || 'Đã khắc phục hoàn tất', record.tinhTrang || 'Hoạt động bình thường', JSON.stringify(photoUrls), record.signatureBase64 || '', record.notes || ''
    ];
  } else if (formType === 'vesinh') {
    targetSheetName = SHEETS.BB_VESINH;
    ensureSheetExists(ss, targetSheetName, [
      "record_id", "created_at", "created_by", "ngay_lap", "gio_lap", "dia_diem", "tuyen_hrd",
      "dai_dien_baotri", "dai_dien_churung", "ds_nhan_cong", "chi_tiet_doan_ve_sinh",
      "tong_chieu_dai_m", "tong_dien_tich_m2", "danh_gia_ket_qua", "photos_url", "signature", "notes"
    ]);
    rowData = [
      recordId, timestamp, username, ngayLap, gioLap, diaDiem, tuyenHrd,
      JSON.stringify(daiDienBaoTri), JSON.stringify(daiDienChuRung), JSON.stringify(dsNhanCong),
      JSON.stringify(cacDoan), tongChieuDai, tongDienTich, record.danhGia || 'Đã phát dọn sạch thực bì đạt yêu cầu',
      JSON.stringify(photoUrls), record.signatureBase64 || '', record.notes || ''
    ];
  } else if (formType === 'nhatky') {
    targetSheetName = SHEETS.NHATKY;
    ensureSheetExists(ss, targetSheetName, [
      "record_id", "created_at", "created_by", "ngay_ghi", "thoi_tiet", "hang_muc", "dia_diem",
      "chu_dau_tu", "tu_van_giam_sat", "nha_thau_thi_cong", "ds_thiet_bi", "ds_nhan_cong",
      "noi_dung_cong_viec", "danh_gia_giam_sat", "photos_url", "signature", "notes"
    ]);
    rowData = [
      recordId, timestamp, username, record.ngayGhi || ngayLap, record.thoiTiet || record.weather || 'Nắng ráo',
      record.hangMuc || 'Quản lý bảo vệ & vận hành HRD', diaDiem,
      record.chuDauTu || 'Chi cục Kiểm lâm Đồng Nai', record.tuVanGiamSat || 'Ban Quản lý Dự án Bảo tồn Voi',
      record.nhaThauThiCong || 'Đội Bảo trì HRD', JSON.stringify(record.dsThietBi || []),
      JSON.stringify(dsNhanCong), noiDungCongViec, danhGiaGiamSat, JSON.stringify(photoUrls),
      record.signatureBase64 || '', record.notes || ''
    ];
  }

  let sheet = ss.getSheetByName(targetSheetName);
  if (!sheet) {
    sheet = ss.insertSheet(targetSheetName);
  }
  sheet.appendRow(rowData);

  return { success: true, message: "Đã lưu bản ghi thành công!", recordId: recordId, photoUrls: photoUrls };
}

/**
 * 7. LƯU ẢNH LÊN GOOGLE DRIVE
 */
function savePhotosToDrive(photos, recordId) {
  let folder;
  const folders = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  const urls = [];
  photos.forEach((base64Str, idx) => {
    try {
      const cleanBase64 = base64Str.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
      const decoded = Utilities.base64Decode(cleanBase64);
      const blob = Utilities.newBlob(decoded, "image/jpeg", recordId + "_p" + (idx + 1) + ".jpg");
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      urls.push(file.getUrl());
    } catch (e) {
      urls.push("");
    }
  });
  return urls;
}

/**
 * 8. LẤY DANH SÁCH BẢN GHI
 */
function getRecords(ss, formType, limit) {
  let targetSheetName = '';
  if (formType === 'baotri') targetSheetName = SHEETS.BB_BAOTRI;
  else if (formType === 'vesinh') targetSheetName = SHEETS.BB_VESINH;
  else if (formType === 'nhatky') targetSheetName = SHEETS.NHATKY;

  const sheet = ss.getSheetByName(targetSheetName);
  if (!sheet) return { success: true, records: [] };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, records: [] };

  const headers = data[0];
  const records = [];
  const startIdx = Math.max(1, data.length - limit);

  for (let i = data.length - 1; i >= startIdx; i--) {
    const row = data[i];
    let rec = { formType: formType };
    for (let c = 0; c < headers.length; c++) {
      rec[headers[c]] = row[c];
    }
    records.push(rec);
  }

  return { success: true, records: records };
}

function ensureSheetExists(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function initUsersSheet(ss) {
  const sheet = ss.insertSheet(SHEETS.USERS);
  sheet.appendRow(["user_id", "username", "password_hash", "full_name", "role", "organization", "phone", "status", "last_login"]);
  sheet.appendRow(["U001", "admin", "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "Nguyễn Viết Sử (admin)", "Admin", "Chi cục Kiểm lâm Đồng Nai", "0900000001", "Active", ""]);
  sheet.appendRow(["U002", "giamsat", "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "Cán bộ Giám sát Kiểm lâm", "Supervisor", "Hạt Kiểm lâm Khu vực", "0900000002", "Active", ""]);
  sheet.appendRow(["U003", "baotri01", "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "Tổ trưởng Đội Bảo trì 1", "Worker", "Đơn vị Bảo trì HRD", "0900000003", "Active", ""]);
  return sheet;
}

function initMasterDataSheet(ss) {
  const sheet = ss.insertSheet(SHEETS.MASTER_DATA);
  sheet.appendRow(["category", "code", "name", "extra_info"]);
  const items = [
    ["Tuyen", "T01", "Tuyến Hàng rào điện Định Quán (Đoạn 1)", "Trụ 01 - Trụ 150"],
    ["Tuyen", "T02", "Tuyến Hàng rào điện Vĩnh Cửu (Đoạn 2)", "Trụ 151 - Trụ 320"],
    ["Tuyen", "T03", "Tuyến Hàng rào điện Tân Phú (Đoạn 3)", "Trụ 321 - Trụ 480"],
    ["Tuyen", "T04", "Tuyến Hàng rào điện Bù Gia Mập giáp ranh", "Trụ 481 - Trụ 600"],
    ["DonViBaoTri", "DV01", "Công ty TNHH Kỹ thuật Xây dựng & Môi trường Đồng Nai", "Đơn vị bảo trì"],
    ["ChuRung", "CR01", "Ban Quản lý Rừng phòng hộ Tân Phú", "Huyện Tân Phú"],
    ["ChuRung", "CR02", "Khu Bảo tồn Thiên nhiên - Văn hóa Đồng Nai", "Huyện Vĩnh Cửu"],
    ["KiemLam", "KL01", "Hạt Kiểm lâm Huyện Định Quán", "Chi cục Kiểm lâm"],
    ["KiemLam", "KL02", "Hạt Kiểm lâm Huyện Vĩnh Cửu", "Chi cục Kiểm lâm"],
    ["SuCo", "SC01", "Đứt dây dẫn xung điện do cây đổ đè", ""],
    ["SuCo", "SC02", "Sét đánh hỏng bộ tạo xung (Energizer)", ""],
    ["SuCo", "SC03", "Bình ắc quy / Pin mặt trời hỏng, yếu điện", ""],
    ["SuCo", "SC04", "Sứ cách điện bị vỡ làm rò điện", ""],
    ["ThietBi", "TB01", "Bộ phát xung điện (Energizer) 12V/220V", "Cái"],
    ["ThietBi", "TB02", "Bình ắc quy lưu điện 12V - 100Ah", "Bình"],
    ["ThietBi", "TB03", "Tấm pin năng lượng mặt trời 100W", "Tấm"],
    ["ThietBi", "TB04", "Sứ cách điện néo / Sứ đỡ dây", "Cái"],
    ["ThietBi", "TB05", "Dây cáp thép bọc kẽm 2.5mm", "Mét"]
  ];
  items.forEach(r => sheet.appendRow(r));
  return sheet;
}
