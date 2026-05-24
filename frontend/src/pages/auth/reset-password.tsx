import { useState, useEffect } from 'react';
import { Link, history, useLocation } from 'umi';
import { Button, Card, Form, Input, Typography, Alert, Result } from 'antd';
import { authService } from '@/services/auth/authService';
import { ROUTES } from '@/constants/routes';
import styles from './auth.less';

export default function ResetPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const [form] = Form.useForm();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ hoặc thiếu. Vui lòng kiểm tra lại email của bạn.');
    }
  }, [token]);

  const onFinish = async (v: any) => {
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, v.password);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.wrap}>
        <Card className={styles.card}>
          <Result
            status="success"
            title="Đặt lại mật khẩu thành công"
            subTitle="Bây giờ bạn có thể đăng nhập bằng mật khẩu mới."
            extra={[
              <Button type="primary" key="login" onClick={() => history.push(ROUTES.login)}>
                Đăng nhập ngay
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <Card title="Đặt lại mật khẩu" className={styles.card}>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            name="password"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu mới" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading} disabled={!token}>
            Cập nhật mật khẩu
          </Button>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to={ROUTES.login}>Quay lại đăng nhập</Link>
        </div>
      </Card>
    </div>
  );
}
