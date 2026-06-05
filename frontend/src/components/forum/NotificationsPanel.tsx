import React, { useEffect, useState } from 'react';
import { List, Typography, Avatar, Button, Spin, Empty } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, type NotificationItem } from '@/services/notifications/notificationService';
import { io, Socket } from 'socket.io-client';
import { formatViDate } from '@/utils/format';

const { Text } = Typography;

export function NotificationsPanel() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // 1. Gọi API lấy danh sách thông báo khi vừa mở lên
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await notificationService.getMyNotifications();
        // Sắp xếp lại cho chắc chắn mới nhất lên đầu (nếu BE chưa sort)
        setNotifications(data || []);
      } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // 2. Cắm ống Socket.io để nghe ngóng Real-time
    // (Đổi cổng 3000 thành cổng Backend thực tế của sếp nếu cần)
    const socket: Socket = io('http://localhost:3000/notifications', {
      query: { userId: user.id },
      transports: ['websocket'], // Ép dùng websocket cho mượt
    });

    socket.on('connect', () => {
      console.log('⚡ Đã kết nối Socket Thông báo!');
    });

    socket.on('new_notification', (newNoti: NotificationItem) => {
      // Có thông báo mới thì nhét nó lên đỉnh mảng
      setNotifications((prev) => [newNoti, ...prev]);
    });

    return () => {
      // Tắt component thì rút ống Socket ra cho đỡ nặng máy
      socket.disconnect();
    };
  }, [user?.id]);

  // Xử lý khi click vào 1 thông báo
  const handleItemClick = async (item: NotificationItem) => {
    // Nếu chưa đọc thì đánh dấu đã đọc
    if (!item.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      try {
        await notificationService.markAsRead(item.id);
      } catch (error) {
        console.error('Lỗi khi đánh dấu đọc:', error);
      }
    }
    // Chuyển trang đến bài viết
    if (item.link_path) {
      history.push(item.link_path);
    }
  };

  // Đánh dấu đọc tất cả
  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Lỗi khi đánh dấu đọc tất cả:', error);
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 8 }}>
      <div style={{ padding: '12px 18px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
        <Button 
          type="link" 
          icon={<CheckOutlined />} 
          onClick={markAllRead}
          disabled={notifications.every(n => n.is_read) || notifications.length === 0}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      <List
        dataSource={notifications}
        locale={{
          emptyText: <Empty description="Bạn chưa có thông báo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        }}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: '16px 20px',
              cursor: 'pointer',
              // Đổi màu nền nếu chưa đọc (xanh nhạt), đọc rồi thì trắng
              backgroundColor: item.is_read ? '#fff' : '#f0fdf4',
              borderBottom: '1px solid #f1f5f9',
              transition: 'background 0.2s',
            }}
            onClick={() => handleItemClick(item)}
            className="hover:bg-gray-50" // Nếu sếp có dùng Tailwind
          >
            <List.Item.Meta
              avatar={
                <Avatar 
                  icon={<BellOutlined />} 
                  style={{ 
                    backgroundColor: item.is_read ? '#cbd5e1' : '#3b82f6',
                    marginTop: 4 
                  }} 
                />
              }
              title={
                <Text strong={!item.is_read} style={{ fontSize: 15, color: '#0f172a' }}>
                  {item.title || 'Thông báo mới'}
                </Text>
              }
              description={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <Text style={{ color: '#475569' }}>{item.content}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.created_at ? formatViDate(item.created_at) : 'Vừa xong'}
                  </Text>
                </div>
              }
            />
            {!item.is_read && (
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6', marginLeft: 16, flexShrink: 0 }} />
            )}
          </List.Item>
        )}
      />
    </div>
  );
}