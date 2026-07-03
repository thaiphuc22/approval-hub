# Project State (LITE)

> Single-file state for small projects. This replaces the three-file full harness
> (`DELIVERY_STATE.md` + `active-task.md` + `decisions.md`). Keep it short and current.
> The SessionStart hook reads this file and injects a digest every session.

**Last updated**: 2026-07-03

---

## Now

**F1 — Requirements Baseline (BA):** ĐÃ HOÀN TẤT bóc tách toàn tài liệu RD01–RD10 (~79 requirements,
18 open questions, 9 assumptions) qua 3 file:
- `docs/req/RD01-RD02-requirements.md`
- `docs/req/RD03-RD06-requirements.md`
- `docs/req/RD07-RD10-requirements.md`

Đã dựng **backlog đợt 1** (Epic theo phân hệ): `docs/req/EPIC-QLNVKHCN-backlog.md` —
Epic EP-05 (QL NV KHCN) → 3 Feature (RD01/RD02/RD05) → 20 User Story (INVEST) + AC Gherkin (102 điểm;
10 US-ready, 10 US gắn cờ blocker OQ-001/002/003/006).

Đã đào sâu **AC cho 10 US-ready** → `docs/req/EPIC-QLNVKHCN-AC.md` (55 AC: 12 negative + 12 edge;
gắn cờ 12 AC treo OQ-002, ~18 AC treo OQ-006).

Đã có **RTM** (`docs/req/RTM.md`) + tóm tắt scope 2 phân hệ (`docs/req/scope-2-phanhe.md`).
RTM chỉ ra: coverage end-to-end ~25–30%; **phân hệ QL Quy trình under-specified** (P1/P3/P6/P8/P9
là orphan — engine chưa có Requirement riêng); RD06/RD08 đứt chain.

Đã bóc **engine Camunda + NFR** → `docs/req/ENGINE-NFR-requirements.md` (15 REQ-ENG + 12 NFR + REQ-AI);
lấp orphan P1/P3/P6/P8/P9 (RTM đã cập nhật 🔴→🟠). ⚠️ đợt suy dẫn (conf 0.58) — chờ khách/F2 xác nhận.

**F2 (Kiến trúc) đã khởi động (DRAFT):** `docs/arch/camunda-design.md` — chốt hướng dùng Camunda 8
(orchestration layer, UI custom, ranh giới BPMN↔code, 1 process/RD, DMN). License đã RESOLVED; chưa lock cứng
(còn OQ-002/006/021/009 + OQ-CAM-DEPLOY/COMPONENTS). Bổ sung `docs/arch/camunda-integration-explained.md` —
giải thích topology triển khai **Self-Managed trên K8s VHT** + cơ chế BE↔Camunda (4 kênh gRPC/REST, OAuth2
client-credentials, long-poll job worker, checklist bàn giao khách→dự án).

