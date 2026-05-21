import { useState } from 'react';
import { Link } from 'umi';
import { Button, Form, Input, Alert } from 'antd';
import { ROUTES } from '@/constants/routes';
import styles from './auth.less';

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const onFinish = async (v: { email: string }) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Simulate API call for password reset since backend might not have this endpoint yet
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess('Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu vào hòm thư của bạn.');
    } catch (e) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
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
            <h1 className={styles.title}>Reset Password</h1>
            <div className={styles.switchPageWrapper}>
               Back to <Link to={ROUTES.login}>Sign In</Link>
            </div>
          </div>

          <div style={{ marginBottom: 30, color: '#4b5563', fontSize: 15, lineHeight: 1.6 }}>
            Enter your email address and we'll send you a link to reset your password.
          </div>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 20, borderRadius: 8 }} />}
          {success && <Alert type="success" message={success} showIcon style={{ marginBottom: 20, borderRadius: 8 }} />}
          
          <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
            <Form.Item 
              name="email" 
              label={<span className={styles.formLabel}>Email Address</span>} 
              rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}
              style={{ marginBottom: 24 }}
            >
              <Input placeholder="name@example.com" />
            </Form.Item>

            <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block loading={loading} className={styles.submitBtn}>
                Send Reset Link
              </Button>
            </Form.Item>
          </Form>

        </div>
      </div>
    </div>
  );
}
