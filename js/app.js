/**
 * HỆ THỐNG QUẢN LÝ BẢO TRÌ TUYẾN HÀNG RÀO ĐIỆN (QLBV)
 * Main Application Controller
 */

// ================= KHÓA HOÀN TOÀN TÍNH NĂNG ZOOM TRÊN MỌI MÀN HÌNH =================
(function lockAppZoom() {
  // 1. Chặn cử chỉ thu phóng 2 ngón tay (Pinch to zoom)
  document.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  // 2. Chặn nhấp đúp phóng to (Double tap to zoom)
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function (e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
      }
    }
    lastTouchEnd = now;
  }, { passive: false });

  // 3. Chặn các cử chỉ gesture trên iOS Safari
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (evt) {
    document.addEventListener(evt, function (e) {
      e.preventDefault();
    }, { passive: false });
  });

  // 4. Chặn Ctrl + Mousewheel / Trackpad zoom trên PC
  document.addEventListener('wheel', function (e) {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, { passive: false });

  // 5. Chặn phím tắt zoom bàn phím
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
      e.preventDefault();
    }
  });
})();

const App = {
  activeTab: 'dashboard',
  currentPhotos: {
    baotri: [],
    vesinh: [],
    nhatky: []
  },

  /**
   * Trả về markup icon vector SVG lấy từ sprite <symbol> khai báo trong index.html.
   * Dùng thay cho emoji ở mọi chuỗi HTML sinh động.
   */
  icon(name, cls = 'ico') {
    return `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  },

  init() {
    // 1. Khởi tạo dịch vụ - KHÔNG chờ mạng để app mở được ngay lập tức
    CameraService.initGeolocation();
    MasterData.load();
    const user = Auth.init();

    // 2. Khởi tạo UI State
    this.updateUserUI(user);
    this.setupTheme();
    this.setupNetworkMonitor();
    this.setupEventListeners();
    this.populateMasterDropdowns();

    // 3. Hiển thị Tab mặc định & Dashboard
    ValidationStore.refreshDatalists();
    if (Auth.isLoggedIn()) {
      this.switchTab('dashboard');
      this.refreshDashboardMetrics();
    }

    // Thêm mặc định 1 dòng phân đoạn và thiết bị
    if (!document.getElementById('bt-thietbi-hong-tbody')?.children.length) this.addBaoTriRow('bt-thietbi-hong-tbody', 'hong');
    if (!document.getElementById('bt-thietbi-thaythe-tbody')?.children.length) this.addBaoTriRow('bt-thietbi-thaythe-tbody', 'thaythe');
    if (!document.getElementById('vs-doan-tbody')?.children.length) this.addVeSinhDoanRow();

    // 4. Chốt chặn: chưa đăng nhập thì chỉ có màn hình đăng nhập
    if (!Auth.isLoggedIn()) {
      this.lockToLoginScreen();
    }

    // 5. Tự động đăng xuất khi hết hạn phiên (kiểm tra mỗi phút)
    setInterval(() => this.enforceSession(), 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.enforceSession();
    });

    // Chặn cử chỉ zoom ngoài ý muốn trên Safari / iOS
    document.addEventListener('gesturestart', (e) => e.preventDefault());

    // 6. Làm mới danh mục dùng chung từ Google Sheets ở nền (không chặn giao diện)
    MasterData.refreshFromServer().then(updated => {
      if (updated) {
        this.populateMasterDropdowns();
        ValidationStore.refreshDatalists();
      }
    });
  },

  /**
   * Ẩn toàn bộ nội dung ứng dụng và bật màn hình đăng nhập (không thể đóng).
   */
  lockToLoginScreen() {
    document.body.classList.add('is-logged-out');
    document.querySelectorAll('.modal-overlay').forEach(m => {
      if (m.id !== 'login-modal') m.classList.remove('active');
    });
    this.showModal('login-modal');
    document.getElementById('login-username')?.focus();
  },

  /**
   * Phiên hết hạn giữa chừng -> đá về màn hình đăng nhập.
   */
  enforceSession() {
    if (!Auth.isLoggedIn()) return;
    if (!Auth.init()) {
      this.showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'warning');
      this.updateUserUI(null);
      this.lockToLoginScreen();
    }
  },

  /**
   * TRUNG TÂM QUẢN LÝ THAM SỐ & VALIDATION DÙNG CHUNG (Validation Store Modal)
   */
  openValModal() {
    const select = document.getElementById('val-cat-select');
    if (select) {
      const cats = ValidationStore.getAllCategories();
      const currentVal = select.value || 'tuyen';
      select.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      select.value = currentVal;
    }
    this.renderValTagList();
    this.showModal('val-modal');
  },

  renderValTagList() {
    const cat = document.getElementById('val-cat-select')?.value || 'tuyen';
    const container = document.getElementById('val-tags-container');
    const infoCard = document.getElementById('val-info-desc');
    if (!container) return;

    const cats = ValidationStore.getAllCategories();
    const currentCatObj = cats.find(c => c.id === cat);
    if (infoCard && currentCatObj) {
      infoCard.innerHTML = `${this.icon('link')} <b>Hạng mục dùng chung:</b> ${currentCatObj.desc}`;
    }

    const items = ValidationStore.get(cat);
    const pins = ValidationStore.getPinned(cat);

    if (items.length === 0) {
      container.innerHTML = '<span style="color:var(--text-muted); font-size:0.82rem;">Chưa có mục nào trong danh mục này. Hãy gõ thêm bên dưới hoặc điền form để hệ thống tự động học!</span>';
      return;
    }

    // Sắp xếp các mục: Pinned lên đầu
    const sortedItems = [
      ...pins.filter(p => items.includes(p)),
      ...items.filter(i => !pins.includes(i))
    ];

    container.innerHTML = sortedItems.map(item => {
      const isPinned = pins.includes(item);
      return `
        <span class="val-tag-item ${isPinned ? 'is-pinned' : ''}">
          <span class="val-tag-pin" onclick="App.togglePinValTag('${item.replace(/'/g, "\\'")}')" title="${isPinned ? 'Bỏ ghim' : 'Ghim lên đầu gợi ý'}">
            ${this.icon('pin')}
          </span>
          <span>${item}</span>
          <span class="val-tag-del" onclick="App.deleteValTag('${item.replace(/'/g, "\\'")}')" title="Xóa mục này"><svg class="ico" aria-hidden="true"><use href="#i-x"></use></svg></span>
        </span>
      `;
    }).join('');
  },

  addValItemFromModal() {
    const cat = document.getElementById('val-cat-select')?.value || 'tuyen';
    const inp = document.getElementById('val-new-input');
    const val = inp?.value.trim();
    if (!val) return;
    ValidationStore.learn(cat, val);
    if (inp) inp.value = '';
    this.renderValTagList();
    this.showToast(`Đã thêm [${val}] vào danh mục gợi ý!`, 'success');
  },

  togglePinValTag(val) {
    const cat = document.getElementById('val-cat-select')?.value || 'tuyen';
    ValidationStore.togglePin(cat, val);
    this.renderValTagList();
    const isPinned = ValidationStore.isPinned(cat, val);
    this.showToast(isPinned ? `Đã ghim [${val}] lên đầu danh sách gợi ý!` : `Đã bỏ ghim [${val}]`, 'info');
  },

  deleteValTag(val) {
    const cat = document.getElementById('val-cat-select')?.value || 'tuyen';
    ValidationStore.remove(cat, val);
    this.renderValTagList();
    this.showToast(`Đã xóa [${val}]`, 'info');
  },

  clearCurrentCategoryVal() {
    const cat = document.getElementById('val-cat-select')?.value || 'tuyen';
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ mục gợi ý của nhóm này?')) return;
    ValidationStore.clear(cat);
    this.renderValTagList();
    this.showToast('Đã xóa sạch danh mục nhóm này!', 'info');
  },

  resetValidationDefaults() {
    if (!confirm('Khôi phục toàn bộ tham số & danh mục về thiết lập chuẩn ban đầu?')) return;
    ValidationStore.resetAllToDefaults();
    this.renderValTagList();
    this.showToast('Đã khôi phục toàn bộ danh mục tham số chuẩn!', 'success');
  },

  exportValidationConfig() {
    const jsonStr = ValidationStore.exportConfigJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ts = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `QLBV_ThamSo_Validation_${ts}.json`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    this.showToast('Đã xuất file cấu hình tham số JSON!', 'success');
  },

  importValidationConfig(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const res = ValidationStore.importConfigJson(e.target.result);
      this.renderValTagList();
      this.showToast(res.message, res.success ? 'success' : 'error');
      event.target.value = '';
    };
    reader.readAsText(file);
  },

  /**
   * Thu thập đại diện 3 Đơn vị (3 người mỗi đơn vị)
   */
  collectRepresentatives(prefix) {
    const getUnitReps = (unitKey) => {
      const reps = [];
      for (let i = 1; i <= 3; i++) {
        const name = document.getElementById(`${prefix}-dd-${unitKey}-name-${i}`)?.value.trim() || '';
        const pos = document.getElementById(`${prefix}-dd-${unitKey}-pos-${i}`)?.value.trim() || '';
        if (name) {
          reps.push({ name: name, position: pos });
          ValidationStore.learn('hoten', name);
          if (pos) ValidationStore.learn('chucvu', pos);
        }
      }
      return reps;
    };

    return {
      bt: getUnitReps('bt'),
      cr: getUnitReps('cr'),
      kl: getUnitReps('kl')
    };
  },

  /**
   * Cập nhật UI thông tin tài khoản & quyền
   */
  updateUserUI(user) {
    const userBadge = document.getElementById('user-badge-info');
    const mainContainer = document.querySelector('main.app-container');
    const bottomNav = document.querySelector('nav.mobile-bottom-nav');
    const topNavbar = document.querySelector('header.top-navbar');

    if (user) {
      document.body.classList.remove('is-logged-out');
      if (userBadge) {
        const roleKey = (user.role || 'Worker').toLowerCase();
        const roleIcon = { admin: 'crown', supervisor: 'eye', worker: 'wrench' }[roleKey] || 'user';
        userBadge.innerHTML = `
          <span class="user-badge-avatar">${this.icon(roleIcon)}</span>
          <span class="user-badge-name">${user.fullName || user.username}</span>
          <span class="role-tag role-${roleKey}">${user.role || 'Worker'}</span>
        `;
      }
      if (mainContainer) mainContainer.style.display = 'block';
      if (bottomNav) bottomNav.style.display = 'flex';
      if (topNavbar) topNavbar.style.display = 'flex';
      this.hideModal('login-modal');
    } else {
      document.body.classList.add('is-logged-out');
      if (userBadge) {
        userBadge.innerHTML = `
          <span class="user-badge-avatar">${this.icon('user')}</span>
          <span class="user-badge-name">Chưa đăng nhập</span>
        `;
      }
      if (mainContainer) mainContainer.style.display = 'none';
      if (bottomNav) bottomNav.style.display = 'none';
      if (topNavbar) topNavbar.style.display = 'none';
      this.showModal('login-modal');
    }

    // Hiển thị tab Quản lý nhân sự nếu là Admin
    document.querySelectorAll('[data-admin-only]').forEach(el => {
      el.style.display = (user && user.role === 'Admin') ? '' : 'none';
    });
    const navUsers = document.getElementById('app-nav-users');
    if (navUsers) {
      navUsers.style.display = (user && user.role === 'Admin') ? 'flex' : 'none';
    }
    const dashUsers = document.getElementById('dash-tile-users');
    if (dashUsers) {
      dashUsers.style.display = (user && user.role === 'Admin') ? 'flex' : 'none';
    }
  },

  /**
   * Chuyển đổi giữa các Tab
   */
  switchTab(tabId) {
    // Chốt chặn phân quyền: chưa đăng nhập thì không mở được bất kỳ màn hình nào
    if (!Auth.isLoggedIn()) {
      this.lockToLoginScreen();
      return;
    }
    if (tabId === 'users' && !Auth.isAdmin()) {
      this.showToast('Chỉ Quản trị viên mới truy cập được mục Quản lý nhân sự.', 'warning');
      return;
    }

    this.activeTab = tabId;

    // Cập nhật class active cho nút tab (thanh trên + thanh dưới của điện thoại)
    document.querySelectorAll('.nav-tab-btn, .bottom-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Cập nhật hiển thị view
    document.querySelectorAll('.tab-view').forEach(view => {
      view.style.display = (view.id === `view-${tabId}`) ? 'block' : 'none';
    });

    // Tác vụ phụ thuộc vào tab
    if (tabId === 'dashboard') {
      this.refreshDashboardMetrics();
    } else if (tabId === 'history') {
      this.loadHistoryList();
    } else if (tabId === 'users') {
      this.loadUsersTable();
    } else if (tabId === 'form-baotri' || tabId === 'form-vesinh' || tabId === 'form-nhatky') {
      this.autoFillDefaults(tabId);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Tự động điền ngày giờ hiện tại cho các Form & khởi tạo dòng bảng biểu mặc định
   */
  autoFillDefaults(tabId) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5);

    if (tabId === 'form-baotri') {
      const dateEl = document.getElementById('bt-ngay-lap');
      const timeEl = document.getElementById('bt-gio-lap');
      if (dateEl && !dateEl.value) dateEl.value = dateStr;
      if (timeEl && !timeEl.value) timeEl.value = timeStr;

      // Khởi tạo dòng đầu tiên nếu bảng đang trống để người dùng nhập được ngay
      const hongTbody = document.getElementById('bt-thietbi-hong-tbody');
      if (hongTbody && hongTbody.children.length === 0) {
        this.addBaoTriRow('bt-thietbi-hong-tbody', 'hong');
      }
      const thayTheTbody = document.getElementById('bt-thietbi-thaythe-tbody');
      if (thayTheTbody && thayTheTbody.children.length === 0) {
        this.addBaoTriRow('bt-thietbi-thaythe-tbody', 'thaythe');
      }
    } else if (tabId === 'form-vesinh') {
      const dateEl = document.getElementById('vs-ngay-lap');
      const timeEl = document.getElementById('vs-gio-lap');
      if (dateEl && !dateEl.value) dateEl.value = dateStr;
      if (timeEl && !timeEl.value) timeEl.value = timeStr;

      const doanTbody = document.getElementById('vs-doan-tbody');
      if (doanTbody && doanTbody.children.length === 0) {
        this.addVeSinhDoanRow();
      }
    } else if (tabId === 'form-nhatky') {
      const dateEl = document.getElementById('nk-ngay-ghi');
      if (dateEl && !dateEl.value) dateEl.value = dateStr;
    }
  },

  /**
   * Điền dữ liệu Master Data vào các dropdown
   */
  populateMasterDropdowns() {
    // Form Bảo Trì
    MasterData.populateSelect('bt-tuyen-select', MasterData.data.tuyenList, '-- Chọn Tuyến hàng rào --');
    MasterData.populateSelect('bt-su-co-select', MasterData.data.suCoList, '-- Chọn sự cố thường gặp --');
    
    // Form Vệ Sinh
    MasterData.populateSelect('vs-tuyen-select', MasterData.data.tuyenList, '-- Chọn Tuyến hàng rào --');

    // Form Nhật Ký
    MasterData.populateSelect('nk-tuyen-select', MasterData.data.tuyenList, '-- Chọn Tuyến/Địa điểm --');
  },

  /**
   * Lắng nghe các sự kiện
   */
  setupEventListeners() {
    // 1. Tab switching
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    // 2. User badge click -> Settings / Login modal
    document.getElementById('user-badge-info').addEventListener('click', () => {
      if (Auth.currentUser) {
        this.showModal('user-settings-modal');
      } else {
        this.showModal('login-modal');
      }
    });

    // 3. Form Đăng nhập
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('login-username').value.trim();
        const p = document.getElementById('login-password').value;
        const remember = !!document.getElementById('login-remember')?.checked;
        const btn = loginForm.querySelector('button[type="submit"]');
        const label = btn.querySelector('.btn-label') || btn;

        if (!u || !p) {
          this.showToast('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!', 'error');
          return;
        }

        btn.disabled = true;
        label.textContent = 'Đang đăng nhập...';

        const res = await Auth.login(u, p, remember);
        btn.disabled = false;
        label.textContent = 'Đăng Nhập';

        if (res.success && Auth.isLoggedIn()) {
          document.getElementById('login-password').value = '';
          this.showToast(`Xin chào ${res.user.fullName || res.user.username}!`, 'success');
          this.updateUserUI(res.user);
          this.hideModal('login-modal');
          this.switchTab('dashboard');
          this.refreshDashboardMetrics();
        } else {
          this.showToast(res.message || 'Đăng nhập thất bại', 'error');
        }
      });
    }

    // 4. Form Quên Mật Khẩu
    const forgotForm = document.getElementById('app-forgot-form');
    if (forgotForm) {
      forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = document.getElementById('app-forgot-input').value.trim();
        let users = this.getLocalUsersList();
        let found = users.find(u => u.username.toLowerCase() === val.toLowerCase() || u.phone === val);

        if (found) {
          found.passwordHash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // 123456
          this.saveLocalUsersList(users);
          this.showToast('Đã đặt lại mật khẩu về mặc định: 123456. Vui lòng đăng nhập!', 'success');
          this.hideModal('forgot-modal');
          document.getElementById('login-username').value = found.username;
          document.getElementById('login-password').value = '123456';
          this.showModal('login-modal');
        } else {
          this.showToast('Không tìm thấy tài khoản hoặc số điện thoại này!', 'error');
        }
      });
    }

    // 4.1. Form Thêm / Sửa Nhân sự (Admin)
    const userForm = document.getElementById('app-user-form');
    if (userForm) {
      userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const mode = document.getElementById('app-usr-mode').value;
        const username = document.getElementById('app-usr-username').value.trim();
        const fullName = document.getElementById('app-usr-fullname').value.trim();
        const phone = document.getElementById('app-usr-phone').value.trim();
        const role = document.getElementById('app-usr-role').value;
        const status = document.getElementById('app-usr-status').value;
        const org = document.getElementById('app-usr-org').value.trim();

        let users = this.getLocalUsersList();

        if (mode === 'add') {
          if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            this.showToast('Tên đăng nhập này đã tồn tại!', 'error');
            return;
          }
          users.push({
            userId: 'U' + (users.length + 1),
            username: username,
            passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
            fullName: fullName,
            role: role,
            organization: org,
            phone: phone,
            status: status
          });
          this.showToast('Đã thêm nhân sự thành công! (Mật khẩu mặc định: 123456)', 'success');
        } else {
          const u = users.find(u => u.username.toLowerCase() === username.toLowerCase());
          if (u) {
            u.fullName = fullName;
            u.phone = phone;
            u.role = role;
            u.status = status;
            u.organization = org;
            this.showToast('Đã cập nhật thông tin nhân sự!', 'success');
          }
        }

        this.saveLocalUsersList(users);
        this.hideModal('app-user-modal');
        this.loadUsersTable();
      });
    }

    // 5. Form Đổi Mật Khẩu
    const changePassForm = document.getElementById('change-password-form');
    if (changePassForm) {
      changePassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const oldP = document.getElementById('old-password').value;
        const newP = document.getElementById('new-password').value;
        const confirmP = document.getElementById('confirm-password').value;

        if (newP !== confirmP) {
          this.showToast('Mật khẩu mới không khớp!', 'error');
          return;
        }

        const res = await Auth.changePassword(oldP, newP);
        if (res.success) {
          this.showToast('Đổi mật khẩu thành công!', 'success');
          this.hideModal('user-settings-modal');
          changePassForm.reset();
        } else {
          this.showToast(res.message || 'Lỗi đổi mật khẩu', 'error');
        }
      });
    }

    // 5. Cấu hình Apps Script URL
    const configForm = document.getElementById('gas-config-form');
    if (configForm) {
      const urlInput = document.getElementById('gas-url-input');
      if (urlInput) urlInput.value = QLBV_CONFIG.APPS_SCRIPT_URL;

      configForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newUrl = urlInput.value;
        setAppsScriptUrl(newUrl);
        this.showToast('Đã lưu cấu hình kết nối Google Apps Script!', 'success');
      });
    }

    // 6. Xử lý ảnh cho 3 Form
    this.setupPhotoHandlers('bt-photo-input', 'bt-photo-gallery', 'baotri');
    this.setupPhotoHandlers('vs-photo-input', 'vs-photo-gallery', 'vesinh');
    this.setupPhotoHandlers('nk-photo-input', 'nk-photo-gallery', 'nhatky');

    // 7. Xử lý Form Bảo Trì: Thêm dòng thiết bị
    document.getElementById('btn-add-bt-thietbi-hong')?.addEventListener('click', () => {
      this.addBaoTriRow('bt-thietbi-hong-tbody', 'hong');
    });
    document.getElementById('btn-add-bt-thietbi-thaythe')?.addEventListener('click', () => {
      this.addBaoTriRow('bt-thietbi-thaythe-tbody', 'thaythe');
    });

    // 8. Xử lý Form Vệ Sinh: Thêm phân đoạn trụ & Tự tính diện tích
    document.getElementById('btn-add-vs-doan')?.addEventListener('click', () => {
      this.addVeSinhDoanRow();
    });

    // 9. Nút Lưu & Xuất PDF cho từng Form
    this.setupFormSubmitHandlers();

    // 10. Nút Đồng bộ Dữ liệu Offline
    document.getElementById('btn-sync-offline')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-sync-offline');
      btn.disabled = true;
      btn.innerHTML = `${this.icon('refresh')} Đang đồng bộ...`;
      const res = await StorageService.syncAllPending();
      btn.disabled = false;
      btn.innerHTML = `${this.icon('refresh')} Đồng bộ ngay`;
      this.showToast(res.message, res.success ? 'success' : 'warning');
      this.refreshDashboardMetrics();
    });

    // 11. Modal Close Buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal && modal.id !== 'login-modal') this.hideModal(modal.id);
      });
    });

    // 12. Bấm ra nền tối / phím Esc để đóng modal (trừ màn hình đăng nhập)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      if (overlay.id === 'login-modal') return;
      overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay) this.hideModal(overlay.id);
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = [...document.querySelectorAll('.modal-overlay.active')].filter(m => m.id !== 'login-modal');
      if (open.length) this.hideModal(open[open.length - 1].id);
    });

    // 13. Thanh điều hướng dưới đáy (điện thoại)
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // 14. Nút hiện/ẩn mật khẩu ở màn hình đăng nhập
    const pwToggle = document.getElementById('login-pw-toggle');
    if (pwToggle) {
      pwToggle.addEventListener('click', () => {
        const input = document.getElementById('login-password');
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        pwToggle.innerHTML = this.icon(showing ? 'eye' : 'lock');
        pwToggle.setAttribute('aria-label', showing ? 'Hiện mật khẩu' : 'Ẩn mật khẩu');
      });
    }
  },

  /**
   * Xử lý Camera & Upload ảnh kèm Watermark
   */
  setupPhotoHandlers(inputId, galleryId, formType) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      this.showToast(`Đang xử lý & đóng dấu watermark ${files.length} ảnh...`, 'info');
      for (const file of files) {
        try {
          const processedBase64 = await CameraService.processImage(file);
          this.currentPhotos[formType].push(processedBase64);
        } catch (err) {
          console.error("Lỗi nén ảnh:", err);
        }
      }

      CameraService.renderPhotoGallery(galleryId, this.currentPhotos[formType], (removeIdx) => {
        this.currentPhotos[formType].splice(removeIdx, 1);
        CameraService.renderPhotoGallery(galleryId, this.currentPhotos[formType], null);
      });
      this.showToast('Đã thêm ảnh thành công!', 'success');
      input.value = '';
    });
  },

  /**
   * Thêm dòng thiết bị cho Form Bảo Trì (Hỗ trợ giao diện máy tính & card độc lập trên điện thoại)
   */
  addBaoTriRow(tbodyId, type) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const row = document.createElement('tr');
    row.className = 'dynamic-row-item';
    const idx = tbody.children.length + 1;

    if (type === 'hong') {
      row.innerHTML = `
        <td class="col-stt" style="text-align: center;">${idx}</td>
        <td class="col-main">
          <label class="field-label-mobile">Tên thiết bị / Quy cách hư hỏng</label>
          <input type="text" class="form-control tb-name" list="dl-thietbi" placeholder="Nhập hoặc chọn tên thiết bị..." autocomplete="off" />
        </td>
        <td class="col-qty">
          <label class="field-label-mobile">Số lượng &amp; ĐVT</label>
          <div class="qty-unit-group">
            <input type="number" class="form-control tb-qty" value="1" min="1" placeholder="SL" />
            <input type="text" class="form-control tb-unit" list="dl-dvt" value="Cái" placeholder="ĐVT" />
          </div>
        </td>
        <td class="col-status">
          <label class="field-label-mobile">Tình trạng hư hỏng</label>
          <input type="text" class="form-control tb-status" list="dl-su-co" placeholder="Tình trạng hư hỏng..." autocomplete="off" />
        </td>
        <td class="col-action" style="text-align: center;">
          <button type="button" class="btn-row-del" title="Xóa dòng" onclick="this.closest('tr').remove(); App.reindexRows('${tbodyId}');">
            <svg class="ico" aria-hidden="true"><use href="#i-x"></use></svg>
          </button>
        </td>
      `;
    } else {
      row.innerHTML = `
        <td class="col-stt" style="text-align: center;">${idx}</td>
        <td class="col-main">
          <label class="field-label-mobile">Tên vật tư / Thiết bị thay thế</label>
          <input type="text" class="form-control tb-name" list="dl-thietbi" placeholder="Nhập hoặc chọn vật tư thay thế..." autocomplete="off" />
        </td>
        <td class="col-qty">
          <label class="field-label-mobile">Số lượng &amp; ĐVT</label>
          <div class="qty-unit-group">
            <input type="number" class="form-control tb-qty" value="1" min="1" placeholder="SL" />
            <input type="text" class="form-control tb-unit" list="dl-dvt" value="Cái" placeholder="ĐVT" />
          </div>
        </td>
        <td class="col-status">
          <label class="field-label-mobile">Ghi chú / Tình trạng thay mới</label>
          <input type="text" class="form-control tb-note" list="dl-danh-gia" placeholder="Ghi chú thay thế..." autocomplete="off" />
        </td>
        <td class="col-action" style="text-align: center;">
          <button type="button" class="btn-row-del" title="Xóa dòng" onclick="this.closest('tr').remove(); App.reindexRows('${tbodyId}');">
            <svg class="ico" aria-hidden="true"><use href="#i-x"></use></svg>
          </button>
        </td>
      `;
    }
    tbody.appendChild(row);
  },

  /**
   * Đánh số thứ tự lại các dòng sau khi xóa
   */
  reindexRows(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    Array.from(tbody.children).forEach((tr, i) => {
      const sttEl = tr.querySelector('.col-stt, td:first-child');
      if (sttEl) sttEl.textContent = i + 1;
    });
  },

  /**
   * Ghim nhanh giá trị hiện tại của ô nhập liệu vào thư viện Validation
   */
  quickPinField(inputId, cat) {
    const el = document.getElementById(inputId);
    if (!el) return;
    const val = el.value.trim();
    if (!val) {
      this.showToast('Vui lòng nhập nội dung vào ô trước khi ghim!', 'warning');
      return;
    }
    ValidationStore.learn(cat, val);
    ValidationStore.togglePin(cat, val);
    const isPinned = ValidationStore.isPinned(cat, val);
    this.showToast(isPinned ? `📌 Đã ghim & lưu vào thư viện "${val}"!` : `Đã bỏ ghim "${val}"`, 'success');
  },

  /**
   * Thêm dòng phân đoạn cho Form Vệ Sinh
   */
  addVeSinhDoanRow() {
    const tbody = document.getElementById('vs-doan-tbody');
    if (!tbody) return;

    const row = document.createElement('tr');
    const idx = tbody.children.length + 1;

    row.innerHTML = `
      <td style="text-align: center;">${idx}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span>Trụ</span>
          <input type="number" class="form-control vs-from" placeholder="Từ" style="width: 70px;" />
          <span>đến</span>
          <input type="number" class="form-control vs-to" placeholder="Đến" style="width: 70px;" />
        </div>
      </td>
      <td>
        <input type="number" class="form-control vs-len" placeholder="Mét" style="width: 90px;" />
      </td>
      <td>
        <input type="number" class="form-control vs-wid" value="3.0" step="0.5" style="width: 80px;" />
      </td>
      <td>
        <input type="text" class="form-control vs-area" readonly style="width: 100px; font-weight: bold; background: var(--bg-subtle);" value="0" />
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('tr').remove(); App.calcVeSinhTotals();"><svg class="ico" aria-hidden="true"><use href="#i-x"></use></svg></button>
      </td>
    `;

    // Lắng nghe thay đổi để tự động tính diện tích
    const fromInput = row.querySelector('.vs-from');
    const toInput = row.querySelector('.vs-to');
    const lenInput = row.querySelector('.vs-len');
    const widInput = row.querySelector('.vs-wid');
    const areaInput = row.querySelector('.vs-area');

    const updateRowCalc = () => {
      const from = parseInt(fromInput.value) || 0;
      const to = parseInt(toInput.value) || 0;
      let len = parseFloat(lenInput.value);

      // Nếu người dùng nhập trụ từ A đến B mà chưa nhập mét -> tự ước tính (mỗi trụ ~40m)
      if (!len && to > from) {
        len = (to - from) * 40;
        lenInput.value = len;
      }

      const wid = parseFloat(widInput.value) || 0;
      const area = (len || 0) * wid;
      areaInput.value = area.toFixed(1);
      this.calcVeSinhTotals();
    };

    fromInput.addEventListener('input', updateRowCalc);
    toInput.addEventListener('input', updateRowCalc);
    lenInput.addEventListener('input', updateRowCalc);
    widInput.addEventListener('input', updateRowCalc);

    tbody.appendChild(row);
  },

  /**
   * Tính tổng chiều dài và diện tích cho Form Vệ Sinh
   */
  calcVeSinhTotals() {
    let totalLen = 0;
    let totalArea = 0;

    document.querySelectorAll('#vs-doan-tbody tr').forEach(row => {
      const len = parseFloat(row.querySelector('.vs-len')?.value) || 0;
      const area = parseFloat(row.querySelector('.vs-area')?.value) || 0;
      totalLen += len;
      totalArea += area;
    });

    const totalLenEl = document.getElementById('vs-tong-chieu-dai');
    const totalAreaEl = document.getElementById('vs-tong-dien-tich');

    if (totalLenEl) totalLenEl.value = totalLen;
    if (totalAreaEl) totalAreaEl.value = totalArea.toFixed(1);
  },

  /**
   * Thu thập dữ liệu và xử lý Lưu / In ấn cho các Form
   */
  setupFormSubmitHandlers() {
    // 1. Submit Form Bảo Trì
    document.getElementById('form-baotri-el')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const record = this.collectBaoTriData();
      await this.handleSaveAction('baotri', record);
    });
    document.getElementById('btn-print-baotri')?.addEventListener('click', () => {
      const record = this.collectBaoTriData();
      PDFService.openPreviewModal('baotri', record);
    });

    // 2. Submit Form Vệ Sinh
    document.getElementById('form-vesinh-el')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const record = this.collectVeSinhData();
      await this.handleSaveAction('vesinh', record);
    });
    document.getElementById('btn-print-vesinh')?.addEventListener('click', () => {
      const record = this.collectVeSinhData();
      PDFService.openPreviewModal('vesinh', record);
    });

    // 3. Submit Form Nhật Ký
    document.getElementById('form-nhatky-el')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const record = this.collectNhatKyData();
      await this.handleSaveAction('nhatky', record);
    });
    document.getElementById('btn-print-nhatky')?.addEventListener('click', () => {
      const record = this.collectNhatKyData();
      PDFService.openPreviewModal('nhatky', record);
    });
  },

  collectBaoTriData() {
    const tuyen = document.getElementById('bt-tuyen-input')?.value.trim() || '';
    const diaDiem = document.getElementById('bt-dia-diem')?.value.trim() || '';
    const suCo = document.getElementById('bt-su-co-input')?.value.trim() || '';
    const reason = document.getElementById('bt-nguyen-nhan')?.value.trim() || '';
    const ketQua = document.getElementById('bt-ket-qua')?.value.trim() || '';
    const tinhTrang = document.getElementById('bt-tinh-trang')?.value.trim() || '';

    if (tuyen) ValidationStore.learn('tuyen', tuyen);
    if (diaDiem) ValidationStore.learn('diaDiem', diaDiem);
    if (suCo) ValidationStore.learn('suCo', suCo);
    if (reason) ValidationStore.learn('nguyenNhan', reason);
    if (ketQua) ValidationStore.learn('danhGia', ketQua);
    if (tinhTrang) ValidationStore.learn('danhGia', tinhTrang);

    const reps = this.collectRepresentatives('bt');

    const thietBiHong = [];
    document.querySelectorAll('#bt-thietbi-hong-tbody tr').forEach(r => {
      const name = r.querySelector('.tb-name')?.value.trim() || '';
      if (name) {
        thietBiHong.push({
          name: name,
          quantity: r.querySelector('.tb-qty')?.value || '1',
          unit: r.querySelector('.tb-unit')?.value || 'Cái',
          status: r.querySelector('.tb-status')?.value || ''
        });
        ValidationStore.learn('thietBi', name);
      }
    });

    const thietBiThayThe = [];
    document.querySelectorAll('#bt-thietbi-thaythe-tbody tr').forEach(r => {
      const name = r.querySelector('.tb-name')?.value.trim() || '';
      if (name) {
        thietBiThayThe.push({
          name: name,
          quantity: r.querySelector('.tb-qty')?.value || '1',
          unit: r.querySelector('.tb-unit')?.value || 'Cái',
          note: r.querySelector('.tb-note')?.value || ''
        });
        ValidationStore.learn('thietBi', name);
      }
    });

    const formatRepsStr = (arr) => arr.map(r => r.position ? `${r.name} (${r.position})` : r.name).join('; ');

    return {
      ngayLap: document.getElementById('bt-ngay-lap')?.value,
      gioLap: document.getElementById('bt-gio-lap')?.value,
      diaDiem: diaDiem,
      tuyenHrd: tuyen,
      daiDienBaoTri: reps.bt,
      daiDienChuRung: reps.cr,
      daiDienKiemLam: reps.kl,
      ddBt: formatRepsStr(reps.bt),
      ddCr: formatRepsStr(reps.cr),
      ddKl: formatRepsStr(reps.kl),
      suCo: suCo,
      nguyenNhan: reason,
      thietBiHong: thietBiHong,
      thietBiThayThe: thietBiThayThe,
      ketQuaKhacPhuc: ketQua,
      tinhTrang: tinhTrang,
      photos: this.currentPhotos.baotri
    };
  },

  collectVeSinhData() {
    const tuyen = document.getElementById('vs-tuyen-input')?.value.trim() || '';
    const diaDiem = document.getElementById('vs-dia-diem')?.value.trim() || '';
    const danhGia = document.getElementById('vs-danh-gia')?.value.trim() || '';
    const nhanCong = document.getElementById('vs-nhan-cong')?.value.trim() || '';

    if (tuyen) ValidationStore.learn('tuyen', tuyen);
    if (diaDiem) ValidationStore.learn('diaDiem', diaDiem);
    if (danhGia) ValidationStore.learn('danhGia', danhGia);
    if (nhanCong) ValidationStore.learn('hoten', nhanCong);

    const reps = this.collectRepresentatives('vs');

    const doanList = [];
    document.querySelectorAll('#vs-doan-tbody tr').forEach(r => {
      const from = r.querySelector('.vs-from')?.value || '';
      const to = r.querySelector('.vs-to')?.value || '';
      const l = r.querySelector('.vs-len')?.value || '0';
      const w = r.querySelector('.vs-wid')?.value || '3.0';
      const a = (parseFloat(l) * parseFloat(w)).toFixed(1);
      if (from || to || l !== '0') {
        doanList.push({ from: from, to: to, length: l, width: w, area: a });
      }
    });

    const formatRepsStr = (arr) => arr.map(r => r.position ? `${r.name} (${r.position})` : r.name).join('; ');

    return {
      ngayLap: document.getElementById('vs-ngay-lap')?.value,
      gioLap: document.getElementById('vs-gio-lap')?.value,
      diaDiem: diaDiem,
      tuyenHrd: tuyen,
      daiDienBaoTri: reps.bt,
      daiDienChuRung: reps.cr,
      daiDienKiemLam: reps.kl,
      ddBt: formatRepsStr(reps.bt),
      ddCr: formatRepsStr(reps.cr),
      ddKl: formatRepsStr(reps.kl),
      dsNhanCong: [nhanCong].filter(Boolean),
      cacDoanVeSinh: doanList,
      tongChieuDai: document.getElementById('vs-tong-chieu-dai')?.value || '0',
      tongDienTich: document.getElementById('vs-tong-dien-tich')?.value || '0',
      danhGia: danhGia,
      photos: this.currentPhotos.vesinh
    };
  },

  collectNhatKyData() {
    const hangMuc = document.getElementById('nk-hang-muc')?.value.trim() || '';
    const tuyen = (document.getElementById('nk-tuyen-input')?.value || document.getElementById('nk-dia-diem')?.value || '').trim();
    const chuDauTu = document.getElementById('nk-chu-dau-tu')?.value.trim() || '';
    const tvgs = document.getElementById('nk-tu-van-giam-sat')?.value.trim() || '';
    const nhaThau = document.getElementById('nk-nha-thau')?.value.trim() || '';
    const noiDung = document.getElementById('nk-noi-dung')?.value.trim() || '';
    const danhGia = document.getElementById('nk-danh-gia')?.value.trim() || '';

    if (hangMuc) ValidationStore.learn('nkHangMuc', hangMuc);
    if (tuyen) ValidationStore.learn('tuyen', tuyen);
    if (chuDauTu) ValidationStore.learn('nkChuDauTu', chuDauTu);
    if (tvgs) ValidationStore.learn('nkTuVanGiamSat', tvgs);
    if (nhaThau) ValidationStore.learn('nkNhaThau', nhaThau);
    if (noiDung) ValidationStore.learn('nkNoiDung', noiDung);
    if (danhGia) ValidationStore.learn('nkDanhGia', danhGia);

    return {
      ngayGhi: document.getElementById('nk-ngay-ghi')?.value,
      thoiTiet: document.getElementById('nk-thoi-tiet')?.value,
      hangMuc: hangMuc,
      diaDiem: tuyen,
      tuyenHrd: tuyen,
      chuDauTu: chuDauTu,
      tuVanGiamSat: tvgs,
      nhaThauThiCong: nhaThau,
      noiDungCongViec: noiDung,
      danhGiaGiamSat: danhGia,
      photos: this.currentPhotos.nhatky
    };
  },

  async handleSaveAction(formType, recordData) {
    const user = Auth.currentUser;
    const username = user ? user.username : 'khach';

    this.showToast('Đang lưu bản ghi...', 'info');

    // 1. Nếu có mạng và đã có URL Backend Google Apps Script -> Gửi API
    if (navigator.onLine && QLBV_CONFIG.APPS_SCRIPT_URL) {
      try {
        const response = await fetch(QLBV_CONFIG.APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveRecord',
            formType: formType,
            record: recordData,
            username: username
          })
        });
        const res = await response.json();
        if (res.success) {
          this.showToast('Đã lưu trực tiếp lên Google Sheets!', 'success');
          StorageService.saveToLocalHistory({
            id: res.recordId,
            formType: formType,
            record: recordData,
            username: username,
            timestamp: new Date().toISOString(),
            status: 'synced'
          });
          this.refreshDashboardMetrics();
          return;
        }
      } catch (e) {
        console.warn("Lỗi gửi trực tuyến, lưu vào hàng đợi Offline:", e);
      }
    }

    // 2. Lưu Offline vào LocalStorage
    StorageService.saveOffline(formType, recordData, username);
    this.showToast('Đã lưu vào bộ nhớ máy (Offline)! Sẽ tự đồng bộ khi có mạng.', 'warning');
    this.refreshDashboardMetrics();
  },

  /**
   * Cập nhật số liệu trên Dashboard
   */
  refreshDashboardMetrics() {
    const history = StorageService.getLocalHistory();
    const pending = StorageService.getOfflineQueue();

    let countBT = 0;
    let countVS = 0;
    let totalLen = 0;
    let totalArea = 0;
    let countNK = 0;

    history.forEach(item => {
      if (item.formType === 'baotri') countBT++;
      else if (item.formType === 'vesinh') {
        countVS++;
        totalLen += parseFloat(item.record?.tongChieuDai) || 0;
        totalArea += parseFloat(item.record?.tongDienTich) || 0;
      } else if (item.formType === 'nhatky') countNK++;
    });

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText('metric-count-bt', countBT);
    setText('metric-count-vs', countVS);
    setText('metric-total-len', totalLen.toLocaleString('vi-VN'));
    setText('metric-total-area', (totalArea / 10000).toFixed(3));
    setText('metric-count-nk', countNK);
    setText('metric-pending-sync', pending.length);

    // Chỉ hiện khối "chờ đồng bộ" khi thực sự còn bản ghi treo
    const pendingBox = document.getElementById('sync-pending-box');
    if (pendingBox) pendingBox.style.display = pending.length > 0 ? 'flex' : 'none';
  },

  /**
   * Tải danh sách lịch sử bản ghi
   */
  loadHistoryList() {
    const container = document.getElementById('history-records-list');
    if (!container) return;

    const history = StorageService.getLocalHistory();
    if (history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;"><svg class="ico ico-xl" aria-hidden="true"><use href="#i-folder"></use></svg></div>
          <p>Chưa có bản ghi nào được lưu trong máy.</p>
        </div>
      `;
      return;
    }

    const typeMeta = {
      baotri: { name: 'Biên bản Bảo Trì', icon: 'wrench', tone: 'tone-maint' },
      vesinh: { name: 'Biên bản Vệ Sinh', icon: 'leaf', tone: 'tone-clean' },
      nhatky: { name: 'Nhật Ký Thi Công', icon: 'clipboard', tone: 'tone-log' }
    };

    container.innerHTML = history.map((item, idx) => {
      const meta = typeMeta[item.formType] || { name: 'Biên bản', icon: 'file', tone: 'tone-hist' };
      const dateStr = item.record?.ngayLap || item.record?.ngayGhi || item.timestamp?.substring(0, 10);
      const detail = item.record?.tuyenHrd || item.record?.hangMuc || item.record?.suCo || '';

      return `
        <div class="history-item">
          <div class="icon-chip icon-chip-sm ${meta.tone}">${this.icon(meta.icon)}</div>
          <div class="history-item-body">
            <div class="history-item-title">${meta.name}</div>
            <div class="history-item-meta">
              <span>${this.icon('calendar')} <b>${dateStr}</b></span>
              <span>${this.icon('user')} ${item.username}</span>
              ${detail ? `<span>${this.icon('map-pin')} ${detail}</span>` : ''}
              ${item.record?.photos?.length ? `<span>${this.icon('camera')} ${item.record.photos.length} ảnh</span>` : ''}
            </div>
          </div>
          <button class="btn btn-secondary btn-sm history-item-btn" onclick="PDFService.openPreviewModal('${item.formType}', StorageService.getLocalHistory()[${idx}].record)">
            ${this.icon('file')} <span>Xem &amp; xuất PDF</span>
          </button>
        </div>
      `;
    }).join('');
  },

  /**
   * ================= QUÊN MẬT KHẨU =================
   */
  openForgotModal() {
    this.hideModal('login-modal');
    this.showModal('forgot-modal');
  },

  /**
   * ================= QUẢN LÝ NHÂN SỰ (ADMIN) =================
   */
  getLocalUsersList() {
    const defaultUsers = [
      { userId: 'U001', username: 'admin', pass: '123456', fullName: 'Nguyễn Viết Sử (admin)', role: 'Admin', organization: 'Chi cục Kiểm lâm Đồng Nai', phone: '0900000001', status: 'Active' },
      { userId: 'U002', username: 'giamsat', pass: '123456', fullName: 'Cán Bộ Giám Sát', role: 'Supervisor', organization: 'Hạt Kiểm lâm Khu vực', phone: '0900000002', status: 'Active' },
      { userId: 'U003', username: 'baotri01', pass: '123456', fullName: 'Đội Trưởng Bảo Trì 1', role: 'Worker', organization: 'Đơn vị Bảo trì HRD', phone: '0900000003', status: 'Active' }
    ];
    return JSON.parse(localStorage.getItem('qlbv_local_users') || 'null') || defaultUsers;
  },

  saveLocalUsersList(list) {
    localStorage.setItem('qlbv_local_users', JSON.stringify(list));
  },

  loadUsersTable() {
    const tbody = document.getElementById('app-users-tbody');
    if (!tbody) return;
    const users = this.getLocalUsersList();

    const roleIcon = { admin: 'crown', supervisor: 'eye', worker: 'wrench' };

    tbody.innerHTML = users.map((u, idx) => {
      const roleKey = (u.role || 'Worker').toLowerCase();
      const isActive = u.status !== 'Inactive';
      return `
      <tr>
        <td data-label="Họ và tên" style="font-weight: 600;">${u.fullName}</td>
        <td data-label="Tài khoản">
          <code>${u.username}</code>
          ${u.phone ? `<br/><span style="font-size:0.75rem; color:var(--text-muted);">${u.phone}</span>` : ''}
        </td>
        <td data-label="Vai trò">
          <span class="role-tag role-${roleKey}">${this.icon(roleIcon[roleKey] || 'user')} ${u.role}</span>
        </td>
        <td data-label="Đơn vị" style="font-size:0.85rem; color:var(--text-muted);">${u.organization || '-'}</td>
        <td data-label="Trạng thái" style="text-align:center;">
          <span class="status-pill ${isActive ? 'is-on' : 'is-off'}">${isActive ? 'Hoạt động' : 'Đã khóa'}</span>
        </td>
        <td data-label="Thao tác" style="text-align:center;">
          <div class="table-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="App.resetUserPassword('${u.username}')" title="Reset mật khẩu về 123456">${this.icon('key')} <span>Reset</span></button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="App.toggleUserStatus('${u.username}')" title="${isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}">${this.icon(isActive ? 'lock' : 'unlock')} <span>${isActive ? 'Khóa' : 'Mở'}</span></button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="App.openEditUserModal(${idx})" title="Sửa thông tin">${this.icon('edit')} <span>Sửa</span></button>
            ${u.username.toLowerCase() !== 'admin' ? `<button type="button" class="btn btn-danger btn-sm" onclick="App.deleteUserAccount('${u.username}')" title="Xóa tài khoản">${this.icon('trash')}</button>` : ''}
          </div>
        </td>
      </tr>
    `;
    }).join('');
  },

  openAddUserModal() {
    document.getElementById('app-user-modal-title').textContent = 'Thêm nhân sự mới';
    document.getElementById('app-usr-mode').value = 'add';
    document.getElementById('app-usr-username').disabled = false;
    document.getElementById('app-user-form').reset();
    this.showModal('app-user-modal');
  },

  openEditUserModal(idx) {
    const users = this.getLocalUsersList();
    const u = users[idx];
    if (!u) return;

    document.getElementById('app-user-modal-title').textContent = 'Sửa thông tin nhân sự';
    document.getElementById('app-usr-mode').value = 'edit';
    document.getElementById('app-usr-username').value = u.username;
    document.getElementById('app-usr-username').disabled = true;
    document.getElementById('app-usr-fullname').value = u.fullName;
    document.getElementById('app-usr-phone').value = u.phone || '';
    document.getElementById('app-usr-role').value = u.role || 'Worker';
    document.getElementById('app-usr-status').value = u.status || 'Active';
    document.getElementById('app-usr-org').value = u.organization || '';
    this.showModal('app-user-modal');
  },

  resetUserPassword(username) {
    if (!confirm(`Bạn có chắc muốn đặt lại mật khẩu cho [${username}] về 123456?`)) return;
    let users = this.getLocalUsersList();
    const u = users.find(x => x.username.toLowerCase() === username.toLowerCase());
    if (u) {
      u.passwordHash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // 123456
      this.saveLocalUsersList(users);
      this.showToast(`Đã reset mật khẩu cho [${username}] về mặc định: 123456`, 'success');
    }
  },

  toggleUserStatus(username) {
    let users = this.getLocalUsersList();
    const u = users.find(x => x.username.toLowerCase() === username.toLowerCase());
    if (u) {
      u.status = (u.status === 'Active') ? 'Inactive' : 'Active';
      this.saveLocalUsersList(users);
      this.showToast(`Đã ${u.status === 'Active' ? 'mở khóa' : 'khóa'} tài khoản [${username}]!`, 'info');
      this.loadUsersTable();
    }
  },

  deleteUserAccount(username) {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản [${username}]?`)) return;
    let users = this.getLocalUsersList().filter(x => x.username.toLowerCase() !== username.toLowerCase());
    this.saveLocalUsersList(users);
    this.showToast(`Đã xóa tài khoản [${username}]!`, 'warning');
    this.loadUsersTable();
  },

  /**
   * Helper hiển thị & ẩn Modal
   */
  // Các modal được phép mở khi CHƯA đăng nhập
  PUBLIC_MODALS: ['login-modal', 'forgot-modal', 'theme-picker-modal'],

  showModal(modalId) {
    if (!Auth.isLoggedIn() && !this.PUBLIC_MODALS.includes(modalId)) {
      this.lockToLoginScreen();
      return;
    }
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  },
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.classList.remove('modal-open');
    }
  },

  /**
   * Hiển thị Toast thông báo
   */
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const iconByType = { success: 'check', error: 'x-circle', warning: 'alert', info: 'info' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      ${this.icon(iconByType[type] || 'info', 'ico ico-lg toast-icon')}
      <div>${message}</div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  /**
   * Quản lý 05 Bộ Giao Diện Lâm Nghiệp Chuyên Nghiệp (5 UI Themes)
   * 1. emerald  - Rừng nguyên sinh
   * 2. pine     - Rừng thông Cát Tiên
   * 3. earth    - Đất rừng miền Đông
   * 4. mist     - Thác Mai sương mù
   * 5. midnight - Tuần tra đêm
   */
  setupTheme() {
    const savedThemeStyle = localStorage.getItem('qlbv_theme_style') || 'emerald';
    this.setThemeStyle(savedThemeStyle, false);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        this.openThemePicker();
      });
    }
  },

  openThemePicker() {
    const currentTheme = document.documentElement.getAttribute('data-theme-style') || 'emerald';
    document.querySelectorAll('.theme-card-option').forEach(card => {
      const t = card.getAttribute('data-theme-target');
      card.classList.toggle('active', t === currentTheme);
    });
    this.showModal('theme-picker-modal');
  },

  setThemeStyle(themeName, showToastMsg = true) {
    const validThemes = ['emerald', 'pine', 'earth', 'mist', 'midnight'];
    if (!validThemes.includes(themeName)) themeName = 'emerald';

    document.documentElement.setAttribute('data-theme-style', themeName);
    localStorage.setItem('qlbv_theme_style', themeName);

    // Đồng bộ thuộc tính dark nếu chọn midnight
    if (themeName === 'midnight') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Cập nhật trạng thái card trong modal
    document.querySelectorAll('.theme-card-option').forEach(card => {
      const t = card.getAttribute('data-theme-target');
      card.classList.toggle('active', t === themeName);
    });

    const themeNamesMap = {
      emerald: 'Rừng nguyên sinh',
      pine: 'Rừng thông Cát Tiên',
      earth: 'Đất rừng miền Đông',
      mist: 'Thác Mai sương mù',
      midnight: 'Tuần tra đêm'
    };

    if (showToastMsg) {
      this.showToast(`Đã áp dụng giao diện: ${themeNamesMap[themeName]}`, 'success');
      this.hideModal('theme-picker-modal');
    }
  },

  /**
   * Theo dõi trạng thái mạng Online / Offline
   */
  setupNetworkMonitor() {
    const updateStatus = () => {
      const isOnline = navigator.onLine;
      const el = document.getElementById('network-status-badge');
      if (el) {
        el.className = `network-status ${isOnline ? 'status-online' : 'status-offline'}`;
        el.innerHTML = `<span class="status-dot"></span> <span>${isOnline ? 'Trực tuyến' : 'Ngoại tuyến (Offline)'}</span>`;
      }
    };

    window.addEventListener('online', () => {
      updateStatus();
      this.showToast('Đã có kết nối Internet! Có thể đồng bộ dữ liệu.', 'success');
    });
    window.addEventListener('offline', () => {
      updateStatus();
      this.showToast('Đã mất kết nối mạng. Hệ thống chuyển sang chế độ Offline.', 'warning');
    });

    updateStatus();
  }
};

// Khởi chạy App khi trang đã load xong
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
