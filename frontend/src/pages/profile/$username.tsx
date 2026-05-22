import { useEffect, useState } from 'react';
import { useParams, Link } from 'umi';
import {
  Card,
  Typography,
  Avatar,
  Space,
  Divider,
  Skeleton,
  Button,
  Result,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  GlobalOutlined,
  TrophyOutlined,
  BankOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { authService } from '@/services/auth/authService';
import { formatViDate } from '@/utils/format';
import type { User } from '@/types';
import styles from './profile.less';

const { Title, Text, Paragraph } = Typography;

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      setLoading(true);
      authService.getPublicProfile(username)
        .then(setUser)
        .catch((e) => setError(e instanceof Error ? e.message : 'Không tìm thấy người dùng'))
        .finally(() => setLoading(false));
    }
  }, [username]);

  if (loading) return <div className={styles.container}><Skeleton active avatar paragraph={{ rows: 10 }} /></div>;

  if (error || !user) {
    return (
      <div className={styles.container}>
        <Result
          status="404"
          title="Không tìm thấy người dùng"
          subTitle={error}
          extra={<Link to="/"><Button type="primary">Quay lại trang chủ</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/">
          <Button icon={<ArrowLeftOutlined />} type="link">Quay lại bảng tin</Button>
        </Link>
      </div>
      
      <Card className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <Avatar size={100} icon={<UserOutlined />} src={user.avatarUrl} />
          <Title level={2} className={styles.displayName}>
            {user.displayName}
          </Title>
          <Text className={styles.username}>@{user.username}</Text>
          <div className={styles.statsRow}>
            <Space direction="vertical" align="center">
              <TrophyOutlined style={{ fontSize: 24, color: '#f59e0b' }} />
              <Text strong>{user.rewardPoints?.toLocaleString('vi-VN')} điểm</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>Điểm uy tín</Text>
            </Space>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.sectionTitle}>
            <UserOutlined /> Thông tin thành viên
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Khoa / Đơn vị</label>
              <span><BankOutlined /> {user.faculty || 'Không công khai'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Ngày tham gia</label>
              <span><CalendarOutlined /> {formatViDate(user.createdAt)}</span>
            </div>
            {user.bio && (
              <div className={styles.bio}>
                <Paragraph>{user.bio}</Paragraph>
              </div>
            )}
          </div>

          <Divider />
          
          <div className={styles.sectionTitle}>
            <GlobalOutlined /> Liên kết mạng xã hội
          </div>
          <div className={styles.socialLinks}>
            {user.socialLinks && Object.entries(user.socialLinks).map(([key, url]) => (
              url && (
                <Button 
                  key={key} 
                  type="default" 
                  className={styles.socialBtn}
                  onClick={() => window.open(url.startsWith('http') ? url : `https://${url}`, '_blank')}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Button>
              )
            ))}
            {(!user.socialLinks || Object.values(user.socialLinks).every(v => !v)) && (
              <Text type="secondary">Thành viên chưa thêm liên kết xã hội</Text>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
