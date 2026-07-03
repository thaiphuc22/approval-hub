// P1 — Element Templates domain KHCN.
// Các "task dựng sẵn" hay lặp trong RD01–RD06 (phê duyệt/thẩm định/soạn thảo) và
// RD03 (đồng bộ hệ ngoài). BA kéo từ palette ra là có sẵn: đúng loại BPMN +
// vai trò phụ trách (candidateGroups) + (service task) job type Zeebe.
//
// Nguồn: docs/req/bpmn-components-danh-gia.md (mục #4 P1) + bảng "Tác nhân tham gia"
// RD01–RD06 và bảng tích hợp RD03. Vai trò tham chiếu data/roles.ts.

export interface KhcnTemplate {
  id: string
  ten: string
  nhom: 'Phê duyệt' | 'Thẩm định' | 'Soạn thảo' | 'Tích hợp' | 'Hội đồng' | 'Hẹn giờ'
  bpmnType:
    | 'bpmn:UserTask'
    | 'bpmn:ServiceTask'
    | 'bpmn:CallActivity'
    | 'bpmn:StartEvent'
    | 'bpmn:IntermediateCatchEvent'
  /** Giá trị dựng sẵn khi chèn phần tử. */
  defaults: {
    name: string
    /** code vai trò → zeebe:AssignmentDefinition.candidateGroups (UserTask). */
    candidateGroups?: string
    /** zeebe:TaskDefinition.type (ServiceTask). */
    taskType?: string
    /**
     * Multi-instance song song — mỗi thành viên Hội đồng một phiên (UserTask).
     * Ghi bpmn:MultiInstanceLoopCharacteristics + zeebe:LoopCharacteristics.
     */
    multiInstance?: { inputCollection: string; inputElement: string }
    /** processId của quy trình con tái dùng → zeebe:CalledElement (CallActivity). */
    calledElement?: string
    /**
     * Sự kiện hẹn giờ → bpmn:TimerEventDefinition.
     * timeCycle (ISO 8601 lặp, vd R/P1M) cho Start định kỳ; timeDuration (vd PT48H)
     * cho Intermediate chờ tới hạn.
     */
    timer?: { timeCycle?: string; timeDuration?: string }
  }
}

