/**
 * BUILD backend/Index.html TỪ ỨNG DỤNG GỐC
 * ---------------------------------------------------------------------------
 * Google Apps Script chỉ nhận được MỘT file HTML duy nhất, nên bản chạy trên
 * Apps Script phải gộp sẵn CSS + JS vào trong file. Trước đây file này được
 * chép tay nên luôn bị lệch với bản web (sửa bên này không thấy đổi bên kia).
 *
 * Chạy: node build_backend.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'backend', 'Index.html');

// Ảnh cục bộ không dùng được trên Apps Script -> trỏ về ảnh trên GitHub
const RAW = 'https://raw.githubusercontent.com/locvutrunglvt/QLBV_aSU/main';

function read(p) {
  return fs.readFileSync(path.join(ROOT, p), 'utf8');
}

let html = read('index.html');

// 1. Nhúng thẳng stylesheet
const css = read('css/style.css');
html = html.replace(
  /[ \t]*<link rel="stylesheet" href="css\/style\.css" \/>/,
  '  <style>\n' + css + '\n  </style>'
);

// 2. Nhúng thẳng toàn bộ script theo đúng thứ tự khai báo trong index.html
const scriptTags = [...html.matchAll(/[ \t]*<script src="(js\/[^"]+)"><\/script>\n?/g)];
if (scriptTags.length === 0) throw new Error('Không tìm thấy thẻ <script src="js/...">');

const bundle = scriptTags
  .map(m => '  <script>\n/* ===== ' + m[1] + ' ===== */\n' + read(m[1]) + '\n  </script>')
  .join('\n');

html = html.replace(scriptTags[0][0], bundle + '\n');
for (const m of scriptTags.slice(1)) html = html.replace(m[0], '');

// 3. Bỏ những thứ chỉ chạy được khi host tĩnh (PWA manifest + service worker)
html = html.replace(/[ \t]*<link rel="manifest"[^>]*>\n?/g, '');
html = html.replace(
  /[ \t]*<!-- PWA Service Worker Registration -->[\s\S]*?<\/script>\n/,
  '  <!-- Service Worker bị bỏ qua: Apps Script không phục vụ được sw.js -->\n'
);

// 4. Đổi đường dẫn ảnh cục bộ sang URL tuyệt đối
html = html.replace(/(src|href)="(icons\/[^"]+)"/g, (m, attr, p) => `${attr}="${RAW}/${p}"`);
html = html.replace(/(href)="(favicon\.[^"]+)"/g, (m, attr, p) => `${attr}="${RAW}/${p}"`);

// 5. Apps Script hiểu "<?" là scriptlet -> phải chắc chắn không có
if (html.includes('<?')) throw new Error('File chứa "<?" sẽ làm Apps Script báo lỗi template');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html, 'utf8');

console.log('Đã tạo backend/Index.html (%d KB) từ index.html + css + %d file js',
  Math.round(html.length / 1024), scriptTags.length);
