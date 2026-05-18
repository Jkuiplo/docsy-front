import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  MailOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../shared/api/axios';
import {
  auditApi,
  authApi,
  documentsApi,
  invitationsApi,
  membersApi,
  permissionsApi,
  templatesApi,
  usersApi,
  workspacesApi,
} from '../shared/api/docsy';
import type {
  DocumentItem,
  DocumentStatus,
  JoinMode,
  Member,
  Permission,
  PermissionSetting,
  Role,
  Template,
} from '../shared/api/types';
import { formatDate } from '../shared/format';
import { EmptyState, ErrorState, InlineError, LoadingState, PageHeader } from '../shared/ui';
import { useAuthStore } from '../features/auth/store';
import {
  allPermissions,
  canCreateDocuments,
  configurableRoles,
  hasPermission,
  useMyPermissions,
} from './permissions';
import { useWorkspaceStore } from './workspaceStore';

const roles: Role[] = ['OWNER', 'ADMIN', 'REVIEWER', 'USER'];
const joinModes: JoinMode[] = ['INVITE_ONLY', 'PASSWORD', 'OPEN'];
const editableStatuses: DocumentStatus[] = ['DRAFT', 'REJECTED'];

const statusColors: Record<DocumentStatus, string> = {
  DRAFT: 'default',
  ON_REVIEW: 'processing',
  APPROVED: 'success',
  ARCHIVED: 'purple',
  REJECTED: 'error',
};

const statusTag = (status: DocumentStatus) => <Tag color={statusColors[status]}>{status.replace('_', ' ')}</Tag>;

const roleSelectOptions = roles.map((role) => ({ value: role, label: role }));
const joinModeOptions = joinModes.map((joinMode) => ({ value: joinMode, label: joinMode.replace('_', ' ') }));

const useWorkspaceId = () => {
  const { workspaceId } = useParams();

  if (!workspaceId) {
    throw new Error('Workspace route is missing workspaceId');
  }

  return workspaceId;
};

const notifyError = (error: unknown) => message.error(getApiErrorMessage(error));

export const HomeRedirect = () => {
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const workspacesQuery = useQuery({ queryKey: ['workspaces', 'my'], queryFn: workspacesApi.mine });

  if (workspacesQuery.isLoading) {
    return <LoadingState label="Finding your workspace" />;
  }

  if (workspacesQuery.isError) {
    return <ErrorState error={workspacesQuery.error} onRetry={() => workspacesQuery.refetch()} />;
  }

  const workspaces = workspacesQuery.data ?? [];
  const target = workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? workspaces[0];

  return <Navigate to={target ? `/workspaces/${target.id}` : '/setup'} replace />;
};

