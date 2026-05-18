import {
  AuditOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  LockOutlined,
  MailOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Card, Form, Input, Segmented, Space, Typography, message } from 'antd';
import { useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ThemeModeControl } from '../../../app/theme';
import { getApiErrorMessage } from '../../../shared/api/axios';
import { authApi } from '../../../shared/api/docsy';
import { useAuthStore } from '../store';

const { Title, Text, Paragraph } = Typography;

type AuthMode = 'login' | 'register';

interface LoginValues {
  email: string;
  password: string;
}

interface RegisterValues extends LoginValues {
  fullName: string;
  positionTitle: string;
}

interface AuthFormValues extends RegisterValues {
  mode: AuthMode;
}

export const AuthPage = () => {
  const [form] = Form.useForm<AuthFormValues>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);
  const mode = Form.useWatch('mode', form) as AuthMode | undefined;
  const currentMode = mode ?? 'login';
  const requestedMode = params.get('mode') === 'register' ? 'register' : 'login';

  useEffect(() => {
    form.setFieldValue('mode', requestedMode);
  }, [form, requestedMode]);

  const afterAuth = (response: Awaited<ReturnType<typeof authApi.login>>) => {
    setSession(response.token, response.user);
    navigate('/', { replace: true });
  };

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: afterAuth,
    onError: (error) => message.error(getApiErrorMessage(error)),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: afterAuth,
    onError: (error) => message.error(getApiErrorMessage(error)),
  });

  if (token) {
    return <Navigate to="/" replace />;
  }

  const onFinish = (values: AuthFormValues) => {
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
      <div className="auth-theme-switch">
        <ThemeModeControl />
      </div>
      <section className="auth-shell">
        <aside className="auth-showcase" aria-label="Docsy workflow preview">
          <div className="auth-brand-lockup">
            <span className="brand-mark">D</span>
            <span>Docsy</span>
          </div>
          <div>
            <Title level={1}>Review-ready documents, from draft to archive.</Title>
            <Paragraph>
              Keep templates, authors, reviewers, permissions, and audit history moving in one focused workspace.
            </Paragraph>
          </div>
          <div className="workflow-preview">
            <div className="workflow-card active">
              <FileDoneOutlined />
              <div>
                <strong>Policy update</strong>
                <span>Waiting for review</span>
              </div>
            </div>
            <div className="workflow-card">
              <AuditOutlined />
              <div>
                <strong>Approval log</strong>
                <span>3 tracked decisions</span>
              </div>
            </div>
            <div className="workflow-card complete">
              <CheckCircleOutlined />
              <div>
                <strong>Signed archive</strong>
                <span>Ready for retrieval</span>
              </div>
            </div>
          </div>
          <div className="auth-metrics">
            <span><strong>24</strong> drafts governed</span>
            <span><strong>8</strong> reviews today</span>
            <span><strong>100%</strong> traceable</span>
          </div>
        </aside>

        <Card className="auth-panel" bordered={false}>
          <Space direction="vertical" size={24} className="full-width">
            <div className="auth-mode-copy" key={currentMode}>
              <Text className="auth-eyebrow">Workspace access</Text>
              <Title level={2}>{currentMode === 'login' ? 'Welcome back' : 'Create your Docsy account'}</Title>
              <Text type="secondary">
                {currentMode === 'login'
                  ? 'Sign in to continue managing document workflows.'
                  : 'Start with your identity so reviews and ownership stay clear.'}
              </Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              initialValues={{ mode: requestedMode }}
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

              <div className="auth-form-fields" data-mode={currentMode}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
                >
                  <Input size="large" prefix={<MailOutlined />} autoComplete="email" />
                </Form.Item>

                <div className={`auth-register-fields ${currentMode === 'register' ? 'is-open' : ''}`} aria-hidden={currentMode !== 'register'}>
                  <div className="auth-register-fields-inner">
                    <Form.Item
                      label="Full name"
                      name="fullName"
                      rules={currentMode === 'register' ? [{ required: true, message: 'Enter your full name' }] : []}
                    >
                      <Input
                        size="large"
                        prefix={<UserOutlined />}
                        autoComplete="name"
                        disabled={currentMode !== 'register'}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Position title"
                      name="positionTitle"
                      rules={currentMode === 'register' ? [{ required: true, message: 'Enter your position title' }] : []}
                    >
                      <Input
                        size="large"
                        prefix={<TeamOutlined />}
                        autoComplete="organization-title"
                        disabled={currentMode !== 'register'}
                      />
                    </Form.Item>
                  </div>
                </div>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined />}
                    autoComplete={currentMode === 'login' ? 'current-password' : 'new-password'}
                  />
                </Form.Item>

                <div className={`auth-register-note ${currentMode === 'register' ? 'is-open' : ''}`} aria-hidden={currentMode !== 'register'}>
                  <div>
                    <Alert
                      showIcon
                      type="info"
                      className="form-note"
                      message="Workspace invitations will appear inside your account after registration."
                    />
                  </div>
                </div>
              </div>

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
      </section>
    </main>
  );
};
