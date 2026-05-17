import { createBrowserRouter } from 'react-router-dom';
import { AuthPage } from '../features/auth/pages/AuthPage';
import { ProtectedLayout, WorkspaceRouteGuard } from './AppLayout';
import {
  AcceptInvitationPage,
  ArchivePage,
  AuditPage,
  DashboardPage,
  DocumentCreatePage,
  DocumentDetailPage,
  DocumentsPage,
  HomeRedirect,
  MembersPage,
  PermissionsPage,
  ProfilePage,
  ReviewQueuePage,
  TemplatesPage,
  VerifyEmailPage,
  VerifyNeededPage,
  WorkspaceSettingsPage,
  WorkspaceSetupPage,
} from './pages';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/accept-invitation',
    element: <AcceptInvitationPage />,
  },
  {
    path: '/verify-needed',
    element: <VerifyNeededPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'setup', element: <WorkspaceSetupPage /> },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'workspaces/:workspaceId',
        element: <WorkspaceRouteGuard />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'documents', element: <DocumentsPage /> },
          { path: 'documents/new', element: <DocumentCreatePage /> },
          { path: 'documents/:documentId', element: <DocumentDetailPage /> },
          { path: 'templates', element: <TemplatesPage /> },
          { path: 'review', element: <ReviewQueuePage /> },
          { path: 'archive', element: <ArchivePage /> },
          { path: 'members', element: <MembersPage /> },
          { path: 'permissions', element: <PermissionsPage /> },
          { path: 'audit', element: <AuditPage /> },
          { path: 'settings', element: <WorkspaceSettingsPage /> },
        ],
      },
    ],
  },
]);
