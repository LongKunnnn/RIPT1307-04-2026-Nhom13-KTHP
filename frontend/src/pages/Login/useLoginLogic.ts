import { useState } from 'react';
import { useModel, history } from 'umi';
import { ILoginFormValues, ILoginResponse } from './types';
import { message } from 'antd';

export const useLoginLogic = () => {
  const [loading, setLoading] = useState<boolean>(false);
  // Lấy hàm login từ global state của Umi (plugin-model)
  const { login } = useModel('useAuthModel');

  const handleLogin = async (values: ILoginFormValues) => {
    setLoading(true);
    try {
      // Giả lập gọi API đăng nhập
      const response: ILoginResponse = await new Promise((resolve) =>
        setTimeout(() => {
          if (values.email === 'admin@gmail.com' && values.password === '123456') {
            resolve({
              success: true,
              data: {
                token: 'mock-token-xyz',
                user: { id: '1', email: 'admin@gmail.com', fullName: 'Admin', role: 'ADMIN' },
              },
            });
          } else {
            resolve({
              success: false,
              message: 'Email hoặc mật khẩu không chính xác',
            });
          }
        }, 1000)
      );

      if (response.success && response.data) {
        message.success('Đăng nhập thành công!');

        // 1. Cập nhật thông tin user vào global state
        login(response.data.user);

        // 2. Logic "Ghi nhớ đăng nhập"
        if (values.remember) {
          localStorage.setItem('savedEmail', values.email);
        } else {
          localStorage.removeItem('savedEmail');
        }

        // 3. Điều hướng sang trang chủ
        history.push('/');
      } else {
        message.error(response.message || 'Đăng nhập thất bại!');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLogin,
  };
};
