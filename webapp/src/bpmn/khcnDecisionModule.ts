/*
 * P0.5 #4 — Khối "Đồng ý / Từ chối" + rework.
 *
 * Mọi luồng RD01–RD06 đều có cổng phê duyệt: "Phê duyệt/Từ chối", "Đạt/Chưa đạt"
 * ở mỗi cấp, kèm vòng lặp rework. Module này cho phép dựng nhanh:
 *  (a) Palette: mục "Cổng Đồng ý/Từ chối" — chèn ExclusiveGateway đặt sẵn tên.
 *  (b) Behavior: tự gán nhãn 2 sequence flow đi ra của cổng đó — flow thứ 1 =
 *      "Đồng ý" (đặt luôn làm default), flow thứ 2 = "Từ chối". Không đè nhãn có sẵn.
 *
 * ⚠️ ASSUMPTION A1 (OQ-002 — đích rework khi từ chối, CHƯA chốt với khách):
 *   - "Đồng ý" là nhánh mặc định (default flow) → đi tiếp.
 *   - "Từ chối" là nhánh rework; ĐÍCH rework do người vẽ tự nối (mặc định khuyến
 *     nghị: về bước "Xây dựng hồ sơ" của PM). Điều kiện rẽ nhánh để TRỐNG cho panel
 *     điền (phụ thuộc cách phát tín hiệu duyệt/từ chối — liên quan OQ-006).
 * Khi khách chốt OQ-002 → chỉ cần chỉnh nhãn/đích ở đây.
 *
 * Cùng khuôn plain didi module (provider + behavior). Gói bpmn.io không .d.ts → any.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil'

const DECISION_NAME = 'Kết quả duyệt?'
const APPROVE_LABEL = 'Đồng ý'
const REJECT_LABEL = 'Từ chối'

/** Cổng phê duyệt do ta tạo (nhận diện theo tên mặc định hoặc chứa "Đồng ý/Từ chối"). */
function isApprovalGateway(el: any): boolean {
  if (!el || !is(el, 'bpmn:ExclusiveGateway')) return false
  const name = getBusinessObject(el).get('name') || ''
  return name === DECISION_NAME || /đồng ý.*từ chối/i.test(name)
}

// ── (a) Palette: chèn cổng Đồng ý/Từ chối ───────────────────────────────────
class KhcnDecisionPalette {
  static $inject = ['create', 'elementFactory', 'bpmnFactory', 'translate', 'palette']
  private _create: any
  private _elementFactory: any
  private _bpmnFactory: any
  private _translate: any

  constructor(create: any, elementFactory: any, bpmnFactory: any, translate: any, palette: any) {
    this._create = create
    this._elementFactory = elementFactory
    this._bpmnFactory = bpmnFactory
    this._translate = translate
    palette.registerProvider(this)
  }

  private _start(event: any) {
    const bo = this._bpmnFactory.create('bpmn:ExclusiveGateway', { name: DECISION_NAME })
    const shape = this._elementFactory.createShape({ type: 'bpmn:ExclusiveGateway', businessObject: bo })
    this._create.start(event, shape)
  }

  getPaletteEntries() {
    const start = (event: any) => this._start(event)
    return {
      'khcn-decision-gateway': {
        group: 'khcn-approval',
        className: 'bpmn-icon-gateway-xor',
        title: this._translate('Mẫu KHCN: Cổng Đồng ý/Từ chối'),
        action: { dragstart: start, click: start },
      },
    }
  }
}

// ── (b) Behavior: tự gán nhãn 2 flow đi ra ──────────────────────────────────
class KhcnDecisionAutoLabel {
  static $inject = ['eventBus', 'modeling']

  constructor(eventBus: any, modeling: any) {
    eventBus.on('commandStack.connection.create.postExecuted', 500, (e: any) => {
      try {
        const conn = e?.context?.connection
        if (!conn || !is(conn, 'bpmn:SequenceFlow')) return
        const src = conn.source
        if (!isApprovalGateway(src)) return

        // Không đè nhãn người dùng đã đặt.
        if (getBusinessObject(conn).get('name')) return

        const outgoing = (getBusinessObject(src).get('outgoing') || []).filter((f: any) =>
          is(f, 'bpmn:SequenceFlow'),
        )
        const idx = outgoing.indexOf(getBusinessObject(conn))

        if (idx === 0) {
          modeling.updateProperties(conn, { name: APPROVE_LABEL })
          // "Đồng ý" là nhánh mặc định (default flow) — happy path.
          modeling.updateProperties(src, { default: getBusinessObject(conn) })
        } else if (idx === 1) {
          modeling.updateProperties(conn, { name: REJECT_LABEL })
        }
      } catch {
        /* best-effort — không để lỗi behavior phá modeler */
      }
    })
  }
}

/** Module didi — nạp vào additionalModules của BpmnModeler. */
export function khcnDecisionModule() {
  return {
    __init__: ['khcnDecisionPalette', 'khcnDecisionAutoLabel'],
    khcnDecisionPalette: ['type', KhcnDecisionPalette],
    khcnDecisionAutoLabel: ['type', KhcnDecisionAutoLabel],
  }
}
