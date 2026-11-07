import {Button, Card, Space, Typography} from 'antd';
import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import {bumpRender} from '../../app/renderStats';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';

@OopReactState
export class CounterPage implements Page {
  readonly path = 'counter';
  readonly titleKey = 'route.counter';
  readonly sourcePath = 'demo/src/pages/counter/CounterPage.tsx';
  @OopReactIgnore readonly app: App;
  count = 0;

  constructor(app: App) {
    this.app = app;
  }

  increment(): void {
    this.count += 1;
    this.app.log.add(`counter.count = ${this.count}`);
  }

  decrement(): void {
    this.count -= 1;
    this.app.log.add(`counter.count = ${this.count}`);
  }

  reset(): void {
    this.count = 0;
    this.app.log.add('counter.count = 0');
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;
    const renders = bumpRender('counter');

    return (
      <div>
        <PageHeader
          title={t('counter.title')}
          description={t('counter.description')}
          sourceLabel={t('nav.source')}
          sourceUrl={sourceUrl(this.sourcePath)}
        />
        <Card size="small" extra={<span className="render-count">renders: {renders}</span>}>
          <Space direction="vertical" size="middle" style={{width: '100%'}}>
            <Typography.Title level={2} style={{margin: 0}}>
              {this.count}
            </Typography.Title>
            <Space>
              <Button onClick={this.decrement}>-1</Button>
              <Button type="primary" onClick={this.increment}>
                +1
              </Button>
              <Button onClick={this.reset}>reset</Button>
            </Space>
            <span className="muted">
              <code>onClick={'{'}this.increment{'}'}</code> — no useCallback, no dependency array.
            </span>
          </Space>
        </Card>
      </div>
    );
  }
}
