import { Button, Space, Tooltip } from 'antd'
import {
  BorderOuterOutlined,
  CompressOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons'

interface Props {
  isFs: boolean
  /** Đẩy toolbar sang trái để né panel dock (px). */
  offsetRight?: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onToggleMinimap: () => void
  onToggleFullscreen: () => void
}

/** Thanh công cụ nổi (góc dưới-phải) dùng chung cho BpmnEditor & BpmnViewer. */
export default function DiagramToolbar({
  isFs,
  offsetRight = 0,
  onZoomIn,
  onZoomOut,
  onFit,
  onToggleMinimap,
  onToggleFullscreen,
}: Props) {
  return (
    <div style={{ position: 'absolute', bottom: 14, right: offsetRight + 14, zIndex: 30, transition: 'right 0.18s ease' }}>
      <Space.Compact>
        <Tooltip title="Thu nhỏ"><Button icon={<ZoomOutOutlined />} onClick={onZoomOut} /></Tooltip>
        <Tooltip title="Phóng to"><Button icon={<ZoomInOutlined />} onClick={onZoomIn} /></Tooltip>
        <Tooltip title="Vừa màn hình"><Button icon={<CompressOutlined />} onClick={onFit} /></Tooltip>
        <Tooltip title="Bản đồ (minimap)"><Button icon={<BorderOuterOutlined />} onClick={onToggleMinimap} /></Tooltip>
        <Tooltip title={isFs ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>
          <Button icon={isFs ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={onToggleFullscreen} />
        </Tooltip>
      </Space.Compact>
    </div>
  )
}
