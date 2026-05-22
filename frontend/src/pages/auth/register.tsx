import { useState } from "react";
import { Link, history } from "umi";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  Alert,
  DatePicker,
} from "antd";
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
      <Card title="Đăng ký tài khoản" className={styles.card}>
        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ role: "STUDENT" }}
        >
          <Form.Item
            name="displayName"
            label="Họ tên"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="birthday" label="Ngày sinh">
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Chọn ngày sinh"
              format="DD/MM/YYYY"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "STUDENT", label: "Sinh viên" },
                { value: "LECTURER", label: "Giảng viên" },
              ]}
            />
          </Form.Item>
          <Form.Item name="faculty" label="Khoa / Đơn vị">
            <Input placeholder="VD: Khoa CNTT" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Đăng ký
          </Button>
        </Form>
        <Typography.Paragraph className={styles.hint}>
          <Link to={ROUTES.login}>Đã có tài khoản? Đăng nhập</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
