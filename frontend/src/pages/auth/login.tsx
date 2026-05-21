import { useState } from 'react';
import { Link, history } from 'umi';
import { Button, Form, Input, Typography, Alert } from 'antd';
import { GoogleOutlined, FacebookOutlined } from '@ant-design/icons';
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
      <div className={styles.splitContainer}>
        <div className={styles.leftPane}>
          <div className={styles.logoBox}>CLASSIC DESIGNS</div>
        </div>
        <div className={styles.rightPane}>
          <div className={styles.header}>
            <h1 className={styles.title}>Sign In</h1>
            <div className={styles.switchPageWrapper}>
              New here? <Link to={ROUTES.register}>Sign Up</Link>
            </div>
          </div>

          <div className={styles.socialButtons}>
            <button className={styles.socialBtn}>
              <GoogleOutlined className={styles.icon} style={{ color: '#EA4335' }} />
              Sign In With Google
            </button>
            <button className={styles.socialBtn}>
              <FacebookOutlined className={styles.icon} style={{ color: '#1877F2' }} />
              Sign In With Facebook
            </button>
          </div>

          <div className={styles.divider}>
            <span>Or sign in with email</span>
          </div>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 20, borderRadius: 8 }} />}
          
          <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
            <Form.Item 
              name="email" 
              label={<span className={styles.formLabel}>Email Address</span>} 
              rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}
              style={{ marginBottom: 20 }}
            >
              <Input placeholder="name@example.com" />
            </Form.Item>

            <Form.Item 
              name="password" 
              label={<span className={styles.formLabel}>Password</span>} 
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              style={{ marginBottom: 8 }}
            >
              <Input.Password placeholder="Enter your password" />
            </Form.Item>

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <Link to={ROUTES.forgotPassword} style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block loading={loading} className={styles.submitBtn}>
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Typography.Paragraph className={styles.hint}>
            Demo: admin@svforum.vn / giangvien@svforum.vn / sinhvien@svforum.vn<br />Mật khẩu: <strong>{DEMO_PASSWORD}</strong>
          </Typography.Paragraph>
        </div>
      </div>
    </div>
  );
}
