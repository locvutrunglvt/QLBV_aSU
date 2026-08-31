/**
 * MODULE CHỤP ẢNH, GẮN TỌA ĐỘ GPS, THỜI GIAN & NÉN ẢNH (CAMERA & WATERMARK)
 */
const CameraService = {
  currentLocation: null,

  /**
   * Khởi tạo và lấy tọa độ GPS nền
   */
  initGeolocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.currentLocation = {
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
            acc: Math.round(pos.coords.accuracy)
          };
          console.log("GPS Location:", this.currentLocation);
        },
        err => {
          console.warn("GPS không khả dụng:", err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  },

  /**
   * Xử lý file ảnh được chọn hoặc chụp từ Camera
   * @param {File} file - File ảnh
   * @param {String} extraNote - Ghi chú thêm (vd: Mã tuyến, Trụ số)
   * @returns {Promise<String>} - Base64 Data URL của ảnh đã đóng watermark và nén
   */
  processImage(file, extraNote = "") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Tính toán kích thước nén
          const maxDim = QLBV_CONFIG.IMAGE_MAX_WIDTH || 1280;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          // Vẽ lên Canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          ctx.drawImage(img, 0, 0, width, height);

          // Tạo Watermark dải đen mờ ở góc dưới
          const now = new Date();
          const timeStr = now.toLocaleString('vi-VN', {
            hour12: false,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });

          let gpsStr = "GPS: Chưa định vị";
          if (this.currentLocation) {
            gpsStr = `GPS: ${this.currentLocation.lat}, ${this.currentLocation.lng} (±${this.currentLocation.acc}m)`;
          }

          const line1 = `QLBV ĐỒNG NAI | ${timeStr}`;
          const line2 = `${gpsStr} ${extraNote ? ' | ' + extraNote : ''}`;

          const fontSize = Math.max(14, Math.round(width * 0.022));
          const padding = fontSize * 0.8;
          const barHeight = fontSize * 3.2;

          ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
          ctx.fillRect(0, height - barHeight, width, barHeight);

          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = "#ffffff";
          ctx.textBaseline = "top";
          ctx.fillText(line1, padding, height - barHeight + padding * 0.4);

          ctx.font = `${fontSize * 0.85}px sans-serif`;
          ctx.fillStyle = "#fef08a"; // Màu vàng sáng cho GPS
          ctx.fillText(line2, padding, height - barHeight + fontSize * 1.5);

          // Xuất Base64 JPEG nén
          const compressedDataUrl = canvas.toDataURL('image/jpeg', QLBV_CONFIG.IMAGE_QUALITY || 0.75);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Tạo UI Thư viện ảnh đính kèm cho Form
   */
  renderPhotoGallery(containerId, photosList, onRemoveCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    photosList.forEach((photoBase64, idx) => {
      const item = document.createElement('div');
      item.className = 'photo-preview-item';
      item.innerHTML = `
        <img src="${photoBase64}" alt="Ảnh ${idx + 1}" />
        <button type="button" class="photo-remove-btn" title="Xóa ảnh" data-index="${idx}"><svg class="ico" aria-hidden="true"><use href="#i-x"></use></svg></button>
      `;
      const btn = item.querySelector('.photo-remove-btn');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onRemoveCallback(idx);
      });
      container.appendChild(item);
    });
  }
};
