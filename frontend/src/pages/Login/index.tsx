import React from 'react';
import { Form, Input, Button, Checkbox, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useLoginLogic } from './useLoginLogic';
import { ILoginFormValues } from './types';
import styles from './index.module.less';

const LoginPage: React.FC = () => {
  // Lấy các logic từ custom hook
  const { loading, handleLogin } = useLoginLogic();
  const [form] = Form.useForm<ILoginFormValues>();

  const onFinish = (values: ILoginFormValues) => {
    handleLogin(values);
  };

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard} bordered={false}>
        <div className={styles.header}>
          <h2>Đăng Nhập</h2>
          <p>Vui lòng đăng nhập để tiếp tục</p>
        </div>

        <Form
          form={form}
          name="loginForm"
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          {/* Trường Email: Yêu cầu không trống và đúng định dạng email */}
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không đúng định dạng!' },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email" 
              allowClear 
            />
          </Form.Item>

          {/* Trường Mật khẩu: Yêu cầu không trống và tối thiểu 6 ký tự */}
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập Mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Mật khẩu" 
            />
          </Form.Item>

          {/* Ghi nhớ đăng nhập / Quên mật khẩu */}
          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>
            <a className={styles.forgotPassword} href="#">
              Quên mật khẩu?
            </a>
          </Form.Item>

          {/* Nút Submit */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className={styles.loginButton}
              loading={loading}
            >
              Đăng Nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
