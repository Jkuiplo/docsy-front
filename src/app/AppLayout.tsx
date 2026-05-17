import {
  AuditOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  ProfileOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Dropdown, Layout, Menu, Select, Space, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../shared/api/axios';
import { authApi, workspacesApi } from '../shared/api/docsy';
import type { Workspace } from '../shared/api/types';
import { ErrorState, LoadingState } from '../shared/ui';
import { useAuthStore } from '../features/auth/store';
import { useWorkspaceStore } from './workspaceStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const workspaceMenuItems = (workspaceId: string): MenuProps['items'] => [
  { key: `/workspaces/${workspaceId}`, icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: `/workspaces/${workspaceId}/documents`, icon: <FileTextOutlined />, label: 'Documents' },
  { key: `/workspaces/${workspaceId}/templates`, icon: <ProfileOutlined />, label: 'Templates' },
  { key: `/workspaces/${workspaceId}/review`, icon: <FileDoneOutlined />, label: 'Review queue' },
  { key: `/workspaces/${workspaceId}/archive`, icon: <FolderOpenOutlined />, label: 'Archive' },
  { key: `/workspaces/${workspaceId}/members`, icon: <TeamOutlined />, label: 'Members' },
  { key: `/workspaces/${workspaceId}/permissions`, icon: <SettingOutlined />, label: 'Permissions' },
  { key: `/workspaces/${workspaceId}/audit`, icon: <AuditOutlined />, label: 'Audit logs' },
  { key: `/workspaces/${workspaceId}/settings`, icon: <SettingOutlined />, label: 'Workspace settings' },
];

export const ProtectedLayout = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data && meQuery.data !== user) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser, user]);

  useEffect(() => {
    if (meQuery.isError) {
      logout();
    }
  }, [logout, meQuery.isError]);

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (meQuery.isLoading && !user) {
    return <LoadingState label="Opening Docsy" />;
  }

  if (meQuery.isError) {
    return <Navigate to="/auth" replace />;
  }

  if (meQuery.data && !meQuery.data.emailVerified) {
    return <Navigate to="/verify-needed" replace />;
  }

  return <WorkspaceShell />;
};

const WorkspaceShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const setSelectedWorkspaceId = useWorkspaceStore((state) => state.setSelectedWorkspaceId);

  const workspacesQuery = useQuery({
    queryKey: ['workspaces', 'my'],
    queryFn: workspacesApi.mine,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => undefined,
    onSuccess: () => {
      logout();
      queryClient.clear();
      navigate('/auth', { replace: true });
    },
  });

  if (workspacesQuery.isLoading) {
    return <LoadingState label="Loading workspaces" />;
  }

  if (workspacesQuery.isError) {
    return <ErrorState error={workspacesQuery.error} onRetry={() => workspacesQuery.refetch()} />;
  }

  const workspaces = workspacesQuery.data ?? [];
  const currentWorkspaceId = params.workspaceId ?? selectedWorkspaceId ?? workspaces[0]?.id;

  if (location.pathname === '/' && workspaces.length > 0 && currentWorkspaceId) {
    return <Navigate to={`/workspaces/${currentWorkspaceId}`} replace />;
  }

  if (location.pathname === '/' && workspaces.length === 0) {
    return <Navigate to="/setup" replace />;
  }

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === currentWorkspaceId);
  const menuItems = selectedWorkspace ? workspaceMenuItems(selectedWorkspace.id) : [];

  const onWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    navigate(`/workspaces/${workspaceId}`);
  };

  const userMenu: MenuProps = {
    items: [
      { key: '/profile', icon: <UserOutlined />, label: 'Profile' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Log out' },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        logoutMutation.mutate();
      } else {
        navigate(String(key));
      }
    },
  };

  return (
    <Layout className="app-layout">
      <Sider breakpoint="lg" collapsedWidth="0" width={250} className="app-sider">
        <div className="brand">Docsy</div>
        <Menu
          mode="inline"
          selectedKeys={[bestSelectedKey(location.pathname, menuItems)]}
          items={menuItems}
          onClick={({ key }) => navigate(String(key))}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space size={12}>
            <Select
              className="workspace-select"
              placeholder="Select workspace"
              value={selectedWorkspace?.id}
              onChange={onWorkspaceChange}
              options={workspaces.map((workspace: Workspace) => ({
                value: workspace.id,
                label: workspace.name,
              }))}
            />
            <Button onClick={() => navigate('/setup')}>New or join</Button>
          </Space>
          <Dropdown menu={userMenu} trigger={['click']}>
            <Button type="text" className="user-button">
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.fullName ?? 'Account'}</span>
            </Button>
          </Dropdown>
        </Header>
        <Content className="app-content">
          {selectedWorkspace && (
            <Text type="secondary" className="workspace-kicker">
              {selectedWorkspace.name}
            </Text>
          )}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

const bestSelectedKey = (pathname: string, items: MenuProps['items']) => {
  const keys = (items ?? []).map((item) => String(item?.key ?? ''));
  return keys.sort((a, b) => b.length - a.length).find((key) => pathname === key || pathname.startsWith(`${key}/`)) ?? '';
};

export const WorkspaceRouteGuard = () => {
  const params = useParams();
  const setSelectedWorkspaceId = useWorkspaceStore((state) => state.setSelectedWorkspaceId);

  useEffect(() => {
    if (params.workspaceId) {
      setSelectedWorkspaceId(params.workspaceId);
    }
  }, [params.workspaceId, setSelectedWorkspaceId]);

  return <Outlet />;
};

export const MutationError = (error: unknown) => {
  message.error(getApiErrorMessage(error));
};
