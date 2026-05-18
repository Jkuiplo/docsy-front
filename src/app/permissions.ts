import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '../shared/api/docsy';
import type { MyPermissions, Permission, Role } from '../shared/api/types';

export const allPermissions: Permission[] = [
  'MANAGE_MEMBERS',
  'CREATE_TEMPLATES',
  'EDIT_TEMPLATES',
  'DELETE_TEMPLATES',
  'CREATE_BLANK_DOCUMENTS',
  'CREATE_FROM_TEMPLATE',
  'VIEW_ALL_DOCUMENTS',
  'EDIT_ALL_DOCUMENTS',
  'VIEW_ARCHIVE',
  'REVIEW_ASSIGNED_DOCUMENTS',
  'APPROVE_OWN_DOCUMENTS',
  'EDIT_ARCHIVED_DOCUMENTS',
  'MANAGE_WORKSPACE',
];

export const configurableRoles: Role[] = ['ADMIN', 'REVIEWER', 'USER'];

export const ownerPermissions: MyPermissions = {
  role: 'OWNER',
  permissions: allPermissions,
};

export const isOwner = (access?: MyPermissions) => access?.role === 'OWNER';

export const hasPermission = (access: MyPermissions | undefined, permission: Permission) =>
  isOwner(access) || access?.permissions.includes(permission) === true;

export const hasAnyPermission = (access: MyPermissions | undefined, permissions: Permission[]) =>
  isOwner(access) || permissions.some((permission) => access?.permissions.includes(permission));

export const useMyPermissions = (workspaceId?: string) =>
  useQuery({
    queryKey: ['workspaces', workspaceId, 'permissions', 'my'],
    queryFn: () => permissionsApi.mine(workspaceId ?? ''),
    enabled: Boolean(workspaceId),
  });

export const canCreateDocuments = (access?: MyPermissions) =>
  hasAnyPermission(access, ['CREATE_BLANK_DOCUMENTS', 'CREATE_FROM_TEMPLATE']);

export const canUseTemplates = (access?: MyPermissions) =>
  hasAnyPermission(access, ['CREATE_TEMPLATES', 'EDIT_TEMPLATES', 'DELETE_TEMPLATES']);

export const canReviewDocuments = (access?: MyPermissions) =>
  hasAnyPermission(access, ['REVIEW_ASSIGNED_DOCUMENTS', 'APPROVE_OWN_DOCUMENTS']);
