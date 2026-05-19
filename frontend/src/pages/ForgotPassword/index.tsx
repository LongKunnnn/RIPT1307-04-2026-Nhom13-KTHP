import React from 'react';
import { Form, Input, Button } from 'antd';
import { history } from '@umijs/max';
import styles from './index.module.less';

const ForgotPasswordPage: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Forgot password values:', values);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Left Side - Image */}
        <div className={styles.leftSide}>
          <div className={styles.logoBadge}>CLASSIC DESIGNS</div>
        </div>

        {/* Right Side - Form */}
        <div className={styles.rightSide}>
          <div className={styles.topRightLink}>
            <span>Remember your password?</span>
            <a onClick={(e) => { e.preventDefault(); history.push('/login'); }}>Sign In</a>
          </div>

          <div className={styles.formContainer}>
            <h2 className={styles.title}>Forgot Password</h2>
            <p className={styles.subtitle}>
              Enter your email address to receive a password reset link.
            </p>

            <Form
              form={form}
              onFinish={onFinish}
            >
              <div className={styles.inputGroup}>
                <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Please input a valid email' }]}>
                  <Input placeholder="Email Address" className={styles.input} bordered={false} />
                </Form.Item>
              </div>

              <Form.Item>
                <Button type="primary" htmlType="submit" className={styles.submitBtn}>
                  Send Reset Link
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
