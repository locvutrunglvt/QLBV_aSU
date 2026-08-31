/**
 * MODULE XUẤT PDF & IN ẤN CHUẨN THỂ THỨC VĂN BẢN HÀNH CHÍNH (Nghị định 30/2020/NĐ-CP & FILE MẪU WORD)
 * Hỗ trợ hoàn hảo xuất PDF A4 và In ấn trên cả Điện thoại (iOS/Android) và Máy tính (Desktop/Laptop)
 * Tác giả: Lộc Vũ Trung
 */
const PDFService = {

  currentRecord: null,
  currentFormType: null,
  renderRepresentativeLines(reps, fallbackStr) {
    if (Array.isArray(reps) && reps.length > 0) {
      return reps.map(r => {
        if (typeof r === 'object') {
          return `<div style="margin-left: 0.3cm;">- Ông/bà: <b>${r.name || '...'}</b> ${r.position ? ' - Chức vụ: ' + r.position : ''}</div>`;
        }
        return `<div style="margin-left: 0.3cm;">- Ông/bà: ${r}</div>`;
      }).join('');
    }
    if (typeof fallbackStr === 'string' && fallbackStr.trim()) {
      return fallbackStr.split(';').map(item => `<div style="margin-left: 0.3cm;">- Ông/bà: ${item.trim()}</div>`).join('');
    }
    return '<div style="margin-left: 0.3cm;">...........................................................................................</div>';
  },

  /**
   * Render HTML Mẫu Biên bản Bảo Trì (Chuẩn theo file BB ghi nhan bao tri HRD.doc)
   */
  renderBaoTriHTML(record) {
    const ngayParts = (record.ngayLap || '').split('-');
    const ngayStr = ngayParts.length === 3 ? ngayParts[2] : '.....';
    const thangStr = ngayParts.length === 3 ? ngayParts[1] : '.....';
    const namStr = ngayParts.length === 3 ? ngayParts[0] : '2026';
    const gioStr = record.gioLap || '.....';

    const thietBiHongRows = (record.thietBiHong && record.thietBiHong.length > 0) ? record.thietBiHong.map((item, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 2px 4px; font-size: 10.5pt;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 2px 6px; font-size: 10.5pt;">${item.name || ''}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 2px 4px; font-size: 10.5pt;">${item.quantity || ''} ${item.unit || 'Cái'}</td>
        <td style="border: 1px solid #000; padding: 2px 6px; font-size: 10.5pt;">${item.status || ''}</td>
      </tr>
    `).join('') : `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 2px 4px; font-size: 10.5pt;">1</td>
        <td style="border: 1px solid #000; padding: 2px 6px; font-size: 10.5pt;">Dây dẫn xung điện và phụ tùng liên quan</td>
        <td style="text-align: center; border: 1px solid #000; padding: 2px 4px; font-size: 10.5pt;">01 Hệ thống</td>
        <td style="border: 1px solid #000; padding: 2px 6px; font-size: 10.5pt;">Đã ghi nhận kiểm tra hiện trường</td>
      </tr>
    `;

    const thietBiThayTheRows = (record.thietBiThayThe && record.thietBiThayThe.length > 0) ? record.thietBiThayThe.map((item, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 2px 4px; font-size: 10.5pt;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 2px 6px; font-size: 10.5pt;">${item.name || ''}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 2px 4px; font-size: 10.5pt;">${item.quantity || ''} ${item.unit || 'Cái'}</td>
        <td style="border: 1px solid #000; padding: 2px 6px; font-size: 10.5pt;">${item.note || 'Đã thay mới, hoạt động tốt'}</td>
      </tr>
    `).join('') : `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 2px 4px; font-size: 10.5pt;">1</td>
        <td style="border: 1px solid #000; padding: 2px 6px; font-size: 10.5pt;">Vật tư phụ tùng thay thế tiêu chuẩn</td>
        <td style="text-align: center; border: 1px solid #000; padding: 2px 4px; font-size: 10.5pt;">01 Bộ</td>
        <td style="border: 1px solid #000; padding: 2px 6px; font-size: 10.5pt;">Đã thay mới, hoạt động tốt</td>
      </tr>
    `;

    const photosHTML = (record.photos && record.photos.length > 0) ? `
      <div class="print-page-break" style="page-break-before: always; margin-top: 20px; padding-top: 10px;">
        <div style="text-align: center; font-weight: bold; font-size: 12.5pt; text-transform: uppercase; margin-bottom: 12px;">
          PHỤ LỤC: HÌNH ẢNH HIỆN TRƯỜNG BẢO TRÌ SỰ CỐ
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          ${record.photos.map((p, i) => `
            <div style="text-align: center; border: 1px solid #777; padding: 5px; background: #fff; border-radius: 3px;">
              <img src="${p}" style="max-width: 100%; height: 210px; object-fit: contain; display: block; margin: 0 auto;" />
              <div style="font-size: 10.5pt; font-style: italic; margin-top: 4px; color: #000;">Hình ${i+1}: Ảnh ghi nhận hiện trường bảo trì</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    return `
      <div class="a4-document-content" style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.25; color: #000000; background: #ffffff; text-align: justify;">
        <div class="a4-page-main" style="page-break-inside: avoid; break-inside: avoid;">
          <!-- Quốc hiệu & Tiêu ngữ -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
            <tr>
              <td style="width: 44%; text-align: center; vertical-align: top; padding: 0;">
                <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">CHI CỤC KIỂM LÂM ĐỒNG NAI</div>
                <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">ĐỘI BẢO TRÌ HÀNG RÀO ĐIỆN</div>
                <div style="font-size: 11pt; margin-top: 2px;">Số: ....../BB-BT</div>
              </td>
              <td style="width: 56%; text-align: center; vertical-align: top; padding: 0;">
                <div style="font-weight: bold; font-size: 11.5pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style="font-weight: bold; font-size: 12pt;">Độc lập - Tự do - Hạnh phúc</div>
                <div style="border-bottom: 1.5px solid #000; width: 150px; margin: 2px auto 4px auto;"></div>
                <div style="font-style: italic; font-size: 11.5pt;">
                  Đồng Nai, ngày ${ngayStr} tháng ${thangStr} năm ${namStr}
                </div>
              </td>
            </tr>
          </table>

          <!-- Tiêu đề -->
          <div style="text-align: center; margin: 6px 0 6px 0;">
            <div style="font-weight: bold; font-size: 13.5pt; text-transform: uppercase;">BIÊN BẢN</div>
            <div style="font-weight: bold; font-size: 11.5pt; margin-top: 2px; line-height: 1.25;">
              Xác minh hiện trạng, ghi nhận sự cố của tuyến hàng rào điện thuộc<br/>
              Dự án khẩn cấp bảo tồn Voi tỉnh Đồng Nai trên địa bàn quản lý của ${record.diaDiem || record.tuyenHrd || '…………………………………………….'}
            </div>
          </div>

          <!-- Căn cứ pháp lý -->
          <div style="text-align: justify; margin-bottom: 4px; font-style: italic; text-indent: 0.8cm; font-size: 11pt;">
            Thực hiện Quyết định số 704/QĐ-SNNMT ngày 30/6/2026 & Quyết định số 595/QĐ-SNNMT ngày 30/3/2026 của Sở Nông nghiệp và Môi trường về việc phê duyệt kế hoạch và dự toán nhiệm vụ “quản lý, bảo vệ và vận hành các công trình xây dựng để bảo tồn Voi châu Á tại Đồng Nai năm 2026" của Chi cục Kiểm lâm;
          </div>

          <div style="margin-bottom: 4px; text-indent: 0.8cm;">
            Hôm nay, vào lúc <b>${gioStr}</b>, ngày <b>${ngayStr}</b> tháng <b>${thangStr}</b> năm <b>${namStr}</b>, tại: <b>${record.tuyenHrd || record.diaDiem || '...........................................................................'}</b>, chúng tôi gồm:
          </div>

          <!-- I. Thành phần tham dự -->
          <div style="font-weight: bold; margin-top: 3px;">I. Thành phần tham dự</div>
          <div style="margin-left: 0.3cm; margin-bottom: 3px;">
            <div style="font-weight: bold;">1. Đại diện đơn vị bảo trì:</div>
            ${this.renderRepresentativeLines(record.daiDienBaoTri, record.ddBt)}
            <div style="font-weight: bold; margin-top: 2px;">2. Đại diện đơn vị chủ rừng:</div>
            ${this.renderRepresentativeLines(record.daiDienChuRung, record.ddCr)}
            <div style="font-weight: bold; margin-top: 2px;">3. Đại diện Cơ quan kiểm lâm sở tại:</div>
            ${this.renderRepresentativeLines(record.daiDienKiemLam, record.ddKl)}
          </div>

          <!-- II. Nội dung xác minh, ghi nhận -->
          <div style="font-weight: bold; margin-top: 4px;">II. Nội dung xác minh, ghi nhận sự cố:</div>
          <div style="margin-left: 0.3cm; margin-bottom: 4px;">
            <div>1. <b>Sự cố xảy ra:</b> ${record.suCo || '...................................................................................................................................................'}</div>
            <div>2. <b>Nguyên nhân:</b> ${record.nguyenNhan || '...................................................................................................................................................'}</div>
            
            <div style="margin-top: 3px; font-weight: bold;">3. Danh mục thiết bị hư hỏng:</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 2px; margin-bottom: 3px; font-size: 10.5pt;">
              <thead>
                <tr style="background: #f2f2f2;">
                  <th style="border: 1px solid #000; padding: 2px; width: 35px; text-align: center;">STT</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: center;">Tên thiết bị / Quy cách</th>
                  <th style="border: 1px solid #000; padding: 2px; width: 85px; text-align: center;">Số lượng</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: center;">Tình trạng hư hỏng</th>
                </tr>
              </thead>
              <tbody>${thietBiHongRows}</tbody>
            </table>

            <div style="margin-top: 3px; font-weight: bold;">4. Vật tư / Thiết bị thay thế, khắc phục:</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 2px; margin-bottom: 3px; font-size: 10.5pt;">
              <thead>
                <tr style="background: #f2f2f2;">
                  <th style="border: 1px solid #000; padding: 2px; width: 35px; text-align: center;">STT</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: center;">Tên vật tư thay thế</th>
                  <th style="border: 1px solid #000; padding: 2px; width: 85px; text-align: center;">Số lượng</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: center;">Ghi chú / Tình trạng</th>
                </tr>
              </thead>
              <tbody>${thietBiThayTheRows}</tbody>
            </table>
          </div>

          <!-- III. Kết luận -->
          <div style="font-weight: bold; margin-top: 4px;">III. Kết luận</div>
          <div style="margin-left: 0.3cm;">
            <div style="text-indent: 0.6cm;">Các thành phần tham dự cùng thống nhất nghiệm thu kết quả xử lý sự cố. Hệ thống điện xung hoạt động ổn định, đủ điện áp kỹ thuật ngăn Voi./.</div>
          </div>

          <!-- Chữ ký 3 bên -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 8px; text-align: center; page-break-inside: avoid;">
            <tr>
              <td style="width: 33.3%; font-weight: bold; vertical-align: top; font-size: 11pt;">
                ĐD. ĐƠN VỊ BẢO TRÌ<br/>TUYẾN HÀNG RÀO ĐIỆN<br/>
                <span style="font-size: 10pt; font-weight: normal; font-style: italic;">(Ký, ghi rõ họ tên)</span>
                <div style="height: 44px;"></div>
              </td>
              <td style="width: 33.3%; font-weight: bold; vertical-align: top; font-size: 11pt;">
                ĐD. ĐƠN VỊ CHỦ RỪNG<br/><br/>
                <span style="font-size: 10pt; font-weight: normal; font-style: italic;">(Ký, ghi rõ họ tên)</span>
                <div style="height: 44px;"></div>
              </td>
              <td style="width: 33.4%; font-weight: bold; vertical-align: top; font-size: 11pt;">
                ĐD. CƠ QUAN KIỂM LÂM SỞ TẠI<br/><br/>
                <span style="font-size: 10pt; font-weight: normal; font-style: italic;">(Ký, ghi rõ họ tên)</span>
                <div style="height: 44px;"></div>
              </td>
            </tr>
          </table>
        </div>
        ${photosHTML}
      </div>
    `;
  },

  /**
   * Render HTML Mẫu Biên bản Vệ Sinh Phát Dọn (Chuẩn theo file BB ghi nhan ve sinh HRD.doc)
   */
  renderVeSinhHTML(record) {
    const ngayParts = (record.ngayLap || '').split('-');
    const ngayStr = ngayParts.length === 3 ? ngayParts[2] : '.....';
    const thangStr = ngayParts.length === 3 ? ngayParts[1] : '.....';
    const namStr = ngayParts.length === 3 ? ngayParts[0] : '2026';

    const doanRows = (record.cacDoanVeSinh && record.cacDoanVeSinh.length > 0) ? record.cacDoanVeSinh.map((d, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 2px 4px; font-size: 10.5pt;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 2px 6px; text-align: center; font-size: 10.5pt;">Từ trụ số: <b>${d.from || ''}</b> đến trụ số: <b>${d.to || ''}</b></td>
        <td style="border: 1px solid #000; padding: 2px 6px; text-align: right; font-size: 10.5pt;">${d.length || '0'} m</td>
        <td style="border: 1px solid #000; padding: 2px 6px; text-align: right; font-size: 10.5pt;">${d.width || '3.0'} m</td>
        <td style="border: 1px solid #000; padding: 2px 6px; text-align: right; font-weight: bold; font-size: 10.5pt;">${d.area || '0'} m²</td>
      </tr>
    `).join('') : `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 2px 4px; font-size: 10.5pt;">1</td>
        <td style="border: 1px solid #000; padding: 2px 6px; text-align: center; font-size: 10.5pt;">Toàn phân đoạn thực bì tuyến rào</td>
        <td style="border: 1px solid #000; padding: 2px 6px; text-align: right; font-size: 10.5pt;">${record.tongChieuDai || '0'} m</td>
        <td style="border: 1px solid #000; padding: 2px 6px; text-align: right; font-size: 10.5pt;">3.0 m</td>
        <td style="border: 1px solid #000; padding: 2px 6px; text-align: right; font-weight: bold; font-size: 10.5pt;">${record.tongDienTich || '0'} m²</td>
      </tr>
    `;

    const dsNhanCong = (record.dsNhanCong && record.dsNhanCong.length > 0) ? record.dsNhanCong.join(', ') : 'Đội công nhân phát dọn thực bì';

    const photosHTML = (record.photos && record.photos.length > 0) ? `
      <div class="print-page-break" style="page-break-before: always; margin-top: 20px; padding-top: 10px;">
        <div style="text-align: center; font-weight: bold; font-size: 12.5pt; text-transform: uppercase; margin-bottom: 12px;">
          PHỤ LỤC: HÌNH ẢNH THỰC TẾ PHÁT DỌN VỆ SINH TUYẾN HÀNG RÀO ĐIỆN
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          ${record.photos.map((p, i) => `
            <div style="text-align: center; border: 1px solid #777; padding: 5px; background: #fff; border-radius: 3px;">
              <img src="${p}" style="max-width: 100%; height: 210px; object-fit: contain; display: block; margin: 0 auto;" />
              <div style="font-size: 10.5pt; font-style: italic; margin-top: 4px; color: #000;">Hình ${i+1}: Ảnh kiểm tra sau phát dọn</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    return `
      <div class="a4-document-content" style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.25; color: #000000; background: #ffffff; text-align: justify;">
        <div class="a4-page-main" style="page-break-inside: avoid; break-inside: avoid;">
          <!-- Quốc hiệu & Tiêu ngữ -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
            <tr>
              <td style="width: 44%; text-align: center; vertical-align: top; padding: 0;">
                <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">CHI CỤC KIỂM LÂM ĐỒNG NAI</div>
                <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">ĐỘI BẢO TRÌ HÀNG RÀO ĐIỆN</div>
                <div style="font-size: 11pt; margin-top: 2px;">Số: ....../BB-VS</div>
              </td>
              <td style="width: 56%; text-align: center; vertical-align: top; padding: 0;">
                <div style="font-weight: bold; font-size: 11.5pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style="font-weight: bold; font-size: 12pt;">Độc lập - Tự do - Hạnh phúc</div>
                <div style="border-bottom: 1.5px solid #000; width: 150px; margin: 2px auto 4px auto;"></div>
                <div style="font-style: italic; font-size: 11.5pt;">
                  Đồng Nai, ngày ${ngayStr} tháng ${thangStr} năm ${namStr}
                </div>
              </td>
            </tr>
          </table>

          <!-- Tiêu đề -->
          <div style="text-align: center; margin: 6px 0 6px 0;">
            <div style="font-weight: bold; font-size: 13.5pt; text-transform: uppercase;">BIÊN BẢN</div>
            <div style="font-weight: bold; font-size: 11.5pt; margin-top: 2px; line-height: 1.25;">
              Ghi nhận kết quả thực hiện công việc tuyến hàng rào điện thuộc<br/>
              Dự án khẩn cấp bảo tồn Voi tỉnh Đồng Nai trên địa bàn quản lý của ${record.diaDiem || record.tuyenHrd || '…………………………………………….'}
            </div>
          </div>

          <!-- Căn cứ pháp lý -->
          <div style="text-align: justify; margin-bottom: 4px; font-style: italic; text-indent: 0.8cm; font-size: 11pt;">
            Thực hiện Quyết định số 704/QĐ-SNNMT ngày 30/6/2026 & Quyết định số 595/QĐ-SNNMT ngày 30/3/2026 của Sở Nông nghiệp và Môi trường về việc phê duyệt kế hoạch và dự toán nhiệm vụ “quản lý, bảo vệ và vận hành các công trình xây dựng để bảo tồn Voi châu Á tại Đồng Nai năm 2026" của Chi cục Kiểm lâm;
          </div>

          <div style="margin-bottom: 4px; text-indent: 0.8cm;">
            Hôm nay, ngày <b>${ngayStr}</b> tháng <b>${thangStr}</b> năm <b>${namStr}</b>, tại: <b>${record.diaDiem || record.tuyenHrd || '...........................................................................'}</b>, chúng tôi gồm:
          </div>

          <!-- I. Thành phần tham dự -->
          <div style="font-weight: bold; margin-top: 3px;">I. Thành phần tham dự</div>
          <div style="margin-left: 0.3cm; margin-bottom: 3px;">
            <div style="font-weight: bold;">1. Đại diện đơn vị bảo trì:</div>
            ${this.renderRepresentativeLines(record.daiDienBaoTri, record.ddBt)}
            <div style="font-weight: bold; margin-top: 2px;">2. Đại diện đơn vị chủ rừng:</div>
            ${this.renderRepresentativeLines(record.daiDienChuRung, record.ddCr)}
            <div style="font-weight: bold; margin-top: 2px;">3. Đại diện Cơ quan kiểm lâm sở tại:</div>
            ${this.renderRepresentativeLines(record.daiDienKiemLam, record.ddKl)}
            <div style="margin-top: 2px;">4. <b>Các cá nhân thực hiện phát dọn:</b> ${dsNhanCong}</div>
          </div>

          <!-- II. Nội dung ghi nhận kết quả vệ sinh -->
          <div style="font-weight: bold; margin-top: 4px;">II. Nội dung ghi nhận kết quả vệ sinh:</div>
          <div style="margin-left: 0.3cm; margin-bottom: 4px;">
            <div>- <b>Tuyến hàng rào được vệ sinh:</b> <b>${record.tuyenHrd || '...................................................'}</b></div>
            <div>- <b>Tổng chiều dài thực hiện:</b> <b>${record.tongChieuDai || '0'} m</b> | <b>Tổng diện tích phát dọn:</b> <b>${record.tongDienTich || '0'} m²</b> <i>(${((parseFloat(record.tongDienTich) || 0) / 10000).toFixed(4)} ha)</i></div>
            
            <div style="margin-top: 3px; font-weight: bold;">Chi tiết từng phân đoạn phát dọn:</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 2px; margin-bottom: 3px; font-size: 10.5pt;">
              <thead>
                <tr style="background: #f2f2f2;">
                  <th style="border: 1px solid #000; padding: 2px; width: 35px; text-align: center;">STT</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: center;">Phân đoạn trụ</th>
                  <th style="border: 1px solid #000; padding: 2px; width: 80px; text-align: center;">Chiều dài</th>
                  <th style="border: 1px solid #000; padding: 2px; width: 80px; text-align: center;">Bề rộng</th>
                  <th style="border: 1px solid #000; padding: 2px; width: 90px; text-align: center;">Diện tích</th>
                </tr>
              </thead>
              <tbody>${doanRows}</tbody>
            </table>
            <div>- <b>Đánh giá chất lượng vệ sinh:</b> Đã phát dọn sạch thực bì dưới hành lang dây điện, không còn cành cây chạm vào dây rào, thông thoáng và đảm bảo an toàn phóng điện ngăn Voi.</div>
          </div>

          <!-- III. Kết luận -->
          <div style="font-weight: bold; margin-top: 4px;">III. Kết luận</div>
          <div style="margin-left: 0.3cm;">
            <div style="text-indent: 0.6cm;">Các thành phần tham dự cùng thống nhất nghiệm thu khối lượng vệ sinh thực bì theo kế hoạch./.</div>
          </div>

          <!-- Chữ ký 3 bên -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 8px; text-align: center; page-break-inside: avoid;">
            <tr>
              <td style="width: 33.3%; font-weight: bold; vertical-align: top; font-size: 11pt;">
                ĐD. ĐƠN VỊ VỆ SINH<br/>TUYẾN HÀNG RÀO ĐIỆN<br/>
                <span style="font-size: 10pt; font-weight: normal; font-style: italic;">(Ký, ghi rõ họ tên)</span>
                <div style="height: 44px;"></div>
              </td>
              <td style="width: 33.3%; font-weight: bold; vertical-align: top; font-size: 11pt;">
                ĐD. ĐƠN VỊ CHỦ RỪNG<br/><br/>
                <span style="font-size: 10pt; font-weight: normal; font-style: italic;">(Ký, ghi rõ họ tên)</span>
                <div style="height: 44px;"></div>
              </td>
              <td style="width: 33.4%; font-weight: bold; vertical-align: top; font-size: 11pt;">
                ĐD. CƠ QUAN KIỂM LÂM SỞ TẠI<br/><br/>
                <span style="font-size: 10pt; font-weight: normal; font-style: italic;">(Ký, ghi rõ họ tên)</span>
                <div style="height: 44px;"></div>
              </td>
            </tr>
          </table>
        </div>
        ${photosHTML}
      </div>
    `;
  },

  /**
   * Render HTML Mẫu Nhật Ký Thi Công (Chuẩn theo file mau-nhat-ky-thi-cong 01.doc)
   */
  renderNhatKyHTML(record) {
    const ngayParts = (record.ngayGhi || '').split('-');
    const ngayStr = ngayParts.length === 3 ? ngayParts[2] : '.....';
    const thangStr = ngayParts.length === 3 ? ngayParts[1] : '.....';
    const namStr = ngayParts.length === 3 ? ngayParts[0] : '2026';

    const thietBiListStr = (record.dsThietBi && record.dsThietBi.length > 0) 
      ? record.dsThietBi.map(t => `${t.name}: ${t.quantity}`).join('; ') 
      : 'Máy phát điện xăng, máy cắt cỏ, máy đo xung điện, kẹp néo chuyên dụng...';

    const nhanCongListStr = (record.dsNhanCong && record.dsNhanCong.length > 0) 
      ? record.dsNhanCong.map(n => `${n.role}: ${n.count} người`).join('; ') 
      : 'Cán bộ kỹ thuật: 1 người; Công nhân kỹ thuật: 3 người; Lao động phát dọn: 6 người';

    return `
      <div class="a4-document-content" style="font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.35; color: #000000; background: #ffffff; text-align: justify;">
        <!-- Tiêu đề -->
        <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 8px;">
          <div style="font-weight: bold; font-size: 15pt; text-transform: uppercase;">NHẬT KÝ THI CÔNG XÂY DỰNG CÔNG TRÌNH</div>
          <div style="font-size: 12pt; font-weight: bold; margin-top: 3px;">HẠNG MỤC: ${record.hangMuc || 'QUẢN LÝ BẢO VỆ VÀ VẬN HÀNH HÀNG RÀO ĐIỆN BẢO TỒN VOI'}</div>
          <div style="font-style: italic; font-size: 11pt;">Địa điểm: ${record.diaDiem || 'Tỉnh Đồng Nai'}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12pt;">
          <tr>
            <td style="width: 25%; font-weight: bold;">Chủ đầu tư:</td>
            <td>${record.chuDauTu || 'Chi cục Kiểm lâm Tỉnh Đồng Nai'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Tư vấn giám sát:</td>
            <td>${record.tuVanGiamSat || 'Ban Quản lý Dự án Bảo tồn Voi Đồng Nai'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Nhà thầu thi công:</td>
            <td>${record.nhaThauThiCong || 'Đội Bảo trì & Vận hành Tuyến Hàng rào điện'}</td>
          </tr>
        </table>

        <div style="background: #f2f2f2; padding: 6px 10px; font-weight: bold; border: 1px solid #333; margin-bottom: 10px; font-size: 12pt;">
          NGÀY: ${ngayStr} THÁNG ${thangStr} NĂM ${namStr} | THỜI TIẾT: ${record.thoiTiet || 'Nắng ráo, thuận lợi'}
        </div>

        <div style="font-weight: bold;">1. TÌNH HÌNH THIẾT BỊ & NHÂN CÔNG:</div>
        <div style="margin-left: 0.5cm; margin-bottom: 8px;">
          <div>- <b>1.1 Thiết bị thi công:</b> ${thietBiListStr}</div>
          <div>- <b>1.2 Nhân công:</b> ${nhanCongListStr}</div>
        </div>

        <div style="font-weight: bold;">2. CÔNG VIỆC THỰC HIỆN TRONG NGÀY:</div>
        <div style="margin-left: 0.5cm; margin-bottom: 8px; border: 1px solid #666; padding: 8px; min-height: 80px; font-size: 12pt; background: #fafafa;">
          ${(record.noiDungCongViec || '').replace(/\n/g, '<br/>') || 'Tiến hành kiểm tra dọc tuyến, phát dọn thực bì hành lang dây điện và kiểm tra các vị trí xung yếu ngăn Voi.'}
        </div>

        <div style="font-weight: bold;">3. NHẬN XÉT ĐÁNH GIÁ CỦA PHỤ TRÁCH GIÁM SÁT HOẶC CHỦ ĐẦU TƯ:</div>
        <div style="margin-left: 0.5cm; margin-bottom: 8px;">
          <div>- <b>3.1 Công tác vệ sinh môi trường:</b> Đạt yêu cầu kỹ thuật.</div>
          <div>- <b>3.2 Công tác an toàn lao động:</b> Đảm bảo an toàn tuyệt đối.</div>
          <div style="margin-top: 4px; border: 1px solid #666; padding: 8px; min-height: 60px; font-size: 12pt; background: #fafafa;">
            ${(record.danhGiaGiamSat || '').replace(/\n/g, '<br/>') || 'Công tác thi công đảm bảo tiến độ và chất lượng theo yêu cầu của Chủ đầu tư.'}
          </div>
        </div>

        <div style="font-weight: bold;">4. Ý KIẾN TIẾP THU CỦA NHÀ THẦU / ĐƠN VỊ THI CÔNG:</div>
        <div style="margin-left: 0.5cm; margin-bottom: 12px; font-style: italic;">
          Đơn vị thi công nghiêm túc tiếp thu các ý kiến chỉ đạo của Tư vấn giám sát và Chủ đầu tư.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: center;">
          <tr>
            <td style="width: 50%; font-weight: bold; vertical-align: top; font-size: 12pt;">
              CÁN BỘ PHỤ TRÁCH THI CÔNG<br/>
              <span style="font-size: 11pt; font-weight: normal; font-style: italic;">(Ký, ghi rõ họ tên)</span>
              <div style="height: 75px;"></div>
            </td>
            <td style="width: 50%; font-weight: bold; vertical-align: top; font-size: 12pt;">
              CÁN BỘ GIÁM SÁT / CHỦ ĐẦU TƯ<br/>
              <span style="font-size: 11pt; font-weight: normal; font-style: italic;">(Ký, ghi rõ họ tên)</span>
              <div style="height: 75px;"></div>
            </td>
          </tr>
        </table>
      </div>
    `;
  },

  /**
   * Mở Modal Xem Trước Khổ A4 trước khi in / xuất PDF
   */
  openPreviewModal(formType, record) {
    this.currentFormType = formType;
    this.currentRecord = record;

    let htmlContent = '';
    let titleText = 'Biên Bản QLBV Khổ A4';

    if (formType === 'baotri') {
      htmlContent = this.renderBaoTriHTML(record);
      titleText = 'Xem Trước: Biên Bản Bảo Trì Sự Cố';
    } else if (formType === 'vesinh') {
      htmlContent = this.renderVeSinhHTML(record);
      titleText = 'Xem Trước: Biên Bản Vệ Sinh Phát Dọn';
    } else if (formType === 'nhatky') {
      htmlContent = this.renderNhatKyHTML(record);
      titleText = 'Xem Trước: Nhật Ký Thi Công';
    }

    const modal = document.getElementById('pdf-preview-modal');
    const titleEl = document.getElementById('pdf-preview-title');
    const bodyEl = document.getElementById('pdf-preview-sheet');

    if (titleEl) titleEl.textContent = titleText;
    if (bodyEl) bodyEl.innerHTML = htmlContent;

    if (modal) {
      modal.classList.add('active');
    } else {
      // Fallback nếu chưa có modal
      this.exportToPDF(formType, record);
    }
  },

  /**
   * Đóng Modal Xem Trước
   */
  getDocumentPdfFileName(formType) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ddmmyyyy = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}`;
    const hhmmss = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const ts = `${ddmmyyyy}_${hhmmss}`;

    if (formType === 'baotri') return `BienBan_BaoTri_${ts}`;
    if (formType === 'vesinh') return `BienBan_VeSinh_${ts}`;
    if (formType === 'nhatky') return `NhatKy_ThiCong_${ts}`;
    return `BienBan_${ts}`;
  },

  /**
   * Xem trước và In ấn trực tiếp qua hộp thoại in của trình duyệt (trên PC hoặc Mobile)
   */
  printRecord(formType, record) {
    const r = record || this.currentRecord;
    const f = formType || this.currentFormType;
    if (!r || !f) return;

    const fileName = this.getDocumentPdfFileName(f);
    const originalTitle = document.title;
    document.title = fileName;

    let htmlContent = '';
    if (f === 'baotri') htmlContent = this.renderBaoTriHTML(r);
    else if (f === 'vesinh') htmlContent = this.renderVeSinhHTML(r);
    else if (f === 'nhatky') htmlContent = this.renderNhatKyHTML(r);

    let printArea = document.getElementById('printable-area');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'printable-area';
      document.body.appendChild(printArea);
    }
    printArea.innerHTML = htmlContent;

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);

    // Trigger hộp thoại in của trình duyệt
    setTimeout(() => {
      window.print();
      setTimeout(restoreTitle, 3000);
    }, 150);
  },

  /**
   * Xuất file PDF tải về máy (Hoạt động hoàn hảo trên cả Điện thoại và Máy tính)
   */
  exportToPDF(formType, record, customFilename) {
    const r = record || this.currentRecord;
    const f = formType || this.currentFormType;
    if (!r || !f) return;

    let htmlContent = '';
    let defaultFilename = `${this.getDocumentPdfFileName(f)}.pdf`;

    if (f === 'baotri') {
      htmlContent = this.renderBaoTriHTML(r);
    } else if (f === 'vesinh') {
      htmlContent = this.renderVeSinhHTML(r);
    } else if (f === 'nhatky') {
      htmlContent = this.renderNhatKyHTML(r);
    }

    const filename = customFilename || defaultFilename;

    // Hiển thị thông báo đang xử lý
    if (window.App && typeof window.App.showToast === 'function') {
      window.App.showToast('⏳ Đang tạo file PDF khổ A4, vui lòng đợi...');
    }

    // Tạo container render chuyên biệt với chiều rộng chuẩn A4 (794px = 210mm @ 96dpi)
    const renderContainer = document.createElement('div');
    renderContainer.id = 'pdf-export-worker-container';
    renderContainer.style.position = 'fixed';
    renderContainer.style.left = '-9999px';
    renderContainer.style.top = '0';
    renderContainer.style.width = '794px';
    renderContainer.style.padding = '20mm 20mm 20mm 20mm'; // Lề A4 chuẩn 2.0cm cả 4 phía
    renderContainer.style.background = '#ffffff';
    renderContainer.style.color = '#000000';
    renderContainer.style.boxSizing = 'border-box';
    renderContainer.innerHTML = htmlContent;

    document.body.appendChild(renderContainer);

    const opt = {
      margin: [20, 20, 20, 20], // mm: Top, Right, Bottom, Left (2.0cm chuẩn)
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        windowWidth: 794
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(renderContainer).save().then(() => {
        if (renderContainer.parentNode) {
          renderContainer.parentNode.removeChild(renderContainer);
        }
        if (window.App && typeof window.App.showToast === 'function') {
          window.App.showToast('Đã xuất file PDF A4 thành công!');
        }
      }).catch(err => {
        console.error('Lỗi tạo PDF:', err);
        if (renderContainer.parentNode) {
          renderContainer.parentNode.removeChild(renderContainer);
        }
        // Fallback mở in trình duyệt
        this.printRecord(f, r);
      });
    } else {
      // Dự phòng nếu không tải được thư viện html2pdf
      this.printRecord(f, r);
      if (renderContainer.parentNode) {
        renderContainer.parentNode.removeChild(renderContainer);
      }
    }
  }
};
