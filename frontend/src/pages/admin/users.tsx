import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  adminService,
  assertAdminUserAction,
  type UpsertUserInput,
} from '@/services/admin/adminService';
import type { User, UserRole } from '@/types';
import { formatViDate, roleLabel } from '@/utils/format';
import { DEMO_PASSWORD } from '@/services/mock/seed';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const actorId = currentUser?.id ?? null;
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm<UpsertUserInput>();
  const data = useMemo(() => adminService.listUsers(), [tick]);

  const guardTip = (targetId: string, action: 'delete' | 'lock' | 'demote') => {
    try {
      assertAdminUserAction(targetId, action, actorId);
      return undefined;
    } catch (e) {
      return e instanceof Error ? e.message : 'Không được phép';
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ role: 'STUDENT', password: DEMO_PASSWORD });
    setOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    form.setFieldsValue({
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      faculty: u.faculty,
    });
    setOpen(true);
  };

  const save = async () => {
    const v = await form.validateFields();
    try {
      if (editing) adminService.updateUser(editing.id, v, actorId);
      else adminService.createUser(v);
      message.success('Đã lưu người dùng');
      setOpen(false);
      setTick((t) => t + 1);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Lỗi');
    }
  };

  const columns = [
    { title: 'Họ tên', dataIndex: 'displayName' },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      render: (r: UserRole) => <Tag color={r === 'ADMIN' ? 'red' : 'blue'}>{roleLabel(r)}</Tag>,
    },
    {
      title: 'Khóa',
      dataIndex: 'locked',
      render: (locked: boolean, row: User) => {
        const lockTip = guardTip(row.id, 'lock');
        const switchEl = (
          <Switch
            checked={locked}
            disabled={!!lockTip && !locked}
            onChange={(v) => {
              try {
                adminService.setLocked(row.id, v, actorId);
                setTick((t) => t + 1);
                message.success(v ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
              } catch (e) {
                message.error(e instanceof Error ? e.message : 'Lỗi');
              }
            }}
          />
        );
        return lockTip && !locked ? <Tooltip title={lockTip}>{switchEl}</Tooltip> : switchEl;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: (v: string) => formatViDate(v),
    },
    {
      title: 'Thao tác',
      render: (_: unknown, row: User) => {
        const deleteTip = guardTip(row.id, 'delete');
        const isSelf = row.id === actorId;
        return (
          <Space wrap>
            <Button size="small" onClick={() => openEdit(row)}>
              Sửa
            </Button>
            <Button
              size="small"
              onClick={() => {
                adminService.resetPassword(row.id, DEMO_PASSWORD);
                message.success(`Đã đặt lại mật khẩu: ${DEMO_PASSWORD}`);
              }}
            >
              Cấp lại MK
            </Button>
            {deleteTip ? (
              <Tooltip title={deleteTip}>
                <Button danger size="small" disabled>
                  Xóa
                </Button>
              </Tooltip>
            ) : (
              <Popconfirm
                title="Xóa người dùng?"
                onConfirm={() => {
                  try {
                    adminService.deleteUser(row.id, actorId);
                    setTick((t) => t + 1);
                    message.success('Đã xóa người dùng');
                  } catch (e) {
                    message.error(e instanceof Error ? e.message : 'Lỗi');
                  }
                }}
              >
                <Button danger size="small">
                  Xóa
                </Button>
              </Popconfirm>
            )}
            {isSelf && (
              <Tag color="blue" style={{ margin: 0 }}>
                Bạn
              </Tag>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
        <Space wrap>
          <h2 style={{ margin: 0 }}>Quản lý người dùng</h2>
          <Button type="primary" onClick={openCreate}>
            Thêm người dùng
          </Button>
        </Space>
        <Alert
          type="info"
          showIcon
          message="Bảo vệ tài khoản quản trị"
          description="Không thể tự khóa, tự xóa hoặc tự hạ quyền admin. Hệ thống luôn giữ ít nhất một quản trị viên đang hoạt động."
        />
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 8 }} />
      <Modal
        title={editing ? 'Sửa người dùng' : 'Thêm người dùng'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="displayName" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select
              disabled={editing?.id === actorId}
              options={[
                { value: 'STUDENT', label: 'Sinh viên' },
                { value: 'LECTURER', label: 'Giảng viên' },
                { value: 'ADMIN', label: 'Quản trị' },
              ]}
            />
          </Form.Item>
          {editing?.id === actorId && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message="Đây là tài khoản của bạn — không thể đổi vai trò."
            />
          )}
          <Form.Item name="faculty" label="Khoa">
            <Input />
          </Form.Item>
          {!editing && (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
          )}
          {editing && (
            <Form.Item name="password" label="Mật khẩu mới (tuỳ chọn)">
              <Input.Password />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
