# Lớp thương hiệu cho bpmn.io (form-js & bpmn-js)

Skin thương hiệu VHT cho các bộ công cụ bpmn.io (Camunda), **không sửa nội tại
thư viện**. Tách 3 file:

| File | Vai trò |
|---|---|
| `tokens.css` | **Một nguồn** token brand (`--vht-*`): màu, mực, viền, bo góc. Nạp global ở `main.tsx`. |
| `bpmnio-skin.css` | Map token → biến CSS của form-js (`--cds-*` Carbon, `--color-*`) + ít polish class, scope dưới lớp bọc. |
| `translate-vi.ts` | Module `translate` (didi) Việt hoá nhãn palette/thuộc tính — best-effort. |

## Cách hoạt động

form-js/bpmn-js đọc màu từ **biến CSS** đặt trên phần tử cha. Ta bọc canvas trong
một class rồi gán đè biến trên class đó — cascade xuống toàn bộ `.fjs-*`/`.djs-*`
mà không đụng class nội bộ (an toàn khi nâng cấp minor).

| Lớp bọc | Dùng cho | Prefix nội bộ |
|---|---|---|
| `.vht-designer` | form-js **editor** (FormDesigner) | `.fjs-*`, `.bio-*` |
| `.vht-form` | form-js **viewer** (FormRenderer, preview + runtime) | `.fjs-*` |
| `.vht-diagram` | **bpmn-js** (BPMN editor — CHƯA kích hoạt) | `.djs-*` |

## Khi dựng BPMN editor (Tạo mới quy trình)

1. Bọc canvas bpmn-js trong `<div className="vht-diagram">`.
2. Mở khối `.vht-diagram { ... }` đã chừa sẵn ở cuối `bpmnio-skin.css`.
3. Nạp `TranslateViModule` vào `additionalModules` của `BpmnModeler` (cùng chuẩn
   didi như form-js) để Việt hoá palette/context-pad.
4. Token vẫn lấy từ `--vht-*` — đổi màu brand một chỗ, cả form-js lẫn bpmn-js đổi theo.

## Ràng buộc

- Mọi override gom trong `bpmnio-skin.css`, **scope chặt** dưới lớp bọc.
- Hạn chế `!important` (chỉ dùng cho SVG stroke của bpmn-js khi bắt buộc).
- Pin version `@bpmn-io/form-js` (hiện `1.23.x`) — class nội bộ có thể đổi ở major.
