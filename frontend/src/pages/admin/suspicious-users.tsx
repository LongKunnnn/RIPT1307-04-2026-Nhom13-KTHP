import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, Tag, message } from 'antd';
import { apiFetch } from '@/services/api/client';
import styles from './suspicious-users.less';

export default function SuspiciousUsers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSuspicious = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/suspicious-votes', { method: 'GET' });
      setData(res as any);
    } catch (error) {
      message.error('Không thể tải danh sách tình nghi!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuspicious();
  }, []);

  const handleResetPoints = async (userId: number) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/reset-points`, { method: 'POST' });
      message.success('Đã reset điểm trùm cuối về 0!');
      fetchSuspicious();
    } catch (error) {
      message.error('Lỗi khi reset điểm!');
    }
  };

  const handleBanUser = async (userId: number) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/ban`, { method: 'POST' });
      message.error('Đã khóa acc clone!');
      fetchSuspicious();
    } catch (error) {
      message.error('Lỗi khi khóa tài khoản!');
    }
  };

  const columns = [
    {
      title: 'Kẻ Tình Nghi (Voter)',
      key: 'voter',
      // Sửa ở đây: Thêm _: any
      render: (_: any, record: any) => (
        <div className={styles.userMeta}>
          <strong>{record.voter.name}</strong>
          <small>{record.voter.email}</small>
          <div><Tag color="blue">Uy tín gốc: {record.voter.reward_points}</Tag></div>
        </div>
      ),
    },
    {
      title: 'Tần Suất Bơm',
      dataIndex: 'vote_count',
      key: 'vote_count',
      align: 'center' as const,
      render: (count: number) => (
        <Tag color="error" style={{ fontSize: '14px', padding: '4px 8px', fontWeight: 600 }}>
          {count} lần
        </Tag>
      ),
    },
    {
      title: 'Trùm Cuối (Receiver)',
      key: 'receiver',
      // Sửa ở đây: Thêm _: any
      render: (_: any, record: any) => (
        <div className={styles.userMeta}>
          <strong>{record.receiver.name}</strong>
          <small>{record.receiver.email}</small>
          <div><Tag color="gold">Hiện có: {record.receiver.reward_points}</Tag></div>
        </div>
      ),
    },
    {
      title: 'Hành Động',
      key: 'action',
      align: 'center' as const,
      // Sửa ở đây: Thêm _: any
      render: (_: any, record: any) => (
        <Space size="middle">
          <Popconfirm
            title="Khóa vĩnh viễn tài khoản clone này?"
            onConfirm={() => handleBanUser(record.voter.id)}
            okText="Khóa luôn"
            cancelText="Hủy"
          >
            <Button type="primary" danger ghost>Ban Acc Clone</Button>
          </Popconfirm>

          <Popconfirm
            title="Xóa sạch điểm uy tín của kẻ chủ mưu?"
            onConfirm={() => handleResetPoints(record.receiver.id)}
            okText="Reset"
            cancelText="Hủy"
          >
            <Button type="primary" danger>Reset Điểm</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.adminContainer}>
      <div className={styles.headerSection}>
        <h2>🕵️‍♂️ HỆ THỐNG KIỂM VAR GIAN LẬN</h2>
        <p>Tự động quét và liệt kê các cặp tài khoản có tỷ lệ tương tác chéo bất thường (từ 5 lần trở lên).</p>
      </div>
      
      <div className={styles.tableSection}>
        <Table 
          columns={columns} 
          dataSource={data} 
          loading={loading}
          bordered
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
}