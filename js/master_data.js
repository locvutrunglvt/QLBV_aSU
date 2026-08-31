/**
 * MODULE MASTER DATA & DROPDOWN VALIDATION (GỢI Ý & TỰ ĐỘNG ĐIỀN)
 */
const MasterData = {
  data: {
    tuyenList: [
      { code: "T01", name: "Tuyến Hàng rào điện Định Quán (Đoạn 1)", extra: "Trụ 01 - Trụ 150" },
      { code: "T02", name: "Tuyến Hàng rào điện Vĩnh Cửu (Đoạn 2)", extra: "Trụ 151 - Trụ 320" },
      { code: "T03", name: "Tuyến Hàng rào điện Tân Phú (Đoạn 3)", extra: "Trụ 321 - Trụ 480" },
      { code: "T04", name: "Tuyến Hàng rào điện Bù Gia Mập giáp ranh", extra: "Trụ 481 - Trụ 600" }
    ],
    donViBaoTri: [
      { code: "DV01", name: "Công ty TNHH Kỹ thuật Xây dựng & Môi trường Đồng Nai", extra: "" },
      { code: "DV02", name: "Tổ Kỹ thuật Bảo trì Hàng rào điện Chi cục Kiểm lâm", extra: "" }
    ],
    chuRungList: [
      { code: "CR01", name: "Ban Quản lý Rừng phòng hộ Tân Phú", extra: "Huyện Tân Phú" },
      { code: "CR02", name: "Khu Bảo tồn Thiên nhiên - Văn hóa Đồng Nai", extra: "Huyện Vĩnh Cửu" },
      { code: "CR03", name: "Công ty TNHH MTV Lâm nghiệp La Ngà", extra: "Huyện Định Quán" }
    ],
    kiemLamList: [
      { code: "KL01", name: "Hạt Kiểm lâm Huyện Định Quán", extra: "" },
      { code: "KL02", name: "Hạt Kiểm lâm Huyện Vĩnh Cửu", extra: "" },
      { code: "KL03", name: "Hạt Kiểm lâm Khu Bảo tồn Đồng Nai", extra: "" }
    ],
    suCoList: [
      { code: "SC01", name: "Đứt dây dẫn xung điện do cây đổ/gãy đè lên", extra: "" },
      { code: "SC02", name: "Sét đánh gây hỏng bộ tạo xung (Energizer)", extra: "" },
      { code: "SC03", name: "Bình ắc quy / Tấm pin năng lượng mặt trời hỏng, yếu điện", extra: "" },
      { code: "SC04", name: "Sứ cách điện bị vỡ/nứt làm rò điện xuống đất", extra: "" },
      { code: "SC05", name: "Trụ rào bị nghiêng, gãy do voi/gia súc va quẹt", extra: "" },
      { code: "SC06", name: "Cỏ cây mọc um tùm chạm vào dây gây ngắn mạch", extra: "" }
    ],
    thietBiList: [
      { code: "TB01", name: "Bộ phát xung điện (Energizer) 12V/220V", extra: "Cái" },
      { code: "TB02", name: "Bình ắc quy lưu điện 12V - 100Ah", extra: "Bình" },
      { code: "TB03", name: "Tấm pin năng lượng mặt trời Solar 100W/150W", extra: "Tấm" },
      { code: "TB04", name: "Sứ cách điện néo / Sứ đỡ dây (Insulator)", extra: "Cái" },
      { code: "TB05", name: "Dây cáp thép bọc kẽm chịu lực 2.5mm / 3.0mm", extra: "Mét" },
      { code: "TB06", name: "Bộ chống sét lan truyền cho hàng rào điện", extra: "Bộ" },
      { code: "TB07", name: "Bộ đo điện áp hàng rào chuyên dụng", extra: "Cái" },
      { code: "TB08", name: "Trụ bê tông / Trụ sắt gia cố hàng rào", extra: "Trụ" }
    ],
    chuDauTuList: [
      { code: "CDT01", name: "Chi cục Kiểm lâm Tỉnh Đồng Nai", extra: "0251.3822xxx" }
    ],
    tuVanGiamSatList: [
      { code: "TVGS01", name: "Ban Giám sát & Quản lý Dự án Bảo tồn Voi", extra: "0912.345xxx" }
    ]
  },

  /**
   * Tải Master Data từ Google Sheets hoặc Cache
   */
  /**
   * Nạp danh mục NGAY LẬP TỨC từ cache/mặc định trong máy.
   * Không chờ mạng: ngoài hiện trường sóng yếu app vẫn mở được tức thì.
   */
  load() {
    const cached = localStorage.getItem('qlbv_master_data');
    if (cached) {
      try {
        this.data = { ...this.data, ...JSON.parse(cached) };
      } catch (e) { }
    }
  },

  /**
   * Làm mới danh mục từ Google Sheets ở nền (có giới hạn thời gian chờ).
   * Trả về true nếu có dữ liệu mới để màn hình cập nhật lại dropdown.
   */
  async refreshFromServer(timeoutMs = 10000) {
    if (!QLBV_CONFIG.APPS_SCRIPT_URL || !navigator.onLine) return false;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${QLBV_CONFIG.APPS_SCRIPT_URL}?action=getMasterData`, { signal: controller.signal });
      const json = await res.json();
      if (json.success && json.data) {
        this.data = { ...this.data, ...json.data };
        localStorage.setItem('qlbv_master_data', JSON.stringify(this.data));
        return true;
      }
    } catch (err) {
      console.warn("Không thể tải MasterData từ server, dùng cache/mặc định:", err);
    } finally {
      clearTimeout(timer);
    }
    return false;
  },

  /**
   * Render các tùy chọn vào thẻ select
   */
  populateSelect(selectElementId, items, placeholder = "-- Chọn mục --", selectedValue = "") {
    const select = document.getElementById(selectElementId);
    if (!select) return;

    select.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.name || item;
      opt.textContent = item.name ? (item.name + (item.extra ? ` (${item.extra})` : '')) : item;
      if (opt.value === selectedValue) opt.selected = true;
      select.appendChild(opt);
    });
  },

  /**
   * Render danh sách Datalist cho input có autocomplete
   */
  populateDatalist(datalistId, items) {
    let datalist = document.getElementById(datalistId);
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = datalistId;
      document.body.appendChild(datalist);
    }
    datalist.innerHTML = '';
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.name || item;
      datalist.appendChild(opt);
    });
  }
};

/**
 * TRUNG TÂM QUẢN LÝ THAM SỐ & VALIDATION DÙNG CHUNG (SHARED PARAMETER & VALIDATION CENTER)
 */
const ValidationStore = {
  categories: [
    {
      id: 'tuyen',
      name: 'Tuyến Hàng Rào Điện',
      desc: 'Dùng chung cho: Biên Bản Bảo Trì, Biên Bản Vệ Sinh, Nhật Ký Thi Công',
      sharedWith: ['bt-tuyen-input', 'vs-tuyen-input', 'nk-tuyen-input']
    },
    {
      id: 'hoten',
      name: 'Họ Tên Nhân Sự / Đại Diện',
      desc: 'Dùng chung cho: Đơn vị Bảo trì, Đơn vị Chủ rừng, Cơ quan Kiểm lâm & Nhân công',
      sharedWith: ['bt-dd-bt-name', 'bt-dd-cr-name', 'bt-dd-kl-name', 'vs-dd-bt-name', 'vs-dd-cr-name', 'vs-dd-kl-name', 'vs-nhan-cong']
    },
    {
      id: 'chucvu',
      name: 'Danh Sách Chức Vụ',
      desc: 'Dùng chung cho: Chức vụ của tất cả các đơn vị tham gia',
      sharedWith: ['bt-dd-bt-pos', 'bt-dd-cr-pos', 'bt-dd-kl-pos', 'vs-dd-bt-pos', 'vs-dd-cr-pos', 'vs-dd-kl-pos']
    },
    {
      id: 'thietBi',
      name: 'Thiết Bị & Phụ Tùng',
      desc: 'Dùng chung cho: Thiết bị hư hỏng & Vật tư thay thế khắc phục',
      sharedWith: ['bt-thietbi-hong', 'bt-thietbi-thaythe']
    },
    {
      id: 'suCo',
      name: 'Sự Cố Thường Gặp',
      desc: 'Dùng cho: Xác minh hiện trạng sự cố hàng rào điện',
      sharedWith: ['bt-su-co-input']
    },
    {
      id: 'nguyenNhan',
      name: 'Nguyên Nhân Sự Cố',
      desc: 'Dùng cho: Ghi nhận nguyên nhân sự cố kỹ thuật',
      sharedWith: ['bt-nguyen-nhan']
    },
    {
      id: 'dvt',
      name: 'Đơn Vị Tính',
      desc: 'Dùng chung cho: Khối lượng vật tư, phụ tùng thay thế',
      sharedWith: ['tb-unit']
    },
    {
      id: 'diaDiem',
      name: 'Vị Trí / Địa Điểm / Tiểu Khu',
      desc: 'Dùng chung cho: Vị trí trụ, tiểu khu rừng, phân trường',
      sharedWith: ['bt-dia-diem', 'vs-dia-diem', 'nk-dia-diem']
    },
    {
      id: 'danhGia',
      name: 'Đánh Giá & Kết Luận',
      desc: 'Dùng chung cho: Kết luận bảo trì, đánh giá vệ sinh thực bì',
      sharedWith: ['bt-ket-qua', 'bt-tinh-trang', 'vs-danh-gia']
    }
  ],

  defaults: {
    tuyen: [],
    hoten: [],
    chucvu: [
      "Đội trưởng", "Đội phó", "Kỹ thuật viên", "Công nhân bảo trì",
      "Trưởng trạm BVR", "Nhân viên BVR", "Cán bộ quản lý",
      "Kiểm lâm viên địa bàn", "Trạm trưởng KL", "Phó Trạm trưởng KL", "Cán bộ Thanh tra"
    ],
    thietBi: [
      "Bộ phát xung điện (Energizer) 12V/220V",
      "Bình ắc quy lưu điện 12V - 100Ah",
      "Tấm pin năng lượng mặt trời Solar 100W",
      "Sứ cách điện néo / Sứ đỡ dây",
      "Dây cáp thép bọc kẽm 2.5mm",
      "Bộ chống sét lan truyền",
      "Trụ bê tông gia cố"
    ],
    suCo: [
      "Đứt dây cáp xung điện do cây rừng ngã đè",
      "Mất nguồn xung điện tại trạm phát xung",
      "Sứ cách điện bị vỡ làm chạm chập tiếp địa",
      "Bình ắc quy lưu điện bị chai / sụt áp",
      "Trụ rào bị nghiêng do voi rừng húc / đất lún"
    ],
    nguyenNhan: [
      "Cây rừng ngoài hành lang ngã đổ đè đứt dây cáp",
      "Mưa bão sét đánh hỏng thiết bị chống sét",
      "Voi rừng tác động làm biến dạng khung trụ rào",
      "Thiết bị vận hành lâu ngày hết tuổi thọ tự nhiên"
    ],
    dvt: ["Cái", "Bộ", "Bình", "Tấm", "Mét", "Trụ", "Kg", "Hệ thống"],
    diaDiem: [
      "Tiểu khu 120 - RPH Tân Phú",
      "Khu vực Trụ 45 đến Trụ 48",
      "Khu vực Trạm xung số 2 - Vườn Quốc Gia Cát Tiên",
      "Tuyến rào giáp ranh Định Quán - Vĩnh Cửu"
    ],
    danhGia: [
      "Đã tiến hành nối dây cáp và kiểm tra thông mạch, hệ thống xung điện hoạt động bình thường.",
      "Điện áp đo đạt 7.5kV, đảm bảo an toàn ngăn voi.",
      "Đã phát dọn sạch thực bì dưới hành lang dây điện, đảm bảo thông thoáng và an toàn cách điện."
    ]
  },

  getAllCategories() {
    return this.categories;
  },

  get(cat) {
    const stored = localStorage.getItem('qlbv_val_' + cat);
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return this.defaults[cat] || [];
  },

  getPinned(cat) {
    const stored = localStorage.getItem('qlbv_val_pin_' + cat);
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return [];
  },

  save(cat, list) {
    localStorage.setItem('qlbv_val_' + cat, JSON.stringify(list));
    this.refreshDatalists();
  },

  savePinned(cat, list) {
    localStorage.setItem('qlbv_val_pin_' + cat, JSON.stringify(list));
  },

  learn(cat, val) {
    if (!val || typeof val !== 'string') return;
    const clean = val.trim();
    if (!clean) return;
    let list = this.get(cat);
    if (!list.includes(clean)) {
      list.push(clean);
      this.save(cat, list);
    }
  },

  togglePin(cat, val) {
    let pins = this.getPinned(cat);
    if (pins.includes(val)) {
      pins = pins.filter(x => x !== val);
    } else {
      pins.push(val);
    }
    this.savePinned(cat, pins);
  },

  isPinned(cat, val) {
    return this.getPinned(cat).includes(val);
  },

  remove(cat, val) {
    let list = this.get(cat).filter(x => x !== val);
    this.save(cat, list);
    let pins = this.getPinned(cat).filter(x => x !== val);
    this.savePinned(cat, pins);
  },

  clear(cat) {
    localStorage.removeItem('qlbv_val_' + cat);
    localStorage.removeItem('qlbv_val_pin_' + cat);
    this.refreshDatalists();
  },

  resetAllToDefaults() {
    this.categories.forEach(c => {
      localStorage.removeItem('qlbv_val_' + c.id);
      localStorage.removeItem('qlbv_val_pin_' + c.id);
    });
    this.refreshDatalists();
  },

  exportConfigJson() {
    const data = {};
    this.categories.forEach(c => {
      data[c.id] = {
        items: this.get(c.id),
        pinned: this.getPinned(c.id)
      };
    });
    return JSON.stringify(data, null, 2);
  },

  importConfigJson(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      Object.keys(data).forEach(cat => {
        if (data[cat].items) this.save(cat, data[cat].items);
        if (data[cat].pinned) this.savePinned(cat, data[cat].pinned);
      });
      this.refreshDatalists();
      return { success: true, message: 'Đã nhập cấu hình tham số thành công!' };
    } catch (e) {
      return { success: false, message: 'File cấu hình JSON không hợp lệ: ' + e.message };
    }
  },

  refreshDatalists() {
    const populateDL = (dlId, cat) => {
      let dl = document.getElementById(dlId);
      if (!dl) {
        dl = document.createElement('datalist');
        dl.id = dlId;
        document.body.appendChild(dl);
      }
      const items = this.get(cat);
      const pins = this.getPinned(cat);
      
      // Sắp xếp: Pinned trước, sau đó là các mục khác
      const sorted = [
        ...pins.filter(p => items.includes(p)),
        ...items.filter(i => !pins.includes(i))
      ];

      dl.innerHTML = sorted.map(item => `<option value="${item}">`).join('');
    };

    populateDL('dl-tuyen', 'tuyen');
    populateDL('dl-su-co', 'suCo');
    populateDL('dl-nguyen-nhan', 'nguyenNhan');
    populateDL('dl-thietbi', 'thietBi');
    populateDL('dl-hoten', 'hoten');
    populateDL('dl-chucvu', 'chucvu');
    populateDL('dl-dvt', 'dvt');
    populateDL('dl-diadiem', 'diaDiem');
    populateDL('dl-danhgia', 'danhGia');
  }
};

