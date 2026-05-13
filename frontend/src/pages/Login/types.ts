export interface ILoginResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
    };
  };
}

export interface ILoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}