**F3 Scaffold (IN PROGRESS):** `webapp/` — React+TS+Vite+AntD, mock data. Đã có:
- **Đăng nhập / Đăng xuất (mock)**: `store/AuthContext` (login/logout, giữ phiên qua localStorage `qtkhcn.auth.email`), màn `pages/Login.tsx` (form Email+Mật khẩu bên trái + card "Tài khoản demo" bên phải, **mật khẩu chung `123456`**, nút "Điền nhanh" fill sẵn). App gate: chưa đăng nhập → `<Login/>`, không dựng layout. Header hiển thị đúng user đang đăng nhập (họ tên/chức danh/avatar chữ cái đầu) + **Dropdown → Đăng xuất**. Data mock dùng chung `data/users.ts` (thêm `chucDanh`, `DEMO_PASSWORD`, `findUserByEmail`). Xác thực thật (SSO/IAM) để F2/F4.
- `/quy-trinh` — màn Danh mục quy trình (Table/lọc/KPI/tạo mới), click dòng → chi tiết
- `/quy-trinh/moi` — **Tạo mới quy trình + canvas vẽ BPMN thật** (`bpmn-js` BpmnModeler + **Properties Panel Camunda 8/Zeebe** `bpmn-js-properties-panel` + `zeebe-bpmn-moddle`, lazy-load chunk riêng). **Layout kiểu Camunda Modeler**: section trên = Thông tin chung (form); section dưới = canvas toàn vùng — palette nổi trái, **Properties Panel dock phải** (đóng/mở được; gồm nhóm gốc + **nhóm custom "Biểu mẫu KHCN"** `src/bpmn/khcnFormModule.ts` — dropdown chọn formKey TỪ ĐÚNG thư viện, ghi `zeebe:FormDefinition.formKey` — + **nhóm custom "Phân công (KHCN)"** `src/bpmn/khcnAssignmentModule.ts` — dropdown chọn **vai trò phụ trách** từ `src/data/roles.ts` (26 nhóm tác nhân rút từ RD01–RD10) ghi `zeebe:AssignmentDefinition.candidateGroups` + ô `assignee`; đây là **P0** theo `docs/req/bpmn-components-danh-gia.md`), **toolbar nổi góc dưới-phải** (thu nhỏ/phóng to/vừa màn hình/minimap `diagram-js-minimap` góc dưới-trái/toàn màn hình). Lưu (kèm `bpmnXml` vào ProcessDef) hoặc Tải `.bpmn`. Palette/context-pad Việt hoá qua `TranslateViModule` (bpmn-js translate chuẩn), nhãn properties panel Việt hoá qua `observeViLabels`, skin đỏ VHT qua `.vht-diagram`/`.vht-designer`. Tái dùng nguyên lớp `src/branding/`.
- `/quy-trinh/:ma` — Chi tiết & Chỉnh sửa (Tabs): **tab "Thông tin"** (view↔edit, kích hoạt, deploy phiên bản) + **tab "Biểu mẫu theo bước"** (gán eForm formKey/User Task) + **tab "Sơ đồ BPMN"** — xem canvas **read-only** (`BpmnViewer` = NavigatedViewer, `components/BpmnViewer.tsx`) hoặc **Chỉnh sửa sơ đồ** → `BpmnEditor` đầy đủ (palette+panel) → Lưu ghi `bpmnXml` vào ProcessDef. Toolbar zoom/minimap/fullscreen tách dùng chung `components/DiagramToolbar.tsx`. Cả viewer/editor lazy-load, chia sẻ chung bpmn-js core.
- `/bieu-mau` — **Thư viện biểu mẫu (CRUD)**: bảng biểu mẫu (số trường, số bước đang dùng), tạo mới, **thiết kế bằng form-js Designer thật** (`FormEditor` kéo–thả, lazy-load chunk riêng), xem trước, xoá. Nguồn sống = `store/FormContext` (single source) → sửa form propagate mọi nơi (ProcessDetail, Worklist, hồ sơ).
- `/viec-cua-toi` — **Worklist "Việc của tôi"** (task chờ xử lý, hạn/quá hạn, badge menu). Nút "Xử lý" mở **eForm Camunda Forms thật** (`@bpmn-io/form-js`) — Phiếu nhận xét/góp ý → kết luận đẩy phê duyệt/trả lại.
- `/nhiem-vu` — **Danh sách Nhiệm vụ KHCN (master)**: bảng NV (mã/tên/cấp/chủ nhiệm/dự toán/giai đoạn/số hồ sơ), lọc theo cấp + giai đoạn + tìm, KPI. Menu "Quản lý NV KHCN" nay trỏ vào đây (nút "Danh sách hồ sơ" → /ho-so; nút **"Tạo Nhiệm vụ KHCN mới"** → /nhiem-vu/moi).
- `/nhiem-vu/moi` — **Tạo NV mới** (đúng trình tự RD01): form thông tin chung NV + chủ nhiệm → `create()` sinh NV (giai đoạn=chủ trương, mã tạm RD.2026.NNN) **đồng thời** khởi tạo **hồ sơ Chủ trương** (`createChuTruongHoSo`, CS→RD01.01 / TĐ→RD01.02, bước "Khởi tạo" done, chờ ký duyệt TT/Khối) → điều hướng sang chi tiết NV. Nguồn state: `store/NhiemVuContext` (NV master, state hoá) + `DossierContext.createHoSo`; `joinDossiers` nhận resolver động.
- `/nhiem-vu/:ma` — **Chi tiết Nhiệm vụ**: thông tin NV + chủ nhiệm (chi tiết), **Steps vòng đời Chủ trương→Xét duyệt→Thực hiện→Điều chỉnh→Nghiệm thu→Quyết toán** (đánh dấu giai đoạn có hồ sơ + trạng thái, highlight "Hiện tại"), và **bảng TẤT CẢ hồ sơ thuộc NV** → click sang /ho-so/:id. Minh hoạ 1 NV–N Hồ sơ rõ nhất (`RD.2026.012`).
- `/ho-so` — Danh sách hồ sơ NV KHCN (lọc theo trạng thái) → click → chi tiết
- `/nguoi-dung` — **Quản trị người dùng** (mockup): bảng người dùng (Họ tên+avatar, Email, Đơn vị, Vai trò dạng tag xanh), lọc theo tên/email/đơn vị + theo vai trò, KPI (người dùng/vai trò/đang hoạt động), nút "Thêm người dùng" + Sửa/Khoá (chưa nối hành động). Data mock `src/data/users.ts` (8 user, `ALL_ROLES`). Menu sidebar đổi "Phân quyền" (disabled) → **"Quản trị người dùng"** (KeyOutlined, đã bật). Tiền đề cho F4 (RBAC).
- **Cụm "Vận hành & Tích hợp"** (submenu mới, mockup điểm chạm Camunda — mock-data `data/camundaOps.ts`): thể hiện 2 seam trong `docs/arch/camunda-design.md` để demo viễn cảnh khi khách đã có license.
  - `/giam-sat` — **Giám sát tiến trình luồng** (Operate custom, Seam A App↔Camunda): KPI (đang chạy/quá hạn/incident/hoàn tất) + bảng process instance (instance key · mã hồ sơ · quy trình+ver · bước hiện tại · trạng thái active/incident/completed/canceled · quá hạn), click → modal chi tiết (nhấn mạnh D3: process chỉ giữ maHoSo + biến điều khiển). 1 instance incident (SAP 504) nối sang màn Tích hợp.
  - `/tich-hop` — **Trạng thái tích hợp hệ ngoài** (Seam B Camunda↔ngoài): **sức khoẻ tổng thể** (snapshot) — lưới 6 thẻ hệ (QLNS·MS·SAP·QLTS·PLM·SSO/IAM) — giao thức, kiểu connector/job-worker/IdP, sync realtime/batch, bản ghi/lỗi 24h, độ trễ, hàng đợi, đèn trạng thái. (Bảng "job worker gần đây" đã **chuyển sang /nhat-ky** — link chéo tới đó.)
  - `/nhat-ky` — **Nhật ký** (hub history, **2 tab**): tab *Nhật ký luồng* = per-hồ sơ, antd Timeline chấm màu (start·task·gateway/DMN·service task·timer·incident·end) + KPI; tab *Nhật ký tích hợp* = cross-hồ sơ, bảng job worker (lọc hệ + kết quả, KPI thất bại/thử lại). Tách trục: /tich-hop = "trạng thái" (snapshot), /nhat-ky = "nhật ký" (lịch sử luồng + tích hợp). Audit lớp điều phối vs audit nội dung (REQ-ENG-014).
