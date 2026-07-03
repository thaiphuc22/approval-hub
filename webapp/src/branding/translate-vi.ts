/*
 * Module `translate` cho bpmn.io — Việt hoá nhãn (best-effort) cho palette và
 * properties panel của form-js. Không thay renderer, chỉ dịch chuỗi hiển thị.
 *
 * Cơ chế: form-js/diagram-js gọi service `translate(template, replacements)`.
 * Ta cung cấp module ghi đè service này (theo chuẩn didi DI). Chuỗi không có
 * trong từ điển sẽ giữ nguyên tiếng Anh (an toàn, không vỡ UI).
 */

/**
 * Từ điển Anh → Việt DÙNG CHUNG cho: (1) module translate (chuỗi nào form-js
 * định tuyến qua translate), và (2) relabel DOM (palette + properties panel —
 * các nhãn render thẳng, không qua translate). Xem `relabel-vi.ts`.
 * Khớp CHÍNH XÁC (đã trim); chuỗi không có trong từ điển giữ nguyên (an toàn).
 */
export const VI_DICT: Record<string, string> = {
  // ── Palette: nhóm + ô tìm kiếm ──────────────────────────────
  Components: 'Thành phần',
  Search: 'Tìm kiếm',
  'Search components': 'Tìm thành phần',
  'Basic input': 'Nhập cơ bản',
  Selection: 'Lựa chọn',
  Presentation: 'Trình bày',
  Containers: 'Vùng chứa',
  Action: 'Hành động',

  // ── Palette: các loại field (label từ form-js-viewer) ───────
  'Text field': 'Trường văn bản',
  'Text area': 'Vùng văn bản',
  Number: 'Số',
  Date: 'Ngày',
  'Date time': 'Ngày / giờ',
  Datetime: 'Ngày / giờ',
  Checkbox: 'Ô kiểm',
  'Checkbox group': 'Nhóm ô kiểm',
  'Radio group': 'Nhóm chọn (Radio)',
  Radio: 'Chọn một (Radio)',
  Checklist: 'Danh sách kiểm',
  Select: 'Danh sách chọn',
  'Tag list': 'Danh sách thẻ',
  Taglist: 'Danh sách thẻ',
  'Text view': 'Văn bản hiển thị',
  'HTML view': 'Khối HTML',
  HTML: 'Khối HTML',
  'Image view': 'Hình ảnh',
  Image: 'Hình ảnh',
  Table: 'Bảng',
  Button: 'Nút',
  Group: 'Nhóm',
  'Dynamic list': 'Danh sách động',
  Spacer: 'Khoảng trống',
  Separator: 'Đường phân cách',
  'Expression field': 'Trường biểu thức',
  'File picker': 'Chọn tệp',
  iFrame: 'IFrame',
  IFrame: 'IFrame',
  'Document preview': 'Xem tài liệu',

  // ── Properties panel: nhóm & trường hay gặp ─────────────────
  General: 'Chung',
  'Field label': 'Nhãn trường',
  Key: 'Khoá (key)',
  ID: 'ID',
  Description: 'Mô tả',
  'Default value': 'Giá trị mặc định',
  Layout: 'Bố cục',
  Validation: 'Ràng buộc',
  Required: 'Bắt buộc',
  'Read only': 'Chỉ đọc',
  Disabled: 'Vô hiệu hoá',
  Options: 'Tùy chọn',
  'Options source': 'Nguồn tùy chọn',
  'Static options': 'Danh sách cố định',
  Condition: 'Điều kiện',
  'Hide if': 'Ẩn nếu',
  Appearance: 'Giao diện',
  Serialization: 'Tuần tự hoá',
  Constraints: 'Ràng buộc',
  Value: 'Giá trị',
  Label: 'Nhãn',
  Text: 'Nội dung',
  Columns: 'Cột',
  'Custom properties': 'Thuộc tính tuỳ biến',
  Properties: 'Thuộc tính',

  // ── BPMN (bpmn-js) — palette, context-pad, tooltip ──────────
  // bpmn-js dùng service translate chuẩn nên các chuỗi này dịch được ngay.
  'Activate hand tool': 'Công cụ di chuyển (hand)',
  'Activate lasso tool': 'Công cụ chọn vùng (lasso)',
  'Activate create/remove space tool': 'Công cụ thêm/bớt khoảng cách',
  'Activate global connect tool': 'Công cụ nối phần tử',
  'Create start event': 'Sự kiện bắt đầu',
  'Create end event': 'Sự kiện kết thúc',
  'Create task': 'Tác vụ (Task)',
  'Create gateway': 'Cổng rẽ nhánh (Gateway)',
  'Create intermediate/boundary event': 'Sự kiện trung gian / biên',
  'Create expanded sub-process': 'Tiến trình con',
  'Create pool/participant': 'Pool / Bên tham gia',
  'Create group': 'Nhóm (Group)',
  'Create data object reference': 'Đối tượng dữ liệu',
  'Create data store reference': 'Kho dữ liệu',
  'Append task': 'Nối thêm Task',
  'Append gateway': 'Nối thêm Gateway',
  'Append end event': 'Nối thêm Sự kiện kết thúc',
  'Append intermediate/boundary event': 'Nối thêm Sự kiện trung gian / biên',
  'Append receive task': 'Nối thêm Task nhận',
  'Append text annotation': 'Nối thêm chú thích',
  'Add text annotation': 'Thêm chú thích',
  'Append compensation activity': 'Nối thêm hoạt động bù trừ',
  'Append conditional intermediate catch event': 'Nối thêm sự kiện bắt có điều kiện',
  'Append message intermediate catch event': 'Nối thêm sự kiện bắt tin nhắn',
  'Append signal intermediate catch event': 'Nối thêm sự kiện bắt tín hiệu',
  'Append timer intermediate catch event': 'Nối thêm sự kiện hẹn giờ',
  'Change element': 'Đổi loại phần tử',
  'Connect to other element': 'Nối tới phần tử khác',
  'Connect using association': 'Nối bằng liên kết (association)',
  'Connect using data input association': 'Nối bằng liên kết dữ liệu vào',
  Delete: 'Xoá',
  Remove: 'Xoá',
  'Add lane above': 'Thêm lane phía trên',
  'Add lane below': 'Thêm lane phía dưới',
  'Divide into two lanes': 'Chia thành 2 lane',
  'Divide into three lanes': 'Chia thành 3 lane',
}

/** Bí danh nội bộ để phần dưới file dùng ngắn gọn. */
const DICT = VI_DICT

export function translateVi(template: string, replacements?: Record<string, string>): string {
  const msg = DICT[template] ?? template
  return msg.replace(/{([^}]+)}/g, (_m, key: string) =>
    replacements && key in replacements ? String(replacements[key]) : '{' + key + '}',
  )
}

/** Module didi ghi đè service `translate`. Nạp qua additionalModules của FormEditor/Form. */
export const TranslateViModule = {
  translate: ['value', translateVi],
}
