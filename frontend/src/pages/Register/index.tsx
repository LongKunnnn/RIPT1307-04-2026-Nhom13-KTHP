import React from 'react';
import { Form, Input, Button } from 'antd';
import { GoogleOutlined, FacebookFilled } from '@ant-design/icons';
import { history } from '@umijs/max';
import styles from './index.module.less';

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Register values:', values);
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
            <span>Already have an account?</span>
            <a onClick={(e) => { e.preventDefault(); history.push('/login'); }}>Sign In</a>
          </div>

          <div className={styles.formContainer}>
            <h2 className={styles.title}>Create Account</h2>

            <div className={styles.socialButtons}>
              <button type="button" className={styles.socialBtn}>
                <GoogleOutlined style={{ color: '#DB4437' }} /> Sign in with Google
              </button>
              <button type="button" className={styles.socialBtn}>
                <FacebookFilled style={{ color: '#4267B2' }} /> Sign in with Facebook
              </button>
            </div>

            <Form
              form={form}
              onFinish={onFinish}
            >
              <div className={styles.inputGroup}>
                <Form.Item name="fullName" rules={[{ required: true, message: 'Please input your full name' }]}>
                  <Input placeholder="Full Name" className={styles.input} bordered={false} />
                </Form.Item>

                <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Please input a valid email' }]}>
                  <Input placeholder="Email Address" className={styles.input} bordered={false} />
                </Form.Item>

                <Form.Item name="password" rules={[{ required: true, message: 'Please input your password' }]}>
                  <Input.Password placeholder="Password" className={styles.input} bordered={false} />
                </Form.Item>
              </div>

              <Form.Item>
                <Button type="primary" htmlType="submit" className={styles.submitBtn}>
                  Sign Up
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
