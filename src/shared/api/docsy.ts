import { apiClient } from './axios';
import type {
  AuditLog,
  AuthResponse,
  Dashboard,
  DocumentItem,
  DocumentVersion,
  Invitation,
  JoinMode,
  Member,
  MyPermissions,
  Permission,
  PermissionSetting,
  ReviewQueueItem,
  Role,
  Template,
  User,
  Workspace,
} from './types';

const data = <T>(request: Promise<{ data: T }>) => request.then((response) => response.data);

export const authApi = {
  login: (payload: { email: string; password: string }) =>
    data<AuthResponse>(apiClient.post('/auth/login', payload)),
  register: (payload: { email: string; password: string; fullName: string; positionTitle: string }) =>
    data<AuthResponse>(apiClient.post('/auth/register', payload)),
  me: () => data<User>(apiClient.get('/auth/me')),
};

export const usersApi = {
  me: () => data<User>(apiClient.get('/users/me')),
  updateMe: (payload: { fullName: string; positionTitle: string }) =>
    data<User>(apiClient.patch('/users/me', payload)),
  updatePassword: (payload: { currentPassword: string; newPassword: string }) =>
    data<void>(apiClient.patch('/users/me/password', payload)),
};

export const workspacesApi = {
  mine: () => data<Workspace[]>(apiClient.get('/workspaces/my')),
  create: (payload: { name: string; joinMode: JoinMode; joinPassword?: string }) =>
    data<Workspace>(apiClient.post('/workspaces', payload)),
  join: (payload: { joinCode: string; joinPassword?: string }) =>
    data<Workspace>(apiClient.post('/workspaces/join', payload)),
  get: (workspaceId: string) => data<Workspace>(apiClient.get(`/workspaces/${workspaceId}`)),
  update: (workspaceId: string, payload: { name: string; joinMode: JoinMode; joinPassword?: string }) =>
    data<Workspace>(apiClient.patch(`/workspaces/${workspaceId}`, payload)),
  dashboard: (workspaceId: string) =>
    data<Dashboard>(apiClient.get(`/workspaces/${workspaceId}/dashboard`)),
};

export const templatesApi = {
  list: (workspaceId: string) =>
    data<Template[]>(apiClient.get(`/workspaces/${workspaceId}/templates`)),
  get: (workspaceId: string, templateId: string) =>
    data<Template>(apiClient.get(`/workspaces/${workspaceId}/templates/${templateId}`)),
  create: (workspaceId: string, payload: { title: string; htmlContent: string }) =>
    data<Template>(apiClient.post(`/workspaces/${workspaceId}/templates`, payload)),
  update: (workspaceId: string, templateId: string, payload: { title: string; htmlContent: string }) =>
    data<Template>(apiClient.patch(`/workspaces/${workspaceId}/templates/${templateId}`, payload)),
  remove: (workspaceId: string, templateId: string) =>
    data<void>(apiClient.delete(`/workspaces/${workspaceId}/templates/${templateId}`)),
};

export const documentsApi = {
  list: (workspaceId: string) =>
    data<DocumentItem[]>(apiClient.get(`/workspaces/${workspaceId}/documents`)),
  get: (workspaceId: string, documentId: string) =>
    data<DocumentItem>(apiClient.get(`/workspaces/${workspaceId}/documents/${documentId}`)),
  create: (
    workspaceId: string,
    payload: { title: string; content: string; templateId?: string; placeholders?: Record<string, string> },
  ) =>
    data<DocumentItem>(apiClient.post(`/workspaces/${workspaceId}/documents`, payload)),
  update: (
    workspaceId: string,
    documentId: string,
    payload: { title: string; content: string; placeholders?: Record<string, string> },
  ) =>
    data<DocumentItem>(apiClient.patch(`/workspaces/${workspaceId}/documents/${documentId}`, payload)),
  versions: (workspaceId: string, documentId: string) =>
    data<DocumentVersion[]>(apiClient.get(`/workspaces/${workspaceId}/documents/${documentId}/versions`)),
  submit: (workspaceId: string, documentId: string, payload: { reviewerId: string; comment: string }) =>
    data<void>(apiClient.post(`/workspaces/${workspaceId}/documents/${documentId}/submit`, payload)),
  approve: (workspaceId: string, documentId: string, payload: { comment: string }) =>
    data<void>(apiClient.post(`/workspaces/${workspaceId}/documents/${documentId}/approve`, payload)),
  reject: (workspaceId: string, documentId: string, payload: { reason: string }) =>
    data<void>(apiClient.post(`/workspaces/${workspaceId}/documents/${documentId}/reject`, payload)),
  reviewQueue: (workspaceId: string) =>
    data<ReviewQueueItem[]>(apiClient.get(`/workspaces/${workspaceId}/review-queue`)),
  archive: (workspaceId: string) =>
    data<DocumentItem[]>(apiClient.get(`/workspaces/${workspaceId}/archive`)),
};

export const invitationsApi = {
  list: (workspaceId: string) =>
    data<Invitation[]>(apiClient.get(`/workspaces/${workspaceId}/invitations`)),
  create: (workspaceId: string, payload: { email: string; role: Role }) =>
    data<Invitation>(apiClient.post(`/workspaces/${workspaceId}/invitations`, payload)),
  mine: () => data<Invitation[]>(apiClient.get('/invitations/my')),
  accept: (invitationId: string) => data<void>(apiClient.post(`/invitations/${invitationId}/accept`)),
  decline: (invitationId: string) => data<void>(apiClient.post(`/invitations/${invitationId}/decline`)),
};

export const membersApi = {
  list: (workspaceId: string) =>
    data<Member[]>(apiClient.get(`/workspaces/${workspaceId}/members`)),
  updateRole: (workspaceId: string, memberId: string, payload: { role: Role }) =>
    data<void>(apiClient.patch(`/workspaces/${workspaceId}/members/${memberId}/role`, payload)),
  remove: (workspaceId: string, memberId: string) =>
    data<void>(apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`)),
  leave: (workspaceId: string) => data<void>(apiClient.delete(`/workspaces/${workspaceId}/members/leave`)),
};

export const permissionsApi = {
  list: (workspaceId: string) =>
    data<PermissionSetting[]>(apiClient.get(`/workspaces/${workspaceId}/permissions`)),
  mine: (workspaceId: string) =>
    data<MyPermissions>(apiClient.get(`/workspaces/${workspaceId}/permissions/my`)),
  update: (workspaceId: string, payload: { role: Role; permission: Permission; enabled: boolean }) =>
    data<void>(apiClient.patch(`/workspaces/${workspaceId}/permissions`, payload)),
};

export const auditApi = {
  list: (workspaceId: string) =>
    data<AuditLog[]>(apiClient.get(`/workspaces/${workspaceId}/audit-logs`)),
};
