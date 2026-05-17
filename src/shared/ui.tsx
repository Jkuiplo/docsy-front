import { Alert, Button, Empty, Result, Spin } from 'antd';
import type { ReactNode } from 'react';
import { getApiErrorMessage } from './api/axios';

export const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) => (
  <div className="page-header">
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const LoadingState = ({ label = 'Loading' }: { label?: string }) => (
  <div className="center-state">
    <Spin tip={label} />
  </div>
);

export const ErrorState = ({ error, onRetry }: { error: unknown; onRetry?: () => void }) => (
  <Result
    status="warning"
    title="Something went wrong"
    subTitle={getApiErrorMessage(error)}
    extra={onRetry && <Button onClick={onRetry}>Try again</Button>}
  />
);

export const EmptyState = ({ description }: { description: string }) => (
  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
);

export const InlineError = ({ error }: { error: unknown }) => (
  <Alert showIcon type="error" message={getApiErrorMessage(error)} />
);
