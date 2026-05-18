import { useEffect, useState } from 'react';
import { Link } from 'umi';
import { Alert, Button, Popconfirm, Space, Table, Tag, message } from 'antd';
import { adminService } from '@/services/admin/adminService';
import { ROUTES } from '@/constants/routes';
import { formatViDate, roleLabel } from '@/utils/format';
import type { Post } from '@/types';

export default function AdminPostsPage() {
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    adminService
      .listPosts()
      .then(setData)
      .catch((e) => {
        setData([]);
        setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách bài viết');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    try {
      await adminService.deletePost(id);
      message.success('Đã xóa bài viết');
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không xóa được');
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
      {loadError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Không tải được dữ liệu"
          description={loadError}
          action={
            <Button size="small" onClick={load}>
              Thử lại
            </Button>
          }
        />
      ) : null}
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  );
}
