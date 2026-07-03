/*
 * Custom Properties Provider: nhóm "Phân công (KHCN)".
 *
 * Thêm 1 nhóm vào Properties Panel cho mỗi User Task để BA gán VAI TRÒ phụ trách
 * — chọn từ ĐÚNG danh mục vai trò (data/roles.ts, rút từ bảng "Tác nhân tham gia"
 * của RD01–RD10) thay vì gõ tay ID nhóm. Đây là gap P0 quan trọng nhất: mọi bước
 * trong mọi luồng đều là "ai làm việc này".
 *
 * Giá trị ghi vào `zeebe:AssignmentDefinition` (chuẩn Camunda 8):
 *   - candidateGroups ← code vai trò (vd 'HDXD', 'TGD_VHT')
 *   - assignee        ← người/biểu thức cụ thể (tùy chọn)
 * → đồng bộ với nhóm "Assignment" gốc của Zeebe và xuất ra XML triển khai được.
 *
 * Cùng khuôn với khcnFormModule: component chạy trong preact của properties-panel,
 * GỌI *Entry(...) như hàm (trả vnode), không JSX. Các gói không kèm .d.ts → any.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { is } from 'bpmn-js/lib/util/ModelUtil'
import {
  SelectEntry,
  isSelectEntryEdited,
  TextFieldEntry,
  isTextFieldEntryEdited,
} from '@bpmn-io/properties-panel'
import { useService } from 'bpmn-js-properties-panel'
import { ROLES } from '../data/roles'
import { getAssignmentProp, setAssignmentProp } from './assignmentUtil'

// ── entries (preact) ───────────────────────────────────────────────────────
function CandidateGroupEntry(props: any) {
  const { element, id } = props
  const modeling = useService('modeling')
  const bpmnFactory = useService('bpmnFactory')
  const translate = useService('translate')

  const getValue = () => getAssignmentProp(element, 'candidateGroups')
  const setValue = (value: string) =>
    setAssignmentProp(element, modeling, bpmnFactory, 'candidateGroups', value)
  const getOptions = () => [
    { value: '', label: translate('— Chưa phân công —') },
    ...ROLES.map((r) => ({ value: r.code, label: `${r.nhom} · ${r.ten}` })),
  ]

  return SelectEntry({
    element,
    id,
    label: translate('Nhóm phụ trách (candidateGroups)'),
    getValue,
    setValue,
    getOptions,
  })
}

function AssigneeEntry(props: any) {
  const { element, id } = props
  const modeling = useService('modeling')
  const bpmnFactory = useService('bpmnFactory')
  const debounce = useService('debounceInput')
  const translate = useService('translate')

  const getValue = () => getAssignmentProp(element, 'assignee')
  const setValue = (value: string) =>
    setAssignmentProp(element, modeling, bpmnFactory, 'assignee', value)

  return TextFieldEntry({
    element,
    id,
    label: translate('Người cụ thể (assignee)'),
    description: translate('Tùy chọn — username hoặc biểu thức. Bỏ trống nếu giao cả nhóm.'),
    getValue,
    setValue,
    debounce,
  })
}

// ── provider ───────────────────────────────────────────────────────────────
class KhcnAssignmentPropertiesProvider {
  static $inject = ['propertiesPanel', 'translate']
  private _translate: any
  constructor(propertiesPanel: any, translate: any) {
    this._translate = translate
    propertiesPanel.registerProvider(510, this)
  }
  getGroups(element: any) {
    return (groups: any[]) => {
      if (is(element, 'bpmn:UserTask')) {
        groups.push({
          id: 'khcnAssignment',
          label: this._translate('Phân công (KHCN)'),
          entries: [
            {
              id: 'khcn-candidateGroups',
              element,
              component: CandidateGroupEntry,
              isEdited: isSelectEntryEdited,
            },
            {
              id: 'khcn-assignee',
              element,
              component: AssigneeEntry,
              isEdited: isTextFieldEntryEdited,
            },
          ],
        })
      }
      return groups
    }
  }
}

/** Module didi — nạp vào additionalModules của BpmnModeler. */
export function khcnAssignmentPropertiesModule() {
  return {
    __init__: ['khcnAssignmentPropertiesProvider'],
    khcnAssignmentPropertiesProvider: ['type', KhcnAssignmentPropertiesProvider],
  }
}
