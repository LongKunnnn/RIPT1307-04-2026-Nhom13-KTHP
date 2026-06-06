import { useState } from "react";
import { Link, history } from "umi";
import { Button, Card, Form, Input, Typography, Alert, message } from "antd";
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
      <Card title="Đăng nhập" className={styles.card}>
        {error && (
          <Alert
            type="warning"
            message="Đăng nhập không thành công"
            description={error}
            showIcon
            closable
            onClose={() => setError("")}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
            normalize={(value) => value?.trim()}
          >
            <Input placeholder="admin@svforum.vn" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true }]}
          >
            <Input.Password placeholder={DEMO_PASSWORD} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Đăng nhập
          </Button>
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <Link to={ROUTES.forgotPassword}>Quên mật khẩu?</Link>
          </div>
        </Form>
        <Typography.Paragraph className={styles.hint}>
          Demo: admin@svforum.vn / giangvien@svforum.vn / sinhvien@svforum.vn —
          mật khẩu <strong>{DEMO_PASSWORD}</strong>
        </Typography.Paragraph>
        <Link to={ROUTES.register}>Chưa có tài khoản? Đăng ký</Link>
      </Card>
    </div>
  );
}
