import { useState } from "react";
import { Link, history } from "umi";
import { Button, Form, Input, Typography, Alert, message } from "antd";
import { GoogleOutlined, FacebookOutlined } from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import { ApiError, getApiErrorMessage } from "@/services/api/client";
import { DEMO_PASSWORD } from "@/services/mock/seed";
import styles from "./auth.less";

const LOGIN_FAIL_MSG =
  "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại và thử lần nữa.";

export default function LoginPage() {
  const { login } = useAuth();
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onFinish = async (v: { email: string; password: string }) => {
    setLoading(true);
    setError("");
    try {
      const trimmedEmail = v.email.trim();
      const u = await login(trimmedEmail, v.password);
      message.success("Đăng nhập thành công");
      const state = history.location.state as { from?: string } | undefined;
      const from = state?.from;
      if (from && from.startsWith("/admin") && u.role === "admin") {
        history.push(from);
      } else if (u.role === "admin") {
        history.push(ROUTES.admin.root);
      } else if (from) {
        history.push(from);
      } else {
        history.push(ROUTES.home);
      }
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 401
          ? LOGIN_FAIL_MSG
          : getApiErrorMessage(e, LOGIN_FAIL_MSG);
      setError(msg);
      message.warning(msg);
      form.setFieldsValue({ password: "" });
      form.focusField("password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.splitContainer}>
        <div className={styles.leftPane}>
        </div>
        <div className={styles.rightPane}>
          <div className={styles.header} style={{ marginBottom: 30 }}>
            <h1 className={styles.title}>Welcome Back</h1>
            <div className={styles.switchPageWrapper}>
              Don't have an account? <Link to={ROUTES.register}>Sign Up</Link>
            </div>
          </div>

          <div className={styles.socialButtons} style={{ marginBottom: 24 }}>
            <button className={styles.socialBtn}>
              <GoogleOutlined
                className={styles.icon}
                style={{ color: "#EA4335" }}
              />
              Sign In With Google
            </button>
            <button className={styles.socialBtn}>
              <FacebookOutlined
                className={styles.icon}
                style={{ color: "#1877F2" }}
              />
              Sign In With Facebook
            </button>
          </div>

          <div className={styles.divider} style={{ marginBottom: 24 }}>
            <span>Or sign in with email</span>
          </div>

          {error && (
            <Alert
              type="error"
              message="Đăng nhập không thành công"
              description={error}
              showIcon
              closable
              onClose={() => setError("")}
              style={{ marginBottom: 24, borderRadius: 8 }}
            />
          )}

          <Form 
            form={form} 
            layout="vertical" 
            onFinish={onFinish}
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label={<span className={styles.formLabel}>Email</span>}
              rules={[{ required: true, type: "email", message: "Vui lòng nhập email!" }]}
              normalize={(value) => value?.trim()}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder="Email Address" />
            </Form.Item>
            
            <Form.Item
              name="password"
              label={<span className={styles.formLabel}>Mật khẩu</span>}
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
            
            <div style={{ marginBottom: 24, textAlign: "right" }}>
              <Link to={ROUTES.forgotPassword} style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 500 }}>
                Quên mật khẩu?
              </Link>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                className={styles.submitBtn}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
          
          <Typography.Paragraph className={styles.hint}>
            Demo: admin@svforum.vn / giangvien@svforum.vn / sinhvien@svforum.vn —
            mật khẩu <strong>{DEMO_PASSWORD}</strong>
          </Typography.Paragraph>
        </div>
      </div>
    </div>
  );
}
