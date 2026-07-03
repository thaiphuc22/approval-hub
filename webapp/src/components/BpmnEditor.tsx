import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { App, Button, Empty, List, Modal, Tag, Tooltip, Typography } from 'antd'
import { CloseOutlined, ProfileOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  ZeebePropertiesProviderModule,
} from 'bpmn-js-properties-panel'
import minimapModule from 'diagram-js-minimap'
import zeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe.json'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css'
import 'diagram-js-minimap/assets/diagram-js-minimap.css'
import '../branding/bpmnio-skin.css'
import { TranslateViModule } from '../branding/translate-vi'
import { observeViLabels } from '../branding/relabel-vi'
import { khcnFormPropertiesModule, type FormLite } from '../bpmn/khcnFormModule'
import { khcnAssignmentPropertiesModule } from '../bpmn/khcnAssignmentModule'
import { khcnLanePropertiesModule } from '../bpmn/khcnLaneModule'
import { khcnTemplatesModule } from '../bpmn/khcnTemplatesModule'
import { khcnDecisionModule } from '../bpmn/khcnDecisionModule'
import { khcnConditionPropertiesModule } from '../bpmn/khcnConditionModule'
import { lintDiagram, type LintIssue, type LintSeverity } from '../bpmn/khcnLint'
import { STARTER_BPMN } from '../data/bpmn'
import DiagramToolbar from './DiagramToolbar'

const SEVERITY_META: Record<LintSeverity, { color: string; label: string }> = {
  error: { color: 'error', label: 'Lỗi' },
  warning: { color: 'warning', label: 'Cảnh báo' },
  info: { color: 'blue', label: 'Gợi ý' },
}

const { Text } = Typography
const PANEL_W = 340

export interface BpmnEditorHandle {
  getXml: () => Promise<string>
  getSvg: () => Promise<string>
}

interface Props {
  xml?: string
  forms?: FormLite[]
}

/**
 * Canvas vẽ BPMN theo bố cục Camunda Modeler: palette nổi trái, canvas toàn vùng,
 * Properties Panel dock bên phải (có header + đóng/mở), toolbar zoom nổi góc dưới.
 * `BpmnModeler` (bpmn-js) + Properties Panel (Camunda 8/Zeebe) + minimap.
 * Tái dùng lớp thương hiệu `src/branding/`.
 */
