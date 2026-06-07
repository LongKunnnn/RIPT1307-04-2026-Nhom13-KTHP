import { useState } from "react";
import { Link, history } from "umi";
import { Button, Form, Input, Select, Alert, DatePicker, Row, Col } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import type { RegisterInput } from "@/types";
import styles from "./auth.less";

export default function RegisterPage() {
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    setError("");
    try {
      const input: RegisterInput & { birthday?: string } = {
        ...values,
        email: values.email.trim(),
        birthday: values.birthday?.format("YYYY-MM-DD"),
      };
      await register(input);
      history.push(ROUTES.home);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.splitContainer}>
        <div className={styles.leftPane}></div>
        <div className={styles.rightPane}>
          <div className={styles.header} style={{ marginBottom: 30 }}>
            <h1 className={styles.title}>Create Account</h1>
            <div className={styles.switchPageWrapper}>
              Already have an account? <Link to={ROUTES.login}>Sign In</Link>
            </div>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              style={{ marginBottom: 24, borderRadius: 8 }}
            />
          )}

          <Form
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ role: "student" }}
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="displayName"
              label={<span className={styles.formLabel}>Họ tên</span>}
              rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder="Full Name" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label={<span className={styles.formLabel}>Email</span>}
                  rules={[
                    {
                      required: true,
                      type: "email",
                      message: "Email không hợp lệ!",
                    },
                  ]}
                  normalize={(value) => value?.trim()}
                  style={{ marginBottom: 16 }}
                >
                  <Input placeholder="Email Address" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label={<span className={styles.formLabel}>Mật khẩu</span>}
                  rules={[
                    {
                      required: true,
                      min: 6,
                      message: "Mật khẩu ít nhất 6 ký tự!",
                    },
                  ]}
                  style={{ marginBottom: 16 }}
                >
                  <Input.Password placeholder="Password" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="role"
                  label={<span className={styles.formLabel}>Vai trò</span>}
                  rules={[{ required: true }]}
                  style={{ marginBottom: 16 }}
                >
                  <Select
                    options={[
                      { value: "student", label: "Sinh viên" },
                      { value: "teacher", label: "Giảng viên" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="birthday"
                  label={<span className={styles.formLabel}>Ngày sinh</span>}
                  style={{ marginBottom: 16 }}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày sinh"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="faculty"
              label={<span className={styles.formLabel}>Khoa / Đơn vị</span>}
              style={{ marginBottom: 20 }}
            >
              <Input placeholder="VD: Khoa CNTT" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 10 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className={styles.submitBtn}
              >
                Sign Up
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