- `/ho-so/:id` — **Chi tiết hồ sơ + Timeline phê duyệt** (Steps ngang + Timeline dọc; nút Phê duyệt/Từ chối đẩy luồng) + **card "Văn bản đầu ra"** — sinh văn bản hành chính (QĐ/Biên bản/Báo cáo) từ template theo quy trình → xem trước A4 + **In / Lưu PDF** (`window.print`). Đây là tầng-2 của D6 (văn bản đầu ra ≠ eForm nhập liệu).
- **Layout chuẩn** (App.tsx): Sider **cố định** (không cuộn theo), Header **sticky** (không mất khi cuộn), nút thu/mở menu ở **header** (bỏ trigger đáy sider). Breadcrumb gộp về **một nơi ở header** qua `BreadcrumbContext` (trang set qua PageHeader → header hiển thị, có thể ngắt 2 dòng). Thanh cuộn mảnh, ẩn mặc định (hiện khi hover) — `tokens.css`. Bỏ toàn bộ subtitle ở PageHeader. Drawer thiết kế biểu mẫu né sider (width trừ `--vht-sider-w`, zIndex dưới sider) nên không đè menu.
- **Data model NV KHCN ↔ Hồ sơ đã tách chuẩn hoá** (theo `docs/req/data-model-NV-vs-HoSo.md`): `data/nhiemVu.ts` = **NhiemVu master** (Mã NV, chủ nhiệm chi tiết, đơn vị chủ trì, thời gian, cấp, dự toán PL1–6, giai đoạn vòng đời); `data/dossiers.ts` = **HoSo** (FK `maNV` + loại hồ sơ + quy trình + bước/trạng thái + tài liệu) + `Dossier` **view join** (HoSo+NV) cho UI. Quan hệ **1 NV — N Hồ sơ** (seed minh hoạ: NV `RD.2026.012` có 2 hồ sơ: Xét duyệt + Nghiệm thu). `DossierContext` lưu HoSo, join NV qua `joinDossiers`; UI đọc view nên không đổi.
- Store dùng chung: `ProcessContext` + `DossierContext` + `FormContext` + `BreadcrumbContext` — sửa/duyệt/đổi form/breadcrumb ở đâu cũng đồng bộ.
- Sidebar menu điều hướng 3 khu (Quản lý quy trình · Thư viện biểu mẫu · Quản lý NV KHCN).
- eForm 2 tầng đã hiện thực: **nhập liệu** = form-js (thư viện + designer + render khi xử lý); **văn bản đầu ra** = template hành chính VN → in/PDF (`src/data/docTemplates.ts`, `components/OfficialDocument.tsx`).
- **Lớp thương hiệu bpmn.io** (`src/branding/`) — dùng chung cho **cả form-js lẫn bpmn-js**, KHÔNG sửa nội tại thư viện: `tokens.css` (1 nguồn `--vht-*`), `bpmnio-skin.css` (map → biến Carbon `--cds-*`/`--color-*`; scope `.vht-designer`/`.vht-form`/`.vht-diagram` đã kích hoạt cho bpmn-js), `translate-vi.ts` (`VI_DICT` gồm cả thuật ngữ form + BPMN; module didi). `relabel-vi.ts` = vá nhãn DOM cho form-js (form-js render nhãn thẳng, KHÔNG qua translate — phải sửa `nodeValue` tại chỗ, tránh nhân đôi node do preact). bpmn-js thì translate chuẩn nên KHÔNG cần relabel. Xem `src/branding/README.md`.
- **Lớp UI component dùng chung** (`src/components/ui/`, barrel `index.ts`): `PageHeader` (breadcrumb/back/icon/title/tag/code/subtitle/extra), `StatCard` (Card+Statistic), `StatusTag`/`ProcessStatusTag`/`DossierStatusTag` (1 nguồn màu từ STATUS_META/DOSSIER_STATUS), `NotFound` (Result 404), `FilterBar` (Search+Select+slot trái/phải, dùng ở Catalog/DossierList), `EntityTable` (Table + phân trang mặc định + empty chuẩn + onRowClick; `pagination={false}` cho bảng nhúng). Đã thay vào **cả 7 page** (ProcessCatalog/Create/Detail, DossierList/Detail, Worklist, FormLibrary) — sửa 1 nơi, mọi trang đổi theo. BPMN cũng đã componentize: `BpmnEditor`/`BpmnViewer`/`DiagramToolbar`; eForm: `FormRenderer`/`FormDesigner`/`TaskFormModal`; văn bản: `OfficialDocument`.
- **Deps build**: `bpmn-js@17.11.1` + `bpmn-js-properties-panel@5.60` + `@bpmn-io/properties-panel@3.47` + `zeebe-bpmn-moddle@1.16` (BPMN modeler + panel Camunda 8). `@bpmn-io/form-js@1.23` cho eForm. Đều lazy-load chunk riêng. Shim type tại `src/types/bpmn-shims.d.ts` (panel không kèm .d.ts).
Verify: `tsc --noEmit` 0 lỗi, `vite build` OK. Chạy: `cd webapp && npm run dev`.
Prototype cũ `prototype/` (HTML thuần) đã bị webapp thay thế — có thể xoá.

