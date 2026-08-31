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
  async load() {
    // 1. Kiểm tra cache trong localStorage
    const cached = localStorage.getItem('qlbv_master_data');
    if (cached) {
      try {
        this.data = { ...this.data, ...JSON.parse(cached) };
      } catch (e) {}
    }

    // 2. Tải trực tuyến từ Apps Script nếu có mạng
    if (QLBV_CONFIG.APPS_SCRIPT_URL) {
      try {
        const res = await fetch(`${QLBV_CONFIG.APPS_SCRIPT_URL}?action=getMasterData`);
        const json = await res.json();
        if (json.success && json.data) {
          this.data = { ...this.data, ...json.data };
          localStorage.setItem('qlbv_master_data', JSON.stringify(this.data));
        }
      } catch (err) {
        console.warn("Không thể tải MasterData từ server, dùng cache/default:", err);
      }
    }
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
