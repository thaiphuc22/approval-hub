/*
 * P1 — Element Templates domain (bản nhẹ, không cần Camunda template engine).
 *
 * Một PaletteProvider thêm mục "Mẫu KHCN" vào palette: kéo/click ra là có task
 * DỰNG SẴN đúng cấu hình — UserTask kèm vai trò (zeebe:AssignmentDefinition
 * .candidateGroups) hoặc ServiceTask kèm job type (zeebe:TaskDefinition.type).
 * Việc chỉnh sau khi tạo do panel Zeebe + nhóm "Phân công (KHCN)" đảm nhiệm.
 *
 * Cách chèn: dựng sẵn businessObject (name + extensionElements) rồi
 * elementFactory.createShape({ type, businessObject }) → create.start(). Một lệnh
 * duy nhất, undo được, không race event. Các gói bpmn.io không kèm .d.ts → any.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { KHCN_TEMPLATES, type KhcnTemplate } from '../data/elementTemplates'

const ICON: Record<KhcnTemplate['bpmnType'], string> = {
  'bpmn:UserTask': 'bpmn-icon-user-task',
  'bpmn:ServiceTask': 'bpmn-icon-service-task',
  'bpmn:CallActivity': 'bpmn-icon-call-activity',
  'bpmn:StartEvent': 'bpmn-icon-start-event-timer',
  'bpmn:IntermediateCatchEvent': 'bpmn-icon-intermediate-event-catch-timer',
}
const GROUP: Record<KhcnTemplate['nhom'], string> = {
  'Phê duyệt': 'khcn-approval',
  'Thẩm định': 'khcn-review',
  'Soạn thảo': 'khcn-draft',
  'Hội đồng': 'khcn-council',
  'Hẹn giờ': 'khcn-timer',
  'Tích hợp': 'khcn-integration',
}

class KhcnTemplatesPalette {
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

  /** Dựng businessObject có sẵn name + cấu hình Zeebe (assignment / taskDefinition /
   *  calledElement / multi-instance). */
  private _buildBusinessObject(tmpl: KhcnTemplate) {
    const f = this._bpmnFactory
    const d = tmpl.defaults
    const bo = f.create(tmpl.bpmnType, { name: d.name })

    // extensionElements cấp task: assignment / taskDefinition / calledElement.
    const ext: any[] = []
    if (d.candidateGroups) {
      ext.push(f.create('zeebe:AssignmentDefinition', { candidateGroups: d.candidateGroups }))
    }
    if (d.taskType) {
      ext.push(f.create('zeebe:TaskDefinition', { type: d.taskType }))
    }
    if (d.calledElement) {
      ext.push(f.create('zeebe:CalledElement', { processId: d.calledElement }))
    }
    if (ext.length) {
      const ee = f.create('bpmn:ExtensionElements', { values: ext })
      ee.$parent = bo
      ext.forEach((x) => (x.$parent = ee))
      bo.extensionElements = ee
    }

    // Multi-instance song song: loopCharacteristics kèm zeebe:LoopCharacteristics
    // (extensionElements RIÊNG của loop, tách khỏi extensionElements cấp task).
    if (d.multiInstance) {
      const loop = f.create('bpmn:MultiInstanceLoopCharacteristics', { isSequential: false })
      const zl = f.create('zeebe:LoopCharacteristics', {
        inputCollection: d.multiInstance.inputCollection,
        inputElement: d.multiInstance.inputElement,
      })
      const lee = f.create('bpmn:ExtensionElements', { values: [zl] })
      lee.$parent = loop
      zl.$parent = lee
      loop.extensionElements = lee
      loop.$parent = bo
      bo.loopCharacteristics = loop
    }

    // Sự kiện hẹn giờ: bpmn:TimerEventDefinition (timeCycle / timeDuration).
    if (d.timer) {
      const timerDef = f.create('bpmn:TimerEventDefinition', {})
      if (d.timer.timeCycle) {
        const tc = f.create('bpmn:FormalExpression', { body: d.timer.timeCycle })
        tc.$parent = timerDef
        timerDef.timeCycle = tc
      }
      if (d.timer.timeDuration) {
        const td = f.create('bpmn:FormalExpression', { body: d.timer.timeDuration })
        td.$parent = timerDef
        timerDef.timeDuration = td
      }
      timerDef.$parent = bo
      bo.eventDefinitions = [timerDef]
    }
    return bo
  }

  private _start(event: any, tmpl: KhcnTemplate) {
    const businessObject = this._buildBusinessObject(tmpl)
    const shape = this._elementFactory.createShape({ type: tmpl.bpmnType, businessObject })
    this._create.start(event, shape)
  }

  getPaletteEntries() {
    const entries: Record<string, any> = {}
    for (const tmpl of KHCN_TEMPLATES) {
      const start = (event: any) => this._start(event, tmpl)
      entries[`khcn-tmpl-${tmpl.id}`] = {
        group: GROUP[tmpl.nhom],
        className: ICON[tmpl.bpmnType],
        title: this._translate(`Mẫu KHCN: ${tmpl.ten}`),
        action: { dragstart: start, click: start },
      }
    }
    return entries
  }
}

/** Module didi — nạp vào additionalModules của BpmnModeler. */
export function khcnTemplatesModule() {
  return {
    __init__: ['khcnTemplatesPalette'],
    khcnTemplatesPalette: ['type', KhcnTemplatesPalette],
  }
}