export const WorkspaceSetupPage = () => {
  const [createForm] = Form.useForm();
  const [joinForm] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSelectedWorkspaceId = useWorkspaceStore((state) => state.setSelectedWorkspaceId);

  const afterWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    queryClient.invalidateQueries({ queryKey: ['workspaces', 'my'] });
    navigate(`/workspaces/${workspaceId}`);
  };

  const createMutation = useMutation({
    mutationFn: workspacesApi.create,
    onSuccess: (workspace) => afterWorkspace(workspace.id),
    onError: notifyError,
  });

  const joinMutation = useMutation({
    mutationFn: workspacesApi.join,
    onSuccess: (workspace) => afterWorkspace(workspace.id),
    onError: notifyError,
  });

  return (
    <>
      <PageHeader title="Start with a workspace" subtitle="Create a company workspace or join one with a code." />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Create workspace">
            <Form
              form={createForm}
              layout="vertical"
              initialValues={{ joinMode: 'INVITE_ONLY' }}
              onFinish={(values) => createMutation.mutate(values)}
            >
              <Form.Item name="name" label="Workspace name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="joinMode" label="Join mode" rules={[{ required: true }]}>
                <Select options={joinModeOptions} />
              </Form.Item>
              <Form.Item name="joinPassword" label="Join password">
                <Input.Password />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                Create workspace
              </Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Join workspace">
            <Form form={joinForm} layout="vertical" onFinish={(values) => joinMutation.mutate(values)}>
              <Form.Item name="joinCode" label="Join code" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="joinPassword" label="Join password">
                <Input.Password />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={joinMutation.isPending}>
                Join workspace
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export const DashboardPage = () => {
  const workspaceId = useWorkspaceId();
  const dashboardQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'dashboard'],
    queryFn: () => workspacesApi.dashboard(workspaceId),
  });

  if (dashboardQuery.isLoading) {
    return <LoadingState label="Loading dashboard" />;
  }

  if (dashboardQuery.isError) {
    return <ErrorState error={dashboardQuery.error} onRetry={() => dashboardQuery.refetch()} />;
  }

  const dashboard = dashboardQuery.data;

  if (!dashboard) {
    return <EmptyState description="Dashboard is not available" />;
  }

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Your role: ${dashboard.myRole}`} />
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={4}>
          <Card><Statistic title="Draft" value={dashboard.documentStats.draft} /></Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card><Statistic title="On review" value={dashboard.documentStats.onReview} /></Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card><Statistic title="Approved" value={dashboard.documentStats.approved} /></Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card><Statistic title="Archived" value={dashboard.documentStats.archived} /></Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card><Statistic title="Rejected" value={dashboard.documentStats.rejected} /></Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card><Statistic title="My reviews" value={dashboard.waitingForMyReview} /></Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Pending invitations">
            <Statistic value={dashboard.pendingInvitations} />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export const DocumentsPage = () => {
  const workspaceId = useWorkspaceId();
  const [status, setStatus] = useState<DocumentStatus | 'ALL'>('ALL');
  const myPermissionsQuery = useMyPermissions(workspaceId);
  const documentsQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'documents'],
    queryFn: () => documentsApi.list(workspaceId),
  });

  const documents = useMemo(() => {
    const items = documentsQuery.data ?? [];
    return status === 'ALL' ? items : items.filter((document) => document.status === status);
  }, [documentsQuery.data, status]);

  const columns: ColumnsType<DocumentItem> = [
    { title: 'Title', dataIndex: 'title', render: (title, row) => <Link to={row.id}>{title}</Link> },
    { title: 'Status', dataIndex: 'status', render: statusTag },
    { title: 'Author', dataIndex: 'authorName' },
    { title: 'Reviewer', dataIndex: 'reviewerName', render: (value) => value ?? 'Not assigned' },
    { title: 'Updated', dataIndex: 'updatedAt', render: formatDate },
  ];

  if (documentsQuery.isError) {
    return <ErrorState error={documentsQuery.error} onRetry={() => documentsQuery.refetch()} />;
  }

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Create, edit, and submit documents for review."
        action={
          canCreateDocuments(myPermissionsQuery.data) ? (
            <Link to="new"><Button type="primary" icon={<FileAddOutlined />}>New document</Button></Link>
          ) : undefined
        }
      />
      <Card>
        <Space className="table-toolbar">
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'ALL', label: 'All statuses' },
              ...Object.keys(statusColors).map((item) => ({ value: item, label: item.replace('_', ' ') })),
            ]}
          />
        </Space>
        <Table
          rowKey="id"
          loading={documentsQuery.isLoading}
          columns={columns}
          dataSource={documents}
          locale={{ emptyText: <EmptyState description="No documents yet" /> }}
        />
      </Card>
    </>
  );
};

export const DocumentCreatePage = () => {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const myPermissionsQuery = useMyPermissions(workspaceId);
  const templatesQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'templates'],
    queryFn: () => templatesApi.list(workspaceId),
    enabled: hasPermission(myPermissionsQuery.data, 'CREATE_FROM_TEMPLATE'),
  });
  const createMutation = useMutation({
    mutationFn: (values: { title: string; templateId?: string }) =>
      documentsApi.create(workspaceId, { ...values, content }),
    onSuccess: (document) => {
      message.success('Document created');
      navigate(`../documents/${document.id}`);
    },
    onError: notifyError,
  });

  if (myPermissionsQuery.isLoading) {
    return <LoadingState label="Checking document permissions" />;
  }

  if (!canCreateDocuments(myPermissionsQuery.data)) {
    return <Navigate to="../documents" replace />;
  }

  return (
    <>
      <PageHeader title="New document" subtitle="Pick a template and write the meaningful content." />
      <Card>
        <DocumentEditorForm
          templates={templatesQuery.data ?? []}
          templatesLoading={templatesQuery.isLoading}
          content={content}
          onContentChange={setContent}
          onFinish={(values) => createMutation.mutate(values)}
          loading={createMutation.isPending}
          submitLabel="Create document"
          includeTemplate={hasPermission(myPermissionsQuery.data, 'CREATE_FROM_TEMPLATE')}
        />
      </Card>
    </>
  );
};

export const DocumentDetailPage = () => {
  const workspaceId = useWorkspaceId();
  const { documentId = '' } = useParams();
  const [content, setContent] = useState('');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const myPermissionsQuery = useMyPermissions(workspaceId);

  const documentQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'documents', documentId],
    queryFn: () => documentsApi.get(workspaceId, documentId),
  });
  const versionsQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'documents', documentId, 'versions'],
    queryFn: () => documentsApi.versions(workspaceId, documentId),
  });
  const membersQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'members'],
    queryFn: () => membersApi.list(workspaceId),
  });

  const invalidateDocument = () => {
    queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'documents'] });
    queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'documents', documentId] });
    queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'documents', documentId, 'versions'] });
    queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'dashboard'] });
  };

  const updateMutation = useMutation({
    mutationFn: (values: { title: string }) => documentsApi.update(workspaceId, documentId, { ...values, content }),
    onSuccess: () => {
      message.success('Document saved');
      invalidateDocument();
    },
    onError: notifyError,
  });
  const submitMutation = useMutation({
    mutationFn: (values: { reviewerId: string; comment: string }) =>
      documentsApi.submit(workspaceId, documentId, values),
    onSuccess: () => {
      message.success('Submitted for review');
      setSubmitOpen(false);
      invalidateDocument();
    },
    onError: notifyError,
  });
  const approveMutation = useMutation({
    mutationFn: () => documentsApi.approve(workspaceId, documentId, { comment: 'Approved from Docsy frontend' }),
    onSuccess: () => {
      message.success('Document approved');
      invalidateDocument();
    },
    onError: notifyError,
  });
  const rejectMutation = useMutation({
    mutationFn: (values: { reason: string }) => documentsApi.reject(workspaceId, documentId, values),
    onSuccess: () => {
      message.success('Document rejected');
      setRejectOpen(false);
      invalidateDocument();
    },
    onError: notifyError,
  });

  if (documentQuery.isLoading) {
    return <LoadingState label="Loading document" />;
  }

  if (documentQuery.isError) {
    return <ErrorState error={documentQuery.error} onRetry={() => documentQuery.refetch()} />;
  }

  const document = documentQuery.data;

  if (!document) {
    return <EmptyState description="Document is not available" />;
  }

  const isAuthor = document.authorId === user?.id;
  const isReviewer = document.reviewerId === user?.id;
  const canEdit =
    (editableStatuses.includes(document.status) && (isAuthor || hasPermission(myPermissionsQuery.data, 'EDIT_ALL_DOCUMENTS'))) ||
    (document.status === 'ARCHIVED' && hasPermission(myPermissionsQuery.data, 'EDIT_ARCHIVED_DOCUMENTS'));
  const canReview =
    isReviewer || hasPermission(myPermissionsQuery.data, 'REVIEW_ASSIGNED_DOCUMENTS');
  const canApprove =
    canReview || (isAuthor && hasPermission(myPermissionsQuery.data, 'APPROVE_OWN_DOCUMENTS'));

  return (
    <>
      <PageHeader
        title={document.title}
        subtitle={`${document.authorName} • updated ${formatDate(document.updatedAt)}`}
        action={<Space>{statusTag(document.status)}</Space>}
      />
      <Tabs
        items={[
          {
            key: 'editor',
            label: 'Editor',
            children: (
              <Card>
                {!canEdit && (
                  <Alert
                    showIcon
                    type="info"
                    className="form-note"
                    message="Editing is locked while this document is under review or finalized."
                  />
                )}
                <DocumentEditorForm
                  initialTitle={document.title}
                  content={content || document.content}
                  onContentChange={setContent}
                  onFinish={updateMutation.mutate}
                  loading={updateMutation.isPending}
                  submitLabel="Save changes"
                  disabled={!canEdit}
                />
                <Divider />
                <Space wrap>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    disabled={!canEdit}
                    onClick={() => setSubmitOpen(true)}
                  >
                    Submit for review
                  </Button>
                  {canApprove && (
                    <Button
                      icon={<CheckCircleOutlined />}
                      loading={approveMutation.isPending}
                      onClick={() => approveMutation.mutate()}
                    >
                      Approve
                    </Button>
                  )}
                  {canReview && (
                    <Button danger onClick={() => setRejectOpen(true)}>
                      Reject
                    </Button>
                  )}
                </Space>
              </Card>
            ),
          },
          {
            key: 'preview',
            label: 'Preview',
            children: (
              <Card>
                <div className="document-preview" dangerouslySetInnerHTML={{ __html: document.templateSnapshotHtml || document.content }} />
              </Card>
            ),
          },
          {
            key: 'versions',
            label: 'Versions',
            children: (
              <Table
                rowKey="id"
                loading={versionsQuery.isLoading}
                dataSource={versionsQuery.data ?? []}
                columns={[
                  { title: 'Version', dataIndex: 'versionNumber' },
                  { title: 'Title', dataIndex: 'titleSnapshot' },
                  { title: 'Created by', dataIndex: 'createdByName' },
                  { title: 'Created', dataIndex: 'createdAt', render: formatDate },
                ]}
              />
            ),
          },
        ]}
      />
      <ActionModal
        title="Submit for review"
        open={submitOpen}
        onCancel={() => setSubmitOpen(false)}
        onFinish={(values) => submitMutation.mutate(values as { reviewerId: string; comment: string })}
        loading={submitMutation.isPending}
        fields={
          <>
            <Form.Item name="reviewerId" label="Reviewer" rules={[{ required: true }]}>
              <Select
                loading={membersQuery.isLoading}
                options={(membersQuery.data ?? []).map((member) => ({
                  value: member.userId,
                  label: `${member.fullName} (${member.role})`,
                }))}
              />
            </Form.Item>
            <Form.Item name="comment" label="Comment" rules={[{ required: true }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
          </>
        }
      />
      <ActionModal
        title="Reject document"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onFinish={(values) => rejectMutation.mutate(values as { reason: string })}
        loading={rejectMutation.isPending}
        fields={
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        }
      />
    </>
  );
};

const DocumentEditorForm = ({
  initialTitle,
  templates,
  templatesLoading,
  content,
  onContentChange,
  onFinish,
  loading,
  submitLabel,
  includeTemplate,
  disabled,
}: {
  initialTitle?: string;
  templates?: Template[];
  templatesLoading?: boolean;
  content: string;
  onContentChange: (value: string) => void;
  onFinish: (values: { title: string; templateId?: string }) => void;
  loading: boolean;
  submitLabel: string;
  includeTemplate?: boolean;
  disabled?: boolean;
}) => (
  <Form layout="vertical" initialValues={{ title: initialTitle }} onFinish={onFinish}>
    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
      <Input disabled={disabled} />
    </Form.Item>
    {includeTemplate && (
      <Form.Item name="templateId" label="Template">
        <Select
          allowClear
          loading={templatesLoading}
          options={(templates ?? []).map((template) => ({ value: template.id, label: template.title }))}
        />
      </Form.Item>
    )}
    <Form.Item label="Content" required>
      <ReactQuill readOnly={disabled} theme="snow" value={content} onChange={onContentChange} />
    </Form.Item>
    <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={loading} disabled={disabled}>
      {submitLabel}
    </Button>
  </Form>
);

const ActionModal = ({
  title,
  open,
  onCancel,
  onFinish,
  loading,
  fields,
}: {
  title: string;
  open: boolean;
  onCancel: () => void;
  onFinish: (values: Record<string, string>) => void;
  loading: boolean;
  fields: React.ReactNode;
}) => {
  const [form] = Form.useForm<Record<string, string>>();

  return (
    <Modal title={title} open={open} onCancel={onCancel} footer={null} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {fields}
        <Button type="primary" htmlType="submit" loading={loading}>
          Confirm
        </Button>
      </Form>
    </Modal>
  );
};

export const TemplatesPage = () => {
  const workspaceId = useWorkspaceId();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const myPermissionsQuery = useMyPermissions(workspaceId);
  const templatesQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'templates'],
    queryFn: () => templatesApi.list(workspaceId),
  });

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
    setHtmlContent('');
    form.resetFields();
  };

  const saveMutation = useMutation({
    mutationFn: (values: { title: string }) =>
      editing
        ? templatesApi.update(workspaceId, editing.id, { ...values, htmlContent })
        : templatesApi.create(workspaceId, { ...values, htmlContent }),
    onSuccess: () => {
      message.success('Template saved');
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'templates'] });
      closeDrawer();
    },
    onError: notifyError,
  });
  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => templatesApi.remove(workspaceId, templateId),
    onSuccess: () => {
      message.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'templates'] });
    },
    onError: notifyError,
  });

  const openEditor = (template?: Template) => {
    setEditing(template ?? null);
    setHtmlContent(template?.htmlContent ?? '');
    form.setFieldsValue({ title: template?.title });
    setDrawerOpen(true);
  };
  const canCreateTemplate = hasPermission(myPermissionsQuery.data, 'CREATE_TEMPLATES');
  const canEditTemplate = hasPermission(myPermissionsQuery.data, 'EDIT_TEMPLATES');
  const canDeleteTemplate = hasPermission(myPermissionsQuery.data, 'DELETE_TEMPLATES');

  return (
    <>
      <PageHeader
        title="Templates"
        subtitle="Reusable HTML shells for standardized documents."
        action={canCreateTemplate ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>New template</Button>
        ) : undefined}
      />
      <Card>
        <Table
          rowKey="id"
          loading={templatesQuery.isLoading}
          dataSource={templatesQuery.data ?? []}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            { title: 'Updated', dataIndex: 'updatedAt', render: formatDate },
            ...(canEditTemplate || canDeleteTemplate ? [{
              title: 'Actions',
              render: (_: unknown, template: Template) => (
                <Space>
                  {canEditTemplate && <Button icon={<EditOutlined />} onClick={() => openEditor(template)} />}
                  {canDeleteTemplate && (
                    <Popconfirm title="Delete template?" onConfirm={() => deleteMutation.mutate(template.id)}>
                      <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  )}
                </Space>
              ),
            }] : []),
          ]}
        />
      </Card>
      <Drawer
        title={editing ? 'Edit template' : 'New template'}
        open={drawerOpen}
        onClose={closeDrawer}
        width={720}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="HTML content" required>
            <ReactQuill theme="snow" value={htmlContent} onChange={setHtmlContent} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
            Save template
          </Button>
        </Form>
      </Drawer>
    </>
  );
};

export const ReviewQueuePage = () => {
  const workspaceId = useWorkspaceId();
  const queueQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'review-queue'],
    queryFn: () => documentsApi.reviewQueue(workspaceId),
  });

  return (
    <>
      <PageHeader title="Review queue" subtitle="Documents waiting for your review." />
      <Card>
        <Table
          rowKey="documentId"
          loading={queueQuery.isLoading}
          dataSource={queueQuery.data ?? []}
          columns={[
            { title: 'Title', dataIndex: 'title', render: (title, row) => <Link to={`../documents/${row.documentId}`}>{title}</Link> },
            { title: 'Status', dataIndex: 'status', render: statusTag },
            { title: 'Author', dataIndex: 'authorName' },
            { title: 'Updated', dataIndex: 'updatedAt', render: formatDate },
          ]}
        />
      </Card>
    </>
  );
};

export const ArchivePage = () => {
  const workspaceId = useWorkspaceId();
  const archiveQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'archive'],
    queryFn: () => documentsApi.archive(workspaceId),
  });

  return (
    <>
      <PageHeader title="Archive" subtitle="Finalized and archived documents." />
      <Card>
        <DocumentTable data={archiveQuery.data ?? []} loading={archiveQuery.isLoading} />
      </Card>
    </>
  );
};

const DocumentTable = ({ data, loading }: { data: DocumentItem[]; loading: boolean }) => (
  <Table
    rowKey="id"
    loading={loading}
    dataSource={data}
    columns={[
      { title: 'Title', dataIndex: 'title', render: (title, row) => <Link to={`../documents/${row.id}`}>{title}</Link> },
      { title: 'Status', dataIndex: 'status', render: statusTag },
      { title: 'Author', dataIndex: 'authorName' },
      { title: 'Reviewer', dataIndex: 'reviewerName', render: (value) => value ?? 'Not assigned' },
      { title: 'Updated', dataIndex: 'updatedAt', render: formatDate },
    ]}
  />
);

export const MembersPage = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const membersQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'members'],
    queryFn: () => membersApi.list(workspaceId),
  });
  const invitationsQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'invitations'],
    queryFn: () => invitationsApi.list(workspaceId),
  });
  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: Role }) =>
      membersApi.updateRole(workspaceId, memberId, { role }),
    onSuccess: () => {
      message.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'members'] });
    },
    onError: notifyError,
  });
  const removeMutation = useMutation({
    mutationFn: (memberId: string) => membersApi.remove(workspaceId, memberId),
    onSuccess: () => {
      message.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'members'] });
    },
    onError: notifyError,
  });
  const inviteMutation = useMutation({
    mutationFn: (values: { email: string; role: Role }) => invitationsApi.create(workspaceId, values),
    onSuccess: () => {
      message.success('Invitation sent');
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'invitations'] });
    },
    onError: notifyError,
  });

  return (
    <>
      <PageHeader title="Members" subtitle="Manage workspace users and invitations." />
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Members">
            <Table
              rowKey="id"
              loading={membersQuery.isLoading}
              dataSource={membersQuery.data ?? []}
              columns={[
                { title: 'Name', dataIndex: 'fullName' },
                { title: 'Email', dataIndex: 'email' },
                {
                  title: 'Role',
                  dataIndex: 'role',
                  render: (role: Role, member: Member) => (
                    <Select
                      value={role}
                      options={roleSelectOptions}
                      onChange={(nextRole) => updateRoleMutation.mutate({ memberId: member.id, role: nextRole })}
                    />
                  ),
                },
                { title: 'Joined', dataIndex: 'joinedAt', render: formatDate },
                {
                  title: 'Actions',
                  render: (_, member) => (
                    <Popconfirm title="Remove member?" onConfirm={() => removeMutation.mutate(member.id)}>
                      <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Invite">
            <Form layout="vertical" initialValues={{ role: 'USER' }} onFinish={(values) => inviteMutation.mutate(values)}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input prefix={<MailOutlined />} />
              </Form.Item>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select options={roleSelectOptions} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={inviteMutation.isPending}>
                Send invitation
              </Button>
            </Form>
          </Card>
        </Col>
        <Col span={24}>
          <Card title="Invitations">
            <Table
              rowKey="id"
              loading={invitationsQuery.isLoading}
              dataSource={invitationsQuery.data ?? []}
              columns={[
                { title: 'Email', dataIndex: 'email' },
                { title: 'Role', dataIndex: 'role' },
                { title: 'Status', dataIndex: 'status', render: (status) => <Tag>{status}</Tag> },
                { title: 'Expires', dataIndex: 'expiresAt', render: formatDate },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export const PermissionsPage = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const permissionsQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'permissions'],
    queryFn: () => permissionsApi.list(workspaceId),
  });
  const updateMutation = useMutation({
    mutationFn: (payload: { role: Role; permission: Permission; enabled: boolean }) =>
      permissionsApi.update(workspaceId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'permissions'] }),
    onError: notifyError,
  });

  const rows = permissionsQuery.data ?? [];
  const enabled = (role: Role, permission: Permission) =>
    role === 'ADMIN' ||
    (rows.find((item: PermissionSetting) => item.role === role && item.permission === permission)?.enabled ?? false);

  return (
    <>
      <PageHeader title="Permissions" subtitle="Toggle workspace permissions by local role." />
      <Card>
        {permissionsQuery.isError && <InlineError error={permissionsQuery.error} />}
        <Table
          rowKey="permission"
          loading={permissionsQuery.isLoading}
          dataSource={allPermissions.map((permission) => ({ permission }))}
          pagination={false}
          columns={[
            { title: 'Permission', dataIndex: 'permission' },
            ...configurableRoles.map((role) => ({
              title: role,
              render: (row: { permission: Permission }) => (
                <Switch
                  checked={enabled(role, row.permission)}
                  disabled={role === 'ADMIN'}
                  loading={role !== 'ADMIN' && updateMutation.isPending}
                  onChange={(checked) => updateMutation.mutate({ role, permission: row.permission, enabled: checked })}
                />
              ),
            })),
          ]}
        />
      </Card>
    </>
  );
};

export const AuditPage = () => {
  const workspaceId = useWorkspaceId();
  const auditQuery = useQuery({
    queryKey: ['workspaces', workspaceId, 'audit-logs'],
    queryFn: () => auditApi.list(workspaceId),
  });

  return (
    <>
      <PageHeader title="Audit logs" subtitle="Workspace activity history." />
      <Card>
        <Table
          rowKey="id"
          loading={auditQuery.isLoading}
          dataSource={auditQuery.data ?? []}
          columns={[
            { title: 'Action', dataIndex: 'action' },
            { title: 'Details', dataIndex: 'details' },
            { title: 'Actor', dataIndex: 'actorName' },
            { title: 'Time', dataIndex: 'timestamp', render: formatDate },
          ]}
        />
      </Card>
    </>
  );
};

export const WorkspaceSettingsPage = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const workspaceQuery = useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: () => workspacesApi.get(workspaceId),
  });
  const updateMutation = useMutation({
    mutationFn: (values: { name: string; joinMode: JoinMode; joinPassword?: string }) =>
      workspacesApi.update(workspaceId, values),
    onSuccess: () => {
      message.success('Workspace updated');
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: notifyError,
  });

  if (workspaceQuery.isLoading) {
    return <LoadingState label="Loading workspace" />;
  }

  if (workspaceQuery.isError) {
    return <ErrorState error={workspaceQuery.error} onRetry={() => workspaceQuery.refetch()} />;
  }

  const workspace = workspaceQuery.data;

  if (!workspace) {
    return <EmptyState description="Workspace is not available" />;
  }

  return (
    <>
      <PageHeader title="Workspace settings" subtitle="Update workspace access settings." />
      <Card>
        <Form
          layout="vertical"
          initialValues={workspace}
          onFinish={(values) => updateMutation.mutate(values)}
        >
          <Descriptions bordered column={1} className="settings-description">
            <Descriptions.Item label="Join code">{workspace.joinCode}</Descriptions.Item>
            <Descriptions.Item label="Owner">{workspace.ownerName}</Descriptions.Item>
            <Descriptions.Item label="Created">{formatDate(workspace.createdAt)}</Descriptions.Item>
          </Descriptions>
          <Divider />
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="joinMode" label="Join mode" rules={[{ required: true }]}>
            <Select options={joinModeOptions} />
          </Form.Item>
          <Form.Item name="joinPassword" label="Join password">
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
            Save workspace
          </Button>
        </Form>
      </Card>
    </>
  );
};

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ['users', 'me'], queryFn: usersApi.me });
  const updateMutation = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      message.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: notifyError,
  });
  const passwordMutation = useMutation({
    mutationFn: usersApi.updatePassword,
    onSuccess: () => message.success('Password updated'),
    onError: notifyError,
  });
  const profile = profileQuery.data ?? user;

  if (profileQuery.isLoading && !profile) {
    return <LoadingState label="Loading profile" />;
  }

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account details." />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Account">
            <Form
              layout="vertical"
              initialValues={profile ?? undefined}
              onFinish={(values) => updateMutation.mutate(values)}
            >
              <Form.Item label="Email">
                <Input value={profile?.email} disabled />
              </Form.Item>
              <Form.Item name="fullName" label="Full name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="positionTitle" label="Position title" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                Save profile
              </Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Password">
            <Form layout="vertical" onFinish={(values) => passwordMutation.mutate(values)}>
              <Form.Item name="currentPassword" label="Current password" rules={[{ required: true }]}>
                <Input.Password />
              </Form.Item>
              <Form.Item name="newPassword" label="New password" rules={[{ required: true, min: 6 }]}>
                <Input.Password />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={passwordMutation.isPending}>
                Update password
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export const VerifyNeededPage = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const resendMutation = useMutation({
    mutationFn: () => authApi.resendVerification(user?.email ?? ''),
    onSuccess: () => message.success('Verification email sent'),
    onError: notifyError,
  });

  return (
    <main className="auth-page">
      <Card className="auth-panel" bordered={false}>
        <Space direction="vertical" size={20} className="full-width">
          <Typography.Title level={2}>Verify your email</Typography.Title>
          <Typography.Text type="secondary">
            Check {user?.email ?? 'your inbox'} for a verification link before continuing.
          </Typography.Text>
          <Button type="primary" loading={resendMutation.isPending} onClick={() => resendMutation.mutate()}>
            Resend verification email
          </Button>
          <Button onClick={logout}>Log out</Button>
        </Space>
      </Card>
    </main>
  );
};

export const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const verifyQuery = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => authApi.verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
  });

  if (!token) {
    return <ResultPage status="warning" title="Verification token is missing" link="/auth" />;
  }

  if (verifyQuery.isLoading) {
    return <LoadingState label="Verifying email" />;
  }

  if (verifyQuery.isError) {
    return <ResultPage status="error" title={getApiErrorMessage(verifyQuery.error)} link="/auth" />;
  }

  return <ResultPage status="success" title="Email verified" link="/" />;
};

export const AcceptInvitationPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const acceptQuery = useQuery({
    queryKey: ['accept-invitation', token],
    queryFn: () => invitationsApi.accept(token),
    enabled: Boolean(token),
    retry: false,
  });

  if (!token) {
    return <ResultPage status="warning" title="Invitation token is missing" link="/" />;
  }

  if (acceptQuery.isLoading) {
    return <LoadingState label="Accepting invitation" />;
  }

  if (acceptQuery.isError) {
    return <ResultPage status="error" title={getApiErrorMessage(acceptQuery.error)} link="/" />;
  }

  return <ResultPage status="success" title="Invitation accepted" link="/" />;
};

const ResultPage = ({ status, title, link }: { status: 'success' | 'warning' | 'error'; title: string; link: string }) => (
  <main className="auth-page">
    <Card className="auth-panel" bordered={false}>
      <Space direction="vertical" size={20} className="full-width">
        <Tag color={status === 'success' ? 'success' : status === 'warning' ? 'warning' : 'error'}>
          {status.toUpperCase()}
        </Tag>
        <Typography.Title level={2}>{title}</Typography.Title>
        <Link to={link}>
          <Button type="primary">Continue</Button>
        </Link>
      </Space>
    </Card>
  </main>
);
