import { useState } from 'react';
import { Link } from 'umi';
import { Button, Card, Form, Input, Typography, Alert } from 'antd';
import { ROUTES } from '@/constants/routes';
import styles from './auth.less';

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onFinish = async (v: { email: string }) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      // logic demo quên mật khẩu
      await new Promise((res) => setTimeout(res, 1000));
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gửi yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <Card title="Quên mật khẩu" className={styles.card}>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        {success && <Alert type="success" message="Hướng dẫn khôi phục mật khẩu đã được gửi đến email của bạn." showIcon style={{ marginBottom: 16 }} />}
        
        <Typography.Paragraph>
          Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
        </Typography.Paragraph>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Nhập địa chỉ email" />
          </Form.Item>
          
          <Button type="primary" htmlType="submit" block loading={loading} style={{ marginBottom: 16 }}>
            Gửi yêu cầu
          </Button>
        </Form>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to={ROUTES.login}>Đã nhớ lại mật khẩu? Đăng nhập</Link>
          <Link to={ROUTES.register}>Chưa có tài khoản? Đăng ký</Link>
        </div>
      </Card>
    </div>
  );
}
