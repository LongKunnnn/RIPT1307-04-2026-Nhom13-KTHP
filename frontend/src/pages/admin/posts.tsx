import { useMemo, useState } from 'react';
import { Link } from 'umi';
import { Button, Popconfirm, Space, Table, Tag, message } from 'antd';
import { postService } from '@/services/posts/postService';
import { ROUTES } from '@/constants/routes';
import { formatViDate, roleLabel } from '@/utils/format';
import type { Post } from '@/types';

export default function AdminPostsPage() {
  const [tick, setTick] = useState(0);
  const data = useMemo(() => postService.list({ page: 1, pageSize: 100 }).items, [tick]);

  const remove = (id: string) => {
    if (postService.delete(id)) {
      message.success('Đã xóa bài viết');
      setTick((t) => t + 1);
    }
  };

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title', ellipsis: true },
    { title: 'Tác giả', dataIndex: 'authorName', width: 160 },
    {
      title: 'Vai trò',
      dataIndex: 'authorRole',
      width: 110,
      render: (r: Post['authorRole']) => <Tag>{roleLabel(r)}</Tag>,
    },
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      width: 150,
      render: (v: string) => formatViDate(v),
    },
    {
      title: 'Thao tác',
      width: 200,
      render: (_: unknown, row: Post) => (
        <Space>
          <Link to={ROUTES.admin.postDetail(row.id)}>Chi tiết</Link>
          <Popconfirm title="Xóa bài này?" onConfirm={() => remove(row.id)}>
            <Button danger size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Quản lý bài viết</h2>
      <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
    </div>
  );
}
