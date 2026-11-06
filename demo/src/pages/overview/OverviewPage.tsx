import {Card, Space} from 'antd';
import {OopReactRender} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';

/**
 * A page with no state of its own: its island re-renders only when the language
 * changes, because `t()` is the only thing it reads.
 */
export class OverviewPage implements Page {
  readonly path = 'overview';
  readonly titleKey = 'route.overview';
  readonly sourcePath = 'demo/src/pages/overview/OverviewPage.tsx';
  readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <div>
        <PageHeader
          title={t('overview.title')}
          description={t('overview.description')}
          sourceLabel={t('nav.source')}
          sourceUrl={sourceUrl(this.sourcePath)}
        />
        <Space direction="vertical" size="middle" style={{width: '100%'}}>
          <Card size="small">{t('overview.graph')}</Card>
          <Card size="small">{t('overview.cross')}</Card>
          <Card size="small" type="inner">
            {t('overview.try')}
          </Card>
        </Space>
      </div>
    );
  }
}
