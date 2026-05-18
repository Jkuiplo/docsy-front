import {
  AuditOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProfileOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Dropdown, Layout, Menu, Select, Space, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../shared/api/axios';
import { authApi, workspacesApi } from '../shared/api/docsy';
import type { Workspace } from '../shared/api/types';
import { ErrorState, LoadingState } from '../shared/ui';
import { useAuthStore } from '../features/auth/store';
import { ThemeModeControl } from './theme';
import {
  canCreateDocuments,
  canReviewDocuments,
  canUseTemplates,
  hasPermission,
  useMyPermissions,
} from './permissions';
import { useWorkspaceStore } from './workspaceStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const sidebarStorageKey = 'docsySidebarCollapsed';

const workspaceMenuItems = (
  workspaceId: string,
  access: ReturnType<typeof useMyPermissions>['data'],
): MenuProps['items'] => {
  const items: MenuProps['items'] = [
    { key: `/workspaces/${workspaceId}`, icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: `/workspaces/${workspaceId}/documents`, icon: <FileTextOutlined />, label: 'Documents' },
  ];

  if (canUseTemplates(access)) {
    items.push({ key: `/workspaces/${workspaceId}/templates`, icon: <ProfileOutlined />, label: 'Templates' });
  }

  if (canReviewDocuments(access)) {
    items.push({ key: `/workspaces/${workspaceId}/review`, icon: <FileDoneOutlined />, label: 'Review queue' });
  }

  if (hasPermission(access, 'VIEW_ARCHIVE')) {
    items.push({ key: `/workspaces/${workspaceId}/archive`, icon: <FolderOpenOutlined />, label: 'Archive' });
  }

  if (hasPermission(access, 'MANAGE_MEMBERS')) {
    items.push({ key: `/workspaces/${workspaceId}/members`, icon: <TeamOutlined />, label: 'Members' });
  }

  if (hasPermission(access, 'MANAGE_WORKSPACE')) {
    items.push(
      { key: `/workspaces/${workspaceId}/permissions`, icon: <SettingOutlined />, label: 'Permissions' },
      { key: `/workspaces/${workspaceId}/audit`, icon: <AuditOutlined />, label: 'Audit logs' },
      { key: `/workspaces/${workspaceId}/settings`, icon: <SettingOutlined />, label: 'Workspace settings' },
    );
  }

  return items;
};

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

  return <WorkspaceShell />;
};

const WorkspaceShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(sidebarStorageKey) === 'true',
  );
  const [isMobile, setIsMobile] = useState(false);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const setSelectedWorkspaceId = useWorkspaceStore((state) => state.setSelectedWorkspaceId);

  const workspacesQuery = useQuery({
    queryKey: ['workspaces', 'my'],
    queryFn: workspacesApi.mine,
  });
  const workspaces = workspacesQuery.data ?? [];
  const currentWorkspaceId = params.workspaceId ?? selectedWorkspaceId ?? workspaces[0]?.id;
  const myPermissionsQuery = useMyPermissions(currentWorkspaceId);

  const logoutMutation = useMutation({
    mutationFn: async () => undefined,
    onSuccess: () => {
      logout();
      queryClient.clear();
      navigate('/auth', { replace: true });
    },
  });

  useEffect(() => {
    localStorage.setItem(sidebarStorageKey, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  if (location.pathname === '/verify-needed') {
    return <Navigate to="/" replace />;
  }

  if (workspacesQuery.isLoading) {
    return <LoadingState label="Loading workspaces" />;
  }

  if (workspacesQuery.isError) {
    return <ErrorState error={workspacesQuery.error} onRetry={() => workspacesQuery.refetch()} />;
  }

  if (location.pathname === '/' && workspaces.length > 0 && currentWorkspaceId) {
    return <Navigate to={`/workspaces/${currentWorkspaceId}`} replace />;
  }

  if (location.pathname === '/' && workspaces.length === 0) {
    return <Navigate to="/setup" replace />;
  }

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === currentWorkspaceId);
  const menuItems = selectedWorkspace ? workspaceMenuItems(selectedWorkspace.id, myPermissionsQuery.data) : [];
  const showSidebar = true;

  const onWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    navigate(`/workspaces/${workspaceId}`);
  };

  const userMenu: MenuProps = {
    items: [
      { key: '/profile', icon: <UserOutlined />, label: 'Profile' },
      {
        key: 'theme',
        label: (
          <div className="account-menu-control">
            <span>Theme</span>
            <ThemeModeControl className="account-theme-control" />
          </div>
        ),
      },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Log out' },
    ],
    onClick: ({ key, domEvent }) => {
      if (key === 'theme') {
        domEvent.stopPropagation();
        return;
      }

      if (key === 'logout') {
        logoutMutation.mutate();
      } else {
        navigate(String(key));
      }
    },
  };

  return (
    <Layout className="app-layout">
      {showSidebar && (
        <Sider
          breakpoint="lg"
          collapsed={sidebarCollapsed}
          collapsedWidth={isMobile ? 0 : 72}
          onBreakpoint={setIsMobile}
          trigger={null}
          width={268}
          className="app-sider"
        >
          <div className="brand">
            <span className="brand-mark">D</span>
            <span className="brand-name">Docsy</span>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[bestSelectedKey(location.pathname, menuItems)]}
            items={menuItems}
            onClick={({ key }) => {
              navigate(String(key));
              if (isMobile) {
                setSidebarCollapsed(true);
              }
            }}
          />
        </Sider>
      )}
      <Layout>
        <Header className="app-header">
          <Space size={12} className="app-header-main">
            {showSidebar && (
              <Button
                type="text"
                className="sidebar-toggle"
                icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              />
            )}
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
  const location = useLocation();
  const setSelectedWorkspaceId = useWorkspaceStore((state) => state.setSelectedWorkspaceId);
  const myPermissionsQuery = useMyPermissions(params.workspaceId);

  useEffect(() => {
    if (params.workspaceId) {
      setSelectedWorkspaceId(params.workspaceId);
    }
  }, [params.workspaceId, setSelectedWorkspaceId]);

  if (myPermissionsQuery.isLoading) {
    return <LoadingState label="Checking workspace access" />;
  }

  if (!canAccessWorkspaceRoute(location.pathname, params.workspaceId, myPermissionsQuery.data)) {
    return <Navigate to={`/workspaces/${params.workspaceId}`} replace />;
  }

  return <Outlet />;
};

const canAccessWorkspaceRoute = (
  pathname: string,
  workspaceId: string | undefined,
  access: ReturnType<typeof useMyPermissions>['data'],
) => {
  if (!workspaceId) {
    return true;
  }

  const route = pathname.replace(`/workspaces/${workspaceId}`, '').replace(/^\/+/, '');

  if (route === 'documents/new') {
    return canCreateDocuments(access);
  }

  if (route === 'templates') {
    return canUseTemplates(access);
  }

  if (route === 'review') {
    return canReviewDocuments(access);
  }

  if (route === 'archive') {
    return hasPermission(access, 'VIEW_ARCHIVE');
  }

  if (route === 'members') {
    return hasPermission(access, 'MANAGE_MEMBERS');
  }

  if (['permissions', 'audit', 'settings'].includes(route)) {
    return hasPermission(access, 'MANAGE_WORKSPACE');
  }

  return true;
};

export const MutationError = (error: unknown) => {
  message.error(getApiErrorMessage(error));
};
