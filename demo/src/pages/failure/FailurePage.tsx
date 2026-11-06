import {Alert, Button, Card, Space, Typography} from 'antd';
import {OopReactObservable, OopReactRender} from 'oop-react';
import type {ReactNode} from 'react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';

export class FailurePage implements Page {
  readonly path = 'failure';
  readonly titleKey = 'route.failure';
  readonly sourcePath = 'demo/src/pages/failure/FailurePage.tsx';
  readonly app: App;
  broken = false;

  constructor(app: App) {
    this.app = app;
    OopReactObservable(this, {app: false});
  }

  arm(): void {
    this.broken = true;
    this.app.log.add('failure.broken = true');
  }

  disarm(): void {
    this.broken = false;
    this.app.log.add('failure.broken = false');
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <div>
        <PageHeader
          title={t('failure.title')}
          description={t('failure.description')}
          sourceLabel={t('nav.source')}
          sourceUrl={sourceUrl(this.sourcePath)}
        />
        <Card size="small">
          <Space direction="vertical" size="middle" style={{width: '100%'}}>
            {this.controls()}
            {this.content()}
          </Space>
        </Card>
      </div>
    );
  }

  /** A sibling island: it keeps working while the one below throws. */
  @OopReactRender()
  controls() {
    const {t} = this.app.settings;

    return (
      <Space wrap>
        <Button danger onClick={this.arm}>
          {t('failure.arm')}
        </Button>
        <Button onClick={this.disarm}>{t('failure.disarm')}</Button>
        <Typography.Text type="secondary">{t('failure.hint')}</Typography.Text>
      </Space>
    );
  }

  // Named explicitly: this one is printed in the fallback, and a production
  // build minifies the class name.
  @OopReactRender({name: 'FailurePage'})
  content(): ReactNode {
    const {t} = this.app.settings;

    if (this.broken) {
      throw new Error(t('failure.error'));
    }

    return <Alert type="success" showIcon message={t('failure.ok')} />;
  }
}
