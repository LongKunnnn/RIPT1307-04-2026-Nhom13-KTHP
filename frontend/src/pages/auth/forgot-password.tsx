import { useState } from 'react';
import { Link } from 'umi';
import { Button, Card, Form, Input, Typography, Alert, Space } from 'antd';
import { authService } from '@/services/auth/authService';
import { ROUTES } from '@/constants/routes';
import styles from './auth.less';

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoToken, setDemoToken] = useState('');

  const onFinish = async (v: { email: string }) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await authService.forgotPassword(v.email);
      setSuccess(res.message);
      if (res.resetToken) {
        setDemoToken(res.resetToken);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <Card title="Quên mật khẩu" className={styles.card}>
        <Typography.Paragraph>
          Vui lòng nhập email của bạn. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu nếu email tồn tại trong hệ thống.
        </Typography.Paragraph>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        {success && <Alert type="success" message={success} showIcon style={{ marginBottom: 16 }} />}

        {!success ? (
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Định dạng email không hợp lệ' },
              ]}
            >
              <Input placeholder="example@svforum.vn" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Gửi yêu cầu
            </Button>
          </Form>
        ) : (
          <div style={{ marginTop: 16 }}>
            {demoToken && (
              <Alert
                type="info"
                message="Demo Mode: Reset Token"
                description={
                  <div>
                    <p>Vì đây là môi trường demo, token đã được trả về trực tiếp:</p>
                    <code>{demoToken}</code>
                    <div style={{ marginTop: 8 }}>
                      <Link to={`${ROUTES.resetPassword}?token=${demoToken}`}>
                        <Button type="link" size="small">Đi đến trang đặt lại mật khẩu</Button>
                      </Link>
                    </div>
                  </div>
                }
                style={{ marginBottom: 16 }}
              />
            )}
            <Link to={ROUTES.login}>Quay lại đăng nhập</Link>
          </div>
        )}

        {!success && (
          <div style={{ marginTop: 16 }}>
            <Link to={ROUTES.login}>Quay lại đăng nhập</Link>
          </div>
        )}
      </Card>
    </div>
  );
}
