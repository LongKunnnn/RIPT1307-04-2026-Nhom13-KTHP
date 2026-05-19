import { useMemo } from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { FileTextOutlined, UserOutlined, CommentOutlined, LockOutlined, SafetyCertificateOutlined, FlagOutlined } from '@ant-design/icons';
import { Link } from 'umi';
import { ROUTES } from '@/constants/routes';
import { adminService } from '@/services/admin/adminService';

export default function AdminDashboardPage() {
  const stats = useMemo(() => adminService.getStats(), []);

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
