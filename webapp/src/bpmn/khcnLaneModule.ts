/*
 * P0 #3 — Map Lane → Vai trò (candidateGroup).
 *
 * Trong tài liệu QTKHCN, mỗi "Nhóm tác nhân" chính là một LANE. Module này:
 *  (a) Provider: thêm nhóm "Vai trò (KHCN)" cho bpmn:Lane — chọn vai trò từ danh
 *      mục ROLES; lưu bằng chính TÊN LANE (name = nhãn vai trò) → XML sạch, đọc
 *      được, và không cần extension riêng cho lane.
 *  (b) Behavior: khi một User Task được tạo/di chuyển vào lane có vai trò và task
 *      CHƯA gán candidateGroups → tự điền theo vai trò của lane. Không đè lựa chọn
 *      đã có của người dùng.
 *
 * Cùng khuôn plain didi module như khcnFormModule/khcnAssignmentModule. Không JSX.
 * Các gói bpmn.io không kèm .d.ts → any.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil'
import { SelectEntry, isSelectEntryEdited } from '@bpmn-io/properties-panel'
import { useService } from 'bpmn-js-properties-panel'
import { ROLES, roleCodeByLabel, roleLabel } from '../data/roles'
import { getAssignmentProp, setAssignmentProp } from './assignmentUtil'

// ── helpers ─────────────────────────────────────────────────────────────────
function laneRoleCode(laneEl: any): string {
  return roleCodeByLabel(getBusinessObject(laneEl).get('name') || '')
}

/** Tìm lane chứa một flow node (qua flowNodeRef của các Lane). */
function findContainingLane(element: any, elementRegistry: any): any {
  const bo = getBusinessObject(element)
  const lanes = elementRegistry.filter((e: any) => is(e, 'bpmn:Lane'))
  return lanes.find((laneEl: any) => {
    const refs = getBusinessObject(laneEl).get('flowNodeRef') || []
    return refs.includes(bo)
  })
}

// ── (a) Provider: vai trò cho Lane ──────────────────────────────────────────
function LaneRoleEntry(props: any) {
  const { element, id } = props
  const modeling = useService('modeling')
  const translate = useService('translate')

  const getValue = () => laneRoleCode(element)
  const setValue = (code: string) =>
    modeling.updateProperties(element, { name: code ? roleLabel(code) : '' })
  const getOptions = () => [
    { value: '', label: translate('— Không gán vai trò —') },
    ...ROLES.map((r) => ({ value: r.code, label: `${r.nhom} · ${r.ten}` })),
  ]

  return SelectEntry({
    element,
    id,
    label: translate('Vai trò của lane'),
    getValue,
    setValue,
    getOptions,
  })
}

class KhcnLanePropertiesProvider {
  static $inject = ['propertiesPanel', 'translate']
  private _translate: any
  constructor(propertiesPanel: any, translate: any) {
    this._translate = translate
    propertiesPanel.registerProvider(520, this)
  }
  getGroups(element: any) {
    return (groups: any[]) => {
      if (is(element, 'bpmn:Lane')) {
        groups.push({
          id: 'khcnLaneRole',
          label: this._translate('Vai trò (KHCN)'),
          entries: [
            {
              id: 'khcn-laneRole',
              element,
              component: LaneRoleEntry,
              isEdited: isSelectEntryEdited,
            },
          ],
        })
      }
      return groups
    }
  }
}

// ── (b) Behavior: tự điền candidateGroups theo lane ─────────────────────────
class KhcnLaneAutoAssign {
  static $inject = ['eventBus', 'modeling', 'bpmnFactory', 'elementRegistry']

  constructor(eventBus: any, modeling: any, bpmnFactory: any, elementRegistry: any) {
    const maybeAssign = (shape: any) => {
      try {
        if (!shape || !is(shape, 'bpmn:UserTask')) return
        // Không đè lựa chọn có sẵn của người dùng.
        if (getAssignmentProp(shape, 'candidateGroups')) return
        const lane = findContainingLane(shape, elementRegistry)
        if (!lane) return
        const code = laneRoleCode(lane)
        if (!code) return
        setAssignmentProp(shape, modeling, bpmnFactory, 'candidateGroups', code)
      } catch {
        /* best-effort — không để lỗi behavior phá modeler */
      }
    }

    eventBus.on('commandStack.shape.create.postExecuted', 500, (e: any) => {
      maybeAssign(e?.context?.shape)
    })
    eventBus.on('commandStack.elements.move.postExecuted', 500, (e: any) => {
      ;(e?.context?.shapes || []).forEach(maybeAssign)
    })
  }
}

/** Module didi — nạp vào additionalModules của BpmnModeler. */
export function khcnLanePropertiesModule() {
  return {
    __init__: ['khcnLanePropertiesProvider', 'khcnLaneAutoAssign'],
    khcnLanePropertiesProvider: ['type', KhcnLanePropertiesProvider],
    khcnLaneAutoAssign: ['type', KhcnLaneAutoAssign],
  }
}
