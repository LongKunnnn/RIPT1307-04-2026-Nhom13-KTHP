import { useState } from 'react';
import { Link, history } from 'umi';
import { Button, Card, Form, Input, Typography, Alert } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { DEMO_PASSWORD } from '@/services/mock/seed';
import styles from './auth.less';

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onFinish = async (v: { email: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const u = await login(v.email, v.password);
      const state = history.location.state as { from?: string } | undefined;
      const from = state?.from;
      if (from && from.startsWith('/admin') && u.role === 'ADMIN') {
        history.push(from);
      } else if (u.role === 'ADMIN') {
        history.push(ROUTES.admin.root);
      } else if (from) {
        history.push(from);
      } else {
        history.push(ROUTES.home);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <Card title="Đăng nhập" className={styles.card}>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="admin@svforum.vn" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
            <Input.Password placeholder={DEMO_PASSWORD} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Đăng nhập
          </Button>
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Link to={ROUTES.forgotPassword}>Quên mật khẩu?</Link>
          </div>
        </Form>
        <Typography.Paragraph className={styles.hint}>
          Demo: admin@svforum.vn / giangvien@svforum.vn / sinhvien@svforum.vn — mật khẩu <strong>{DEMO_PASSWORD}</strong>
        </Typography.Paragraph>
        <Link to={ROUTES.register}>Chưa có tài khoản? Đăng ký</Link>
      </Card>
    </div>
  );
}
