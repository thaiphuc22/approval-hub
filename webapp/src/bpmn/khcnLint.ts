/*
 * P2 — Validation / lint BPMN (bản nhẹ, không cần bpmnlint).
 *
 * Kiểm tra tính nhất quán của luồng phê duyệt KHCN trước khi lưu quy trình:
 *  - UserTask phải có vai trò phụ trách (candidateGroups/assignee) — mọi bước là "ai làm".
 *  - UserTask nên gán biểu mẫu (formKey).
 *  - ServiceTask phải có job type (zeebe:TaskDefinition.type).
 *  - ExclusiveGateway ≥2 nhánh: phải có default flow + các nhánh nên có nhãn.
 *  - Không node treo: task/gateway/intermediate cần cả vào & ra; start cần ra; end cần vào.
 *  - Quy trình nên có ≥1 Start và ≥1 End.
 *
 * Chạy trên elementRegistry hiện tại (không phụ thuộc React). Gói bpmn.io không .d.ts → any.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil'

export type LintSeverity = 'error' | 'warning' | 'info'

export interface LintIssue {
  severity: LintSeverity
  elementId: string
  elementName: string
  message: string
}

/** Đọc 1 phần tử mở rộng theo type trong extensionElements. */
function getExt(bo: any, type: string): any {
  const ee = bo.get('extensionElements')
  if (!ee) return undefined
  return (ee.get('values') || []).find((v: any) => is(v, type))
}

function nameOf(el: any): string {
  const bo = getBusinessObject(el)
  return bo.get('name') || bo.get('id') || el.id || '(không tên)'
}

export function lintDiagram(modeler: any): LintIssue[] {
  const issues: LintIssue[] = []
  const registry = modeler.get('elementRegistry')
  const all: any[] = registry.getAll()

  const push = (severity: LintSeverity, el: any, message: string) =>
    issues.push({ severity, elementId: el.id, elementName: nameOf(el), message })

  let startCount = 0
  let endCount = 0

  for (const el of all) {
    // Bỏ qua nhãn, root, connection, pool/lane.
    if (el.labelTarget || el.waypoints) continue
    if (!is(el, 'bpmn:FlowNode')) continue

    const bo = getBusinessObject(el)
    const incoming = (bo.get('incoming') || []).length
    const outgoing = (bo.get('outgoing') || []).length

    // ── Node treo ──────────────────────────────────────────────────────────
    if (is(el, 'bpmn:StartEvent')) {
      startCount++
      if (outgoing === 0) push('error', el, 'Sự kiện bắt đầu chưa có luồng đi ra.')
    } else if (is(el, 'bpmn:EndEvent')) {
      endCount++
      if (incoming === 0) push('error', el, 'Sự kiện kết thúc chưa có luồng đi vào.')
    } else if (is(el, 'bpmn:BoundaryEvent')) {
      // gắn vào host — bỏ qua kiểm tra vào/ra.
    } else {
      if (incoming === 0) push('error', el, 'Phần tử chưa có luồng đi vào (node treo).')
      if (outgoing === 0) push('error', el, 'Phần tử chưa có luồng đi ra (node treo).')
    }

    // ── User Task: vai trò + biểu mẫu ───────────────────────────────────────
    if (is(el, 'bpmn:UserTask')) {
      const ad = getExt(bo, 'zeebe:AssignmentDefinition')
      const hasRole = ad && (ad.get('candidateGroups') || ad.get('assignee'))
      if (!hasRole) push('warning', el, 'User Task chưa gán vai trò phụ trách (candidateGroups/assignee).')

      const fd = getExt(bo, 'zeebe:FormDefinition')
      if (!fd || !fd.get('formKey')) push('info', el, 'User Task chưa gán biểu mẫu (formKey).')
    }

    // ── Service Task: job type ─────────────────────────────────────────────
    if (is(el, 'bpmn:ServiceTask')) {
      const td = getExt(bo, 'zeebe:TaskDefinition')
      if (!td || !td.get('type')) push('warning', el, 'Service Task chưa có job type (zeebe:taskDefinition.type).')
    }

    // ── Exclusive Gateway: default + nhãn nhánh ────────────────────────────
    if (is(el, 'bpmn:ExclusiveGateway') && outgoing >= 2) {
      const flows = (bo.get('outgoing') || []).filter((f: any) => is(f, 'bpmn:SequenceFlow'))
      if (!bo.get('default')) push('warning', el, 'Cổng rẽ nhánh chưa đặt luồng mặc định (default flow).')
      const unnamed = flows.filter((f: any) => !f.get('name')).length
      if (unnamed > 0) push('warning', el, `Cổng rẽ nhánh có ${unnamed} nhánh chưa gán nhãn.`)
    }
  }

  if (startCount === 0) issues.push({ severity: 'error', elementId: '', elementName: 'Quy trình', message: 'Chưa có sự kiện bắt đầu (Start Event).' })
  if (endCount === 0) issues.push({ severity: 'error', elementId: '', elementName: 'Quy trình', message: 'Chưa có sự kiện kết thúc (End Event).' })

  // error trước, rồi warning, rồi info.
  const rank: Record<LintSeverity, number> = { error: 0, warning: 1, info: 2 }
  return issues.sort((a, b) => rank[a.severity] - rank[b.severity])
}
