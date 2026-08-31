/**
 * MODULE LƯU TRỮ OFFLINE & ĐỒNG BỘ DỮ LIỆU (OFFLINE-FIRST & SYNC)
 */
const StorageService = {
  OFFLINE_KEY: 'qlbv_pending_sync_records',
  SAVED_RECORDS_KEY: 'qlbv_local_saved_records',

  /**
   * Lưu bản ghi vào hàng đợi Offline
   */
  saveOffline(formType, recordData, username) {
    const queue = this.getOfflineQueue();
    const item = {
      id: 'OFFLINE_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      formType: formType,
      record: recordData,
      username: username,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    queue.push(item);
    localStorage.setItem(this.OFFLINE_KEY, JSON.stringify(queue));
    
    // Đồng thời lưu vào danh sách bản ghi cục bộ
    this.saveToLocalHistory(item);
    return item;
  },

  getOfflineQueue() {
    try {
      return JSON.parse(localStorage.getItem(this.OFFLINE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  },

  /**
   * Lưu vào lịch sử cục bộ
   */
  saveToLocalHistory(recordItem) {
    try {
      const history = JSON.parse(localStorage.getItem(this.SAVED_RECORDS_KEY) || '[]');
      // Thêm lên đầu
      history.unshift(recordItem);
      // Giữ tối đa 100 bản ghi
      if (history.length > 100) history.pop();
      localStorage.setItem(this.SAVED_RECORDS_KEY, JSON.stringify(history));
    } catch (e) {}
  },

  getLocalHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.SAVED_RECORDS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  },

  /**
   * Đồng bộ tất cả bản ghi offline lên Google Sheets khi có mạng
   */
  async syncAllPending(onProgressCallback) {
    if (!QLBV_CONFIG.APPS_SCRIPT_URL || !navigator.onLine) {
      return { success: false, message: "Không có kết nối mạng hoặc chưa cấu hình URL Apps Script" };
    }

    const queue = this.getOfflineQueue();
    if (queue.length === 0) {
      return { success: true, count: 0, message: "Không có bản ghi nào cần đồng bộ" };
    }

    let syncedCount = 0;
    const remaining = [];

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (onProgressCallback) onProgressCallback(i + 1, queue.length);

      try {
        const res = await fetch(QLBV_CONFIG.APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveRecord',
            formType: item.formType,
            record: item.record,
            username: item.username
          })
        });
        const result = await res.json();
        if (result.success) {
          syncedCount++;
        } else {
          remaining.push(item);
        }
      } catch (err) {
        remaining.push(item);
      }
    }

    localStorage.setItem(this.OFFLINE_KEY, JSON.stringify(remaining));
    return {
      success: true,
      syncedCount: syncedCount,
      remainingCount: remaining.length,
      message: `Đã đồng bộ thành công ${syncedCount}/${queue.length} bản ghi!`
    };
  }
};
