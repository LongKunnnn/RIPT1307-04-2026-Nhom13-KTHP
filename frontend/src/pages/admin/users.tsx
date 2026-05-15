import { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import { adminService, type UpsertUserInput } from '@/services/admin/adminService';
import type { User, UserRole } from '@/types';
import { formatViDate, roleLabel } from '@/utils/format';
import { DEMO_PASSWORD } from '@/services/mock/seed';

export default function AdminUsersPage() {
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm<UpsertUserInput>();
  const data = useMemo(() => adminService.listUsers(), [tick]);

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
      if (editing) adminService.updateUser(editing.id, v);
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
      render: (locked: boolean, row: User) => (
        <Switch
          checked={locked}
          onChange={(v) => {
            adminService.setLocked(row.id, v);
            setTick((t) => t + 1);
          }}
        />
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: (v: string) => formatViDate(v),
    },
    {
      title: 'Thao tác',
      render: (_: unknown, row: User) => (
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
          <Popconfirm
            title="Xóa người dùng?"
            onConfirm={() => {
              adminService.deleteUser(row.id);
              setTick((t) => t + 1);
            }}
          >
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
      <Space style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Quản lý người dùng</h2>
        <Button type="primary" onClick={openCreate}>
          Thêm người dùng
        </Button>
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
              options={[
                { value: 'STUDENT', label: 'Sinh viên' },
                { value: 'LECTURER', label: 'Giảng viên' },
                { value: 'ADMIN', label: 'Quản trị' },
              ]}
            />
          </Form.Item>
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