Next action: (a) khách giải OQ-002/019 (rework), OQ-006 (NFR số), OQ-021 (SSO), OQ-009 (đồng bộ), OQ-003/008;
(b) vẽ BPMN mẫu RD01.01 + chốt danh sách process variables/service task; (c) `skill-br-extractor` decision table RD04.
Khi license + OQ chốt → nâng camunda-design.md DRAFT → LOCKED.

## Foundations (build order — finish before any feature)

> Foundations before features still applies in lite mode. Ở giai đoạn hiện tại chỉ
> tập trung F1 (BA); F3–F5 sẽ chi tiết hoá khi chuyển sang build.

- [x] F0: Workspace & agent readiness (pre-flight xanh: CLAUDE.md 105 dòng, repo ổ D local, hooks + 60 skills active) — `COMPLETE` (2026-07-03)
- [ ] F1: Requirements Baseline (BA) — bản clean KHCN → requirements có cấu trúc (RD01–RD10) + RTM khởi tạo — `IN PROGRESS` · ✋ *cổng: BA sign-off*
- [ ] F2: Architecture & Locked Decisions — chốt Camunda 8 (+ license), SSO/IAM, mô hình tích hợp → ghi vào "Locked decisions" — `NOT STARTED` · ✋ *cổng: Human*
- [ ] F3: Project Scaffold — khung FE React+Vite+AntD tại `webapp/` (mock data) — `IN PROGRESS` (2026-07-03)
- [ ] F4: Master Data & RBAC — phân hệ Danh mục dùng chung + Phân quyền tập trung — `NOT STARTED`
- [ ] F5: Workflow/Process Engine — phân hệ Quản lý quy trình (Camunda 8), lõi hệ thống — `NOT STARTED`

