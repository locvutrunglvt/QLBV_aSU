/**
 * MODULE XÁC THỰC, PHÂN QUYỀN & BẢO MẬT (AUTH & RBAC)
 */
const Auth = {
  currentUser: null,

  /**
   * Tính mã băm SHA-256 từ chuỗi mật khẩu
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Khởi tạo phiên làm việc từ LocalStorage
   */
  init() {
    try {
      const sessionData = localStorage.getItem('qlbv_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const now = Date.now();
        if (now - session.loginTime < QLBV_CONFIG.SESSION_TIMEOUT_MS) {
          this.currentUser = session.user;
          return this.currentUser;
        } else {
          this.logout();
        }
      }
    } catch (e) {
      this.logout();
    }
    return null;
  },

  /**
   * Đăng nhập (Online via Google Apps Script hoặc Offline Demo)
   */
  async login(username, password) {
    const passHash = await this.hashPassword(password);

    // 1. Thử gửi API nếu đã cấu hình Backend Google Apps Script
    if (QLBV_CONFIG.APPS_SCRIPT_URL) {
      try {
        const response = await fetch(QLBV_CONFIG.APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'login',
            username: username,
            passwordHash: passHash
          })
        });
        const result = await response.json();
        if (result.success && result.user) {
          this.setSession(result.user);
          return { success: true, user: result.user };
        } else {
          return { success: false, message: result.message || "Đăng nhập thất bại" };
        }
      } catch (err) {
        console.warn("Lỗi kết nối Backend, chuyển sang kiểm tra Local:", err);
      }
    }

    // 2. Chế độ Dự phòng / Offline Cache / Demo Credentials
    const defaultAccounts = [
      {
        userId: "U001",
        username: "admin",
        passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", // 123456
        fullName: "Nguyễn Viết Sử (admin)",
        role: "Admin",
        organization: "Ban Quản lý / Chi cục Kiểm lâm",
        phone: "0900000001"
      },
      {
        userId: "U002",
        username: "giamsat",
        passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", // 123456
        fullName: "Cán bộ Giám sát Kiểm lâm",
        role: "Supervisor",
        organization: "Hạt Kiểm lâm Khu vực",
        phone: "0900000002"
      },
      {
        userId: "U003",
        username: "baotri01",
        passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", // 123456
        fullName: "Tổ trưởng Đội Bảo trì 1",
        role: "Worker",
        organization: "Đơn vị Bảo trì HRD",
        phone: "0900000003"
      }
    ];

    const localUsers = JSON.parse(localStorage.getItem('qlbv_local_users') || "null") || defaultAccounts;
    const found = localUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (found) {
      if (found.passwordHash === passHash) {
        this.setSession(found);
        return { success: true, user: found, isOffline: true };
      } else {
        return { success: false, message: "Mật khẩu không chính xác!" };
      }
    }

    return { success: false, message: "Tài khoản không tồn tại trên hệ thống!" };
  },

  /**
   * Đổi mật khẩu
   */
  async changePassword(oldPassword, newPassword) {
    if (!this.currentUser) return { success: false, message: "Bạn chưa đăng nhập!" };

    const oldHash = await this.hashPassword(oldPassword);
    const newHash = await this.hashPassword(newPassword);

    // Gửi lên Backend nếu có
    if (QLBV_CONFIG.APPS_SCRIPT_URL) {
      try {
        const response = await fetch(QLBV_CONFIG.APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'changePassword',
            username: this.currentUser.username,
            oldPasswordHash: oldHash,
            newPasswordHash: newHash
          })
        });
        const result = await response.json();
        return result;
      } catch (e) {
        console.warn("Lỗi gửi đổi mật khẩu lên server:", e);
      }
    }

    // Đổi trên LocalStorage
    const defaultAccounts = [
      { userId: "U001", username: "admin", passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", fullName: "Nguyễn Viết Sử (admin)", role: "Admin", organization: "Ban Quản lý", phone: "0900000001" },
      { userId: "U002", username: "giamsat", passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", fullName: "Cán bộ Giám sát", role: "Supervisor", organization: "Kiểm lâm", phone: "0900000002" },
      { userId: "U003", username: "baotri01", passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", fullName: "Tổ trưởng Bảo trì 1", role: "Worker", organization: "Đơn vị Bảo trì", phone: "0900000003" }
    ];
    let localUsers = JSON.parse(localStorage.getItem('qlbv_local_users') || "null") || defaultAccounts;
    const userIndex = localUsers.findIndex(u => u.username.toLowerCase() === this.currentUser.username.toLowerCase());
    
    if (userIndex !== -1) {
      if (localUsers[userIndex].passwordHash === oldHash) {
        localUsers[userIndex].passwordHash = newHash;
        localStorage.setItem('qlbv_local_users', JSON.stringify(localUsers));
        return { success: true, message: "Đổi mật khẩu thành công!" };
      } else {
        return { success: false, message: "Mật khẩu hiện tại không đúng!" };
      }
    }
    return { success: false, message: "Không tìm thấy thông tin tài khoản!" };
  },

  setSession(user) {
    this.currentUser = user;
    const session = {
      user: user,
      loginTime: Date.now()
    };
    localStorage.setItem('qlbv_session', JSON.stringify(session));
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('qlbv_session');
    window.location.reload();
  },

  // Helpers kiểm tra quyền
  isAdmin() {
    return this.currentUser && this.currentUser.role === 'Admin';
  },
  isSupervisor() {
    return this.currentUser && (this.currentUser.role === 'Admin' || this.currentUser.role === 'Supervisor');
  },
  isWorker() {
    return this.currentUser && this.currentUser.role === 'Worker';
  }
};