export const KHCN_TEMPLATES: KhcnTemplate[] = [
  // ── Phê duyệt / ký duyệt ──────────────────────────────────────────────────
  {
    id: 'sign-bgd',
    ten: 'Ký duyệt cấp TT/Khối',
    nhom: 'Phê duyệt',
    bpmnType: 'bpmn:UserTask',
    defaults: { name: 'Ký duyệt cấp Trung tâm/Khối', candidateGroups: 'BGD_TT' },
  },
  {
    id: 'approve-tgd',
    ten: 'Phê duyệt (TGĐ)',
    nhom: 'Phê duyệt',
    bpmnType: 'bpmn:UserTask',
    defaults: { name: 'Phê duyệt Quyết định', candidateGroups: 'TGD_VHT' },
  },

  // ── Thẩm định ─────────────────────────────────────────────────────────────
  {
    id: 'review-council',
    ten: 'Thẩm định (Phiếu nhận xét)',
    nhom: 'Thẩm định',
    bpmnType: 'bpmn:UserTask',
    defaults: { name: 'Thẩm định qua Phiếu nhận xét/đánh giá', candidateGroups: 'HDXD' },
  },
  {
    id: 'review-check',
    ten: 'Thẩm định (Đạt/Chưa đạt)',
    nhom: 'Thẩm định',
    bpmnType: 'bpmn:UserTask',
    defaults: { name: 'Thẩm định Đạt/Chưa đạt', candidateGroups: 'CQ_KHCN' },
  },

  // ── Soạn thảo văn bản ─────────────────────────────────────────────────────
  {
    id: 'draft-report',
    ten: 'Lập Báo cáo thẩm định',
    nhom: 'Soạn thảo',
    bpmnType: 'bpmn:UserTask',
    defaults: { name: 'Lập Báo cáo thẩm định', candidateGroups: 'CQ_QLKHCN' },
  },
  {
    id: 'draft-decision',
    ten: 'Lập Quyết định',
    nhom: 'Soạn thảo',
    bpmnType: 'bpmn:UserTask',
    defaults: { name: 'Lập, trình Quyết định', candidateGroups: 'CQ_QLKHCN' },
  },

  // ── Hội đồng (RD02/RD04/RD05) — khối tái dùng ─────────────────────────────
  {
    id: 'council-review-mi',
    ten: 'Thẩm định Hội đồng (đa thành viên)',
    nhom: 'Hội đồng',
    bpmnType: 'bpmn:UserTask',
    defaults: {
      name: 'Thành viên HĐ ký PNX/PĐG',
      candidateGroups: 'HDXD',
      // Mỗi thành viên trong danh sách Hội đồng → một phiên thẩm định song song.
      multiInstance: { inputCollection: '=thanhVienHoiDong', inputElement: 'thanhVien' },
    },
  },
  {
    id: 'council-call',
    ten: 'Hội đồng (quy trình con)',
    nhom: 'Hội đồng',
    bpmnType: 'bpmn:CallActivity',
    defaults: {
      name: 'Hội đồng thẩm định',
      // Quy trình con tái dùng: TLHĐ → họp phiên 1 → phiên 2 (deploy riêng).
      calledElement: 'khcn-hoi-dong',
    },
  },

  // ── Hẹn giờ (RD03.06 báo cáo định kỳ · SLA/hạn xử lý) ─────────────────────
  {
    id: 'timer-cycle',
    ten: 'Định kỳ báo cáo (hàng tháng)',
    nhom: 'Hẹn giờ',
    bpmnType: 'bpmn:StartEvent',
    defaults: { name: 'Định kỳ báo cáo', timer: { timeCycle: 'R/P1M' } },
  },
  {
    id: 'timer-wait',
    ten: 'Chờ tới hạn xử lý',
    nhom: 'Hẹn giờ',
    bpmnType: 'bpmn:IntermediateCatchEvent',
    defaults: { name: 'Chờ tới hạn (SLA)', timer: { timeDuration: 'PT48H' } },
  },

  // ── Tích hợp hệ ngoài (RD03) — Service Task ───────────────────────────────
  {
    id: 'sync-qlns',
    ten: 'Đồng bộ QLNS',
    nhom: 'Tích hợp',
    bpmnType: 'bpmn:ServiceTask',
    defaults: { name: 'Đồng bộ dữ liệu QLNS', taskType: 'khcn.sync.qlns' },
  },
  {
    id: 'sync-ms',
    ten: 'Đồng bộ Mua sắm',
    nhom: 'Tích hợp',
    bpmnType: 'bpmn:ServiceTask',
    defaults: { name: 'Đồng bộ dữ liệu Mua sắm', taskType: 'khcn.sync.ms' },
  },
  {
    id: 'sync-sap',
    ten: 'Đồng bộ SAP',
    nhom: 'Tích hợp',
    bpmnType: 'bpmn:ServiceTask',
    defaults: { name: 'Đồng bộ kinh phí SAP', taskType: 'khcn.sync.sap' },
  },
  {
    id: 'sync-qlts',
    ten: 'Đồng bộ QLTS',
    nhom: 'Tích hợp',
    bpmnType: 'bpmn:ServiceTask',
    defaults: { name: 'Đồng bộ tài sản QLTS', taskType: 'khcn.sync.qlts' },
  },
  {
    id: 'sync-plm',
    ten: 'Đồng bộ PLM',
    nhom: 'Tích hợp',
    bpmnType: 'bpmn:ServiceTask',
    defaults: { name: 'Đồng bộ tiến độ PLM', taskType: 'khcn.sync.plm' },
  },
]
