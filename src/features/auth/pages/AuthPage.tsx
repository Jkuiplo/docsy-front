import { LockOutlined, MailOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Card, Form, Input, Segmented, Space, Typography, message } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../../shared/api/axios';
import { authApi } from '../../../shared/api/docsy';
import { useAuthStore } from '../store';

const { Title, Text } = Typography;

type AuthMode = 'login' | 'register';

interface LoginValues {
  email: string;
  password: string;
}

interface RegisterValues extends LoginValues {
  fullName: string;
  positionTitle: string;
}

export const AuthPage = () => {
  const [form] = Form.useForm<LoginValues & RegisterValues>();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);
  const mode = Form.useWatch('mode', form) as AuthMode | undefined;
  const currentMode = mode ?? 'login';

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      setSession(response.token, response.user);
      navigate(response.user.emailVerified ? '/' : '/verify-needed', { replace: true });
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      setSession(response.token, response.user);
      navigate(response.user.emailVerified ? '/' : '/verify-needed', { replace: true });
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });

  if (token) {
    return <Navigate to="/" replace />;
  }

  const onFinish = (values: LoginValues & RegisterValues) => {
    if (currentMode === 'login') {
      loginMutation.mutate({ email: values.email, password: values.password });
      return;
    }

    registerMutation.mutate({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      positionTitle: values.positionTitle,
    });
  };

  return (
    <main className="auth-page">
      <Card className="auth-panel" bordered={false}>
        <Space direction="vertical" size={24} className="full-width">
          <div>
            <Title level={1}>Docsy</Title>
            <Text type="secondary">Document workflows for teams that need review discipline.</Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ mode: 'login' }}
            onFinish={onFinish}
          >
            <Form.Item name="mode">
              <Segmented
                block
                options={[
                  { label: 'Sign in', value: 'login' },
                  { label: 'Create account', value: 'register' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
            >
              <Input size="large" prefix={<MailOutlined />} autoComplete="email" />
            </Form.Item>

            {currentMode === 'register' && (
              <>
                <Form.Item
                  label="Full name"
                  name="fullName"
                  rules={[{ required: true, message: 'Enter your full name' }]}
                >
                  <Input size="large" prefix={<UserOutlined />} autoComplete="name" />
                </Form.Item>

                <Form.Item
                  label="Position title"
                  name="positionTitle"
                  rules={[{ required: true, message: 'Enter your position title' }]}
                >
                  <Input size="large" prefix={<TeamOutlined />} />
                </Form.Item>
              </>
            )}

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}
            >
              <Input.Password size="large" prefix={<LockOutlined />} autoComplete="current-password" />
            </Form.Item>

            {currentMode === 'register' && (
              <Alert
                showIcon
                type="info"
                className="form-note"
                message="You may need to verify your email before using workspaces."
              />
            )}

            <Button
              block
              type="primary"
              htmlType="submit"
              size="large"
              loading={loginMutation.isPending || registerMutation.isPending}
            >
              {currentMode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </Form>
        </Space>
      </Card>
    </main>
  );
};
