/*
 * P2 #9 — Điều kiện rẽ nhánh (KHCN) cho Sequence Flow ra từ Gateway.
 *
 * Người vẽ TỰ thiết lập điều kiện rẽ nhánh — không phụ thuộc số liệu khách. Con số
 * ngưỡng (vd "vượt chủ trương") KHÔNG nằm ở gateway mà ở BIẾN quyết định tính từ
 * bước phía trước (business rule/DMN). Gateway chỉ so biến đó bằng FEEL.
 *
 * Module thêm nhóm "Điều kiện (KHCN)" cho bpmn:SequenceFlow (khi nguồn là Gateway):
 * dropdown preset nghiệp vụ → ghi bpmn:conditionExpression (FEEL, dùng BIẾN, không
 * hardcode số). Vẫn dùng chung ô Condition tự do của panel Zeebe cho biểu thức khác.
 *
 * Cùng khuôn khcnFormModule/khcnAssignmentModule. Không JSX. Gói không .d.ts → any.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil'
import { SelectEntry, isSelectEntryEdited } from '@bpmn-io/properties-panel'
import { useService } from 'bpmn-js-properties-panel'

/** Preset điều kiện nghiệp vụ — FEEL dựa trên BIẾN process (không hardcode số). */
export const CONDITION_PRESETS: { value: string; label: string }[] = [
  { value: '=cap = "Cơ sở"', label: 'Cấp: Cơ sở' },
  { value: '=cap = "Tập đoàn"', label: 'Cấp: Tập đoàn' },
  { value: '=ketQua = "dat"', label: 'Kết quả: Đạt / Đồng ý' },
  { value: '=ketQua = "chua_dat"', label: 'Kết quả: Chưa đạt / Từ chối' },
  { value: '=loaiDieuChinh = "chu_nhiem"', label: 'Điều chỉnh: chủ nhiệm đề tài' },
  { value: '=loaiDieuChinh = "khong_tang_du_toan"', label: 'Điều chỉnh: không tăng tổng dự toán' },
  { value: '=loaiDieuChinh = "tang_khong_vuot_chu_truong"', label: 'Điều chỉnh: tăng, không vượt chủ trương' },
  { value: '=loaiDieuChinh = "vuot_chu_truong"', label: 'Điều chỉnh: vượt chủ trương' },
]

// ── helpers (bpmn:conditionExpression) ──────────────────────────────────────
function getCondition(flow: any): string {
  const ce = getBusinessObject(flow).get('conditionExpression')
  return ce ? ce.get('body') || '' : ''
}

function setCondition(flow: any, modeling: any, bpmnFactory: any, body: string) {
  const bo = getBusinessObject(flow)
  if (body) {
    const ce = bpmnFactory.create('bpmn:FormalExpression', { body })
    ce.$parent = bo
    modeling.updateModdleProperties(flow, bo, { conditionExpression: ce })
  } else {
    modeling.updateModdleProperties(flow, bo, { conditionExpression: undefined })
  }
}

// ── entry (preact) ──────────────────────────────────────────────────────────
function ConditionPresetEntry(props: any) {
  const { element, id } = props
  const modeling = useService('modeling')
  const bpmnFactory = useService('bpmnFactory')
  const translate = useService('translate')

  const getValue = () => getCondition(element)
  const setValue = (value: string) => setCondition(element, modeling, bpmnFactory, value)
  const getOptions = () => {
    const cur = getCondition(element)
    const opts = [{ value: '', label: translate('— Không điều kiện (mặc định) —') }, ...CONDITION_PRESETS]
    // Nếu điều kiện hiện tại là biểu thức tuỳ chỉnh (không thuộc preset) → hiện để không mất giá trị.
    if (cur && !CONDITION_PRESETS.some((p) => p.value === cur)) {
      opts.push({ value: cur, label: `${translate('(tuỳ chỉnh)')} ${cur}` })
    }
    return opts
  }

  return SelectEntry({
    element,
    id,
    label: translate('Điều kiện nghiệp vụ (FEEL)'),
    getValue,
    setValue,
    getOptions,
  })
}

// ── provider ─────────────────────────────────────────────────────────────────
class KhcnConditionPropertiesProvider {
  static $inject = ['propertiesPanel', 'translate']
  private _translate: any
  constructor(propertiesPanel: any, translate: any) {
    this._translate = translate
    propertiesPanel.registerProvider(530, this)
  }
  getGroups(element: any) {
    return (groups: any[]) => {
      // Chỉ hiện cho luồng đi ra TỪ một Gateway.
      if (is(element, 'bpmn:SequenceFlow') && element.source && is(element.source, 'bpmn:Gateway')) {
        groups.push({
          id: 'khcnCondition',
          label: this._translate('Điều kiện (KHCN)'),
          entries: [
            {
              id: 'khcn-condition',
              element,
              component: ConditionPresetEntry,
              isEdited: isSelectEntryEdited,
            },
          ],
        })
      }
      return groups
    }
  }
}

/** Module didi — nạp vào additionalModules của BpmnModeler. */
export function khcnConditionPropertiesModule() {
  return {
    __init__: ['khcnConditionPropertiesProvider'],
    khcnConditionPropertiesProvider: ['type', KhcnConditionPropertiesProvider],
  }
}