const BpmnEditor = forwardRef<BpmnEditorHandle, Props>(({ xml, forms }, ref) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const propsRef = useRef<HTMLDivElement>(null)
  const modelerRef = useRef<BpmnModeler | null>(null)
  const formsRef = useRef<FormLite[]>(forms ?? [])
  formsRef.current = forms ?? []

  const [isFs, setIsFs] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [lintOpen, setLintOpen] = useState(false)
  const [issues, setIssues] = useState<LintIssue[]>([])
  const { message } = App.useApp()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const modeler = new BpmnModeler({
      container: el,
      additionalModules: [
        TranslateViModule,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        ZeebePropertiesProviderModule,
        khcnFormPropertiesModule(() => formsRef.current),
        khcnAssignmentPropertiesModule(),
        khcnLanePropertiesModule(),
        khcnTemplatesModule(),
        khcnDecisionModule(),
        khcnConditionPropertiesModule(),
        minimapModule,
      ],
      moddleExtensions: { zeebe: zeebeModdle },
      propertiesPanel: propsRef.current ? { parent: propsRef.current } : undefined,
      minimap: { open: false },
    } as never)
    modelerRef.current = modeler
    modeler
      .importXML(xml || STARTER_BPMN)
      .then(() => {
        const canvas = modeler.get('canvas') as { zoom: (m: string) => void }
        canvas.zoom('fit-viewport')
      })
      .catch(() => {
        /* XML lỗi — bỏ qua trong mock */
      })

    const stopRelabel = propsRef.current ? observeViLabels(propsRef.current) : undefined

    return () => {
      stopRelabel?.()
      modeler.destroy()
      modelerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xml])

  useEffect(() => {
    const onFs = () => {
      setIsFs(document.fullscreenElement === wrapperRef.current)
      window.setTimeout(() => {
        const canvas = modelerRef.current?.get('canvas') as { resized?: () => void; zoom?: (m: string) => void } | undefined
        canvas?.resized?.()
        canvas?.zoom?.('fit-viewport')
      }, 120)
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useImperativeHandle(ref, () => ({
    getXml: async () => (await modelerRef.current!.saveXML({ format: true })).xml ?? '',
    getSvg: async () => (await modelerRef.current!.saveSVG()).svg ?? '',
  }))

  // ── Toolbar actions ────────────────────────────────────────────────────────
  const getCanvas = () => modelerRef.current?.get('canvas') as { zoom: (s?: number | string) => number } | undefined
  const zoomBy = (factor: number) => {
    const c = getCanvas()
    if (c) c.zoom((c.zoom() as number) * factor)
  }
  const fit = () => getCanvas()?.zoom('fit-viewport')
  const toggleMinimap = () => (modelerRef.current?.get('minimap') as { toggle: () => void } | undefined)?.toggle()
  const toggleFullscreen = () => {
    const el = wrapperRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen()
  }

  const runLint = () => {
    if (!modelerRef.current) return
    const found = lintDiagram(modelerRef.current)
    setIssues(found)
    if (found.length === 0) {
      message.success('Không phát hiện vấn đề. Quy trình hợp lệ.')
    } else {
      setLintOpen(true)
    }
  }

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', height: isFs ? '100vh' : '74vh', background: '#fff', overflow: 'hidden' }}
    >
      <div ref={containerRef} className="vht-diagram" style={{ height: '100%' }} />

      {/* Nút Kiểm tra (lint) — góc trên-trái */}
      <Tooltip title="Kiểm tra tính hợp lệ của quy trình" placement="right">
        <Button
          icon={<SafetyCertificateOutlined />}
          onClick={runLint}
          style={{ position: 'absolute', top: 12, left: 12, zIndex: 26 }}
        >
          Kiểm tra
        </Button>
      </Tooltip>

      <Modal
        title="Kết quả kiểm tra quy trình"
        open={lintOpen}
        onCancel={() => setLintOpen(false)}
        footer={<Button type="primary" onClick={() => setLintOpen(false)}>Đóng</Button>}
        width={640}
      >
        {issues.length === 0 ? (
          <Empty description="Không có vấn đề" />
        ) : (
          <List
            size="small"
            dataSource={issues}
            renderItem={(it) => (
              <List.Item>
                <Tag color={SEVERITY_META[it.severity].color}>{SEVERITY_META[it.severity].label}</Tag>
                <span style={{ flex: 1 }}>
                  <Text strong>{it.elementName}</Text> — {it.message}
                </span>
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* Properties Panel dock (phải) */}
      <div
        className="vht-props-dock"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: PANEL_W,
          background: '#fff',
          borderLeft: '1px solid var(--vht-border)',
          boxShadow: '-2px 0 10px rgba(15,23,34,0.06)',
          display: 'flex',
          flexDirection: 'column',
          transform: panelOpen ? 'translateX(0)' : `translateX(${PANEL_W}px)`,
          transition: 'transform 0.18s ease',
          zIndex: 25,
        }}
      >
        <div
          style={{
            height: 42,
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px 0 14px',
            borderBottom: '1px solid var(--vht-border)',
            background: 'var(--vht-surface-2)',
          }}
        >
          <Text strong>Thuộc tính phần tử</Text>
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setPanelOpen(false)} />
        </div>
        <div ref={propsRef} className="vht-designer" style={{ flex: 1, overflow: 'auto' }} />
      </div>

      {/* Nút mở lại panel (khi đang đóng) — tab dọc mép phải */}
      {!panelOpen && (
        <Tooltip title="Mở panel thuộc tính" placement="left">
          <Button
            icon={<ProfileOutlined />}
            onClick={() => setPanelOpen(true)}
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 26 }}
          />
        </Tooltip>
      )}

      {/* Toolbar zoom/tiện ích — góc dưới-phải, né panel khi mở */}
      <DiagramToolbar
        isFs={isFs}
        offsetRight={panelOpen ? PANEL_W : 0}
        onZoomIn={() => zoomBy(1.2)}
        onZoomOut={() => zoomBy(1 / 1.2)}
        onFit={fit}
        onToggleMinimap={toggleMinimap}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  )
})

BpmnEditor.displayName = 'BpmnEditor'
export default BpmnEditor
