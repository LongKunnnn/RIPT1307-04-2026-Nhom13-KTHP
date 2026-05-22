import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Row, Statistic, Spin } from 'antd';
import { FileTextOutlined, UserOutlined, CommentOutlined, LockOutlined, SafetyCertificateOutlined, FlagOutlined } from '@ant-design/icons';
import { Link } from 'umi';
import { ROUTES } from '@/constants/routes';
import { adminService } from '@/services/admin/adminService';
import type { AdminStats } from '@/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminService
      .getStats()
      .then((s) => {
        setStats(s);
      })
      .catch((e) => {
        setStats(null);
        setError(e instanceof Error ? e.message : 'Không tải được thống kê');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <Spin style={{ display: 'block', margin: '48px auto' }} />;
  }

  if (error || !stats) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được tổng quan"
        description={error ?? 'Không có dữ liệu'}
        action={
          <Button type="primary" size="small" onClick={load}>
            Thử lại
          </Button>
        }
        style={{ maxWidth: 560 }}
      />
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Tổng quan</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Bài đăng" value={stats.postCount} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Người dùng" value={stats.userCount} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Bình luận" value={stats.commentCount} prefix={<CommentOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Tài khoản khóa" value={stats.lockedUserCount} prefix={<LockOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Link to={ROUTES.admin.moderation}>
              <Statistic title="Hàng đợi kiểm duyệt" value={stats.moderationQueueCount} prefix={<SafetyCertificateOutlined />} />
            </Link>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Báo cáo đang mở" value={stats.openReportCount} prefix={<FlagOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