## Active task

> The one task being worked. Phase is one of: PLAN → BUILD → VERIFY.

- **Task**: F1 — Bóc tách yêu cầu có cấu trúc từ tài liệu quy trình KHCN
- **Phase**: PLAN
- **Files to read first**:
  - `docs/req/1. Quy trinh Phan mem KHCN chi tiet (clean).md` (nguồn yêu cầu đã làm sạch)
  - `docs/req/BC_PRESALE_VTCN_VHT_CDS.md` (bối cảnh phạm vi/ưu tiên 2026)
  - `.claude/skills/skill-requirement-extractor/SKILL.md`
- **Next concrete step**: Chạy `skill-requirement-extractor` trên bản clean → phân loại
  requirements (functional/business/transition) cho nhóm RD01–RD02 (ưu tiên 2026), kèm
  assumptions + open questions. Sau đó chuyển sang `skill-user-story-generator`.

## Locked decisions

> Choices that must not be re-litigated. One line each: what + why + date.

- Harness profile = **Lite** — dự án khởi đầu bằng BA/requirements, làm gọn; nâng Full khi vào build đa-team. (2026-07-03)
- Nguồn yêu cầu chuẩn = **bản `(clean).md`** (đối chiếu từ PDF), giữ lại PDF gốc làm tham chiếu cho sơ đồ BPMN. (2026-07-03)
- **Trục tổ chức Epic = theo PHÂN HỆ phần mềm** (10 phân hệ presale), không theo luồng RD. Luồng RD trở thành Feature bên trong phân hệ. Vì khớp ULNL/timeline & cách team chia việc. (2026-07-03)
- Phân rã: **Business Rules (decision table) đi TRƯỚC Acceptance Criteria**; AC của luồng nhiều luật (RD04, trạng thái Đạt/Chưa đạt) sinh từ BR. (2026-07-03)
- Đợt 1 backlog = **chỉ vùng US-ready** (RD01/RD02/RD05, thuộc phân hệ QL NV KHCN); né vùng bị blocker (RD03/RD04/RD06 + NFR + rework) tới khi khách làm rõ open questions. (2026-07-03)
- **[F2 draft] Engine = Camunda 8** (theo presale) — chưa lock cứng vì phụ thuộc license. (2026-07-03)
- **[F2 draft] UI = custom (tiếng Việt, đa vai trò) gọi API Camunda**; KHÔNG dùng Tasklist mặc định cho luồng chính. (2026-07-03)
- **[F2 nguyên tắc] Camunda = lớp điều phối (trạng thái luồng), KHÔNG chứa dữ liệu đề tài.** Process variables chỉ giữ ID + biến điều khiển; nội dung hồ sơ/phiếu/QĐ/file ở ứng dụng nghiệp vụ. (2026-07-03)
- **[F2/F3 LOCKED] Frontend stack = React + TypeScript + Vite + Ant Design v5**, app tại `webapp/`. Scope hiện tại: SPA + mock data (chưa backend/Camunda thật). Backend/DB vẫn để mở. (2026-07-03)
- **[F2-D6] eForm = Camunda Forms (form-js) render trong UI custom** (`@bpmn-io/form-js`), KHÔNG dùng Tasklist. Tách 2 tầng: eForm nhập liệu (form-js) vs văn bản đầu ra (template→PDF, RD10). (2026-07-03)

## Blockers

- ~~**License Camunda 8 chưa chốt**~~ → **RESOLVED (2026-07-03)**: khách xác nhận sẽ dùng **Camunda 8 có license**. Gỡ chặn F2 về mặt license. ⚠️ Còn 2 câu chưa rõ (không chặn mockup, chặn lock F5): `OQ-CAM-DEPLOY` (SaaS vs Self-Managed) + `OQ-CAM-COMPONENTS` (bộ license kèm Connectors/Web Modeler/Identity?). Chủ: VHT.
- **F2 vẫn chưa lock cứng** dù license đã chốt — còn treo OQ-002 (rework), OQ-006 (NFR số), OQ-021 (SSO), OQ-009 (đồng bộ). License KHÔNG phải điều kiện lock duy nhất.
- **Sơ đồ luồng BPMN** trong PDF là hình ảnh, chưa số hoá thành text — cần vẽ lại/khảo sát nếu F1 yêu cầu chi tiết luồng từng bước.
