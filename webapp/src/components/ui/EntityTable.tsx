import type { ReactNode } from 'react'
import { Empty, Table } from 'antd'
import type { TableProps } from 'antd'

export interface EntityTableProps<T> extends Omit<TableProps<T>, 'onRow' | 'locale'> {
  /** Nội dung khi rỗng (mặc định "Không có dữ liệu."). */
  emptyText?: ReactNode
  /** Bấm 1 dòng → gọi callback (thường điều hướng); tự thêm con trỏ tay. */
  onRowClick?: (record: T) => void
  /** Số dòng mỗi trang (mặc định 10). Bỏ qua nếu `pagination={false}`. */
  pageSize?: number
}

/**
 * Bảng chuẩn: phân trang mặc định (ẩn khi 1 trang), empty chuẩn, và điều hướng
 * khi bấm dòng. Truyền `pagination={false}` cho bảng nhúng (không phân trang).
 * Dùng ở mọi trang có bảng — sửa hành vi mặc định một nơi, mọi bảng đổi theo.
 */
export default function EntityTable<T extends object>({
  emptyText = 'Không có dữ liệu.',
  onRowClick,
  pagination,
  pageSize = 10,
  ...rest
}: EntityTableProps<T>) {
  return (
    <Table<T>
      {...rest}
      pagination={pagination === undefined ? { pageSize, hideOnSinglePage: true } : pagination}
      onRow={onRowClick ? (record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } }) : undefined}
      locale={{ emptyText: <Empty description={emptyText} /> }}
    />
  )
}
