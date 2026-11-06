import {Button, Space} from 'antd';
import type {ReactNode} from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  actions?: ReactNode;
}

/**
 * A presentational component taking props — deliberately *not* an object. Props
 * are what you use at the edge: this thing knows nothing about the graph, so any
 * page (or any React page) can reuse it.
 */
export function PageHeader({title, description, sourceLabel, sourceUrl, actions}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </div>
      <Space>
        {actions}
        <Button size="small" href={sourceUrl} target="_blank" rel="noreferrer">
          {sourceLabel}
        </Button>
      </Space>
    </div>
  );
}
