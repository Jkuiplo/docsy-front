export type Role = 'OWNER' | 'ADMIN' | 'REVIEWER' | 'USER';
export type DocumentStatus = 'DRAFT' | 'ON_REVIEW' | 'APPROVED' | 'ARCHIVED' | 'REJECTED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
export type JoinMode = 'INVITE_ONLY' | 'PASSWORD' | 'OPEN';
export type Permission =
  | 'MANAGE_MEMBERS'
  | 'MANAGE_TEMPLATES'
  | 'MANAGE_DOCUMENTS'
  | 'REVIEW_DOCUMENTS'
  | 'MANAGE_WORKSPACE'
  | 'VIEW_AUDIT_LOGS';

export interface User {
  id: string;
  email: string;
  fullName: string;
  positionTitle: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  joinCode: string;
  joinMode: JoinMode;
  createdAt: string;
}

export interface Dashboard {
  workspaceId: string;
  workspaceName: string;
  myRole: Role;
  documentStats: {
    draft: number;
    onReview: number;
    approved: number;
    archived: number;
    rejected: number;
  };
  pendingInvitations: number;
  waitingForMyReview: number;
}

export interface Template {
  id: string;
  title: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  templateSnapshotHtml: string;
  status: DocumentStatus;
  authorId: string;
  authorName: string;
  reviewerId?: string | null;
  reviewerName?: string | null;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  titleSnapshot: string;
  contentSnapshot: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface ReviewQueueItem {
  documentId: string;
  title: string;
  authorId: string;
  authorName: string;
  status: DocumentStatus;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  status: InvitationStatus;
  expiresAt: string;
}

export interface Member {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  joinedAt: string;
}

export interface PermissionSetting {
  id: string;
  role: Role;
  permission: Permission;
  enabled: boolean;
}

export interface MyPermissions {
  role: Role;
  permissions: Permission[];
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  actorId: string;
  actorName: string;
  timestamp: string;
}
