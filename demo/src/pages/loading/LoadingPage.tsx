import {Button, Card, Space, Tag, Typography} from 'antd';
import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';
import {LoadingState} from './LoadingState';

/** 假接口：延迟 + 可选失败，四种情况（快 / 慢 / 失败 / 并发）够用了。 */
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function saveOrder(ms: number): Promise<string> {
  await sleep(ms);
  return '#42';
}

async function exportReport(ms: number): Promise<number> {
  await sleep(ms);
  return 128;
}

async function flakyRequest(ms: number): Promise<never> {
  await sleep(ms);
  throw new Error('HTTP 500 /api/orders');
}

async function reportRows(ms: number): Promise<number[]> {
  await sleep(ms);
  return Array.from({length: 3}, () => 10 + Math.round(Math.random() * 50));
}

/**
 * Loading state as a shared object: one instance, four buttons on the page plus
 * one on a child object, all funnelled through `loading.run()`.
 *
 * The point of the page is that the boring part — count, progress, catch, reset —
 * is written once and lives on an object, not in a hook that every button would
 * have to repeat.
 */
@OopReactState
export class LoadingPage implements Page {
  readonly path = 'loading';
  readonly titleKey = 'route.loading';
  readonly sourcePath = 'demo/src/pages/loading/LoadingPage.tsx';
  @OopReactIgnore readonly app: App;
  @OopReactIgnore readonly loading: LoadingState;
  @OopReactIgnore readonly report: ReportCard;

  constructor(app: App) {
    this.app = app;
    this.loading = new LoadingState(app);
    this.report = new ReportCard(this);
  }

  async save(): Promise<void> {
    const {t} = this.app.settings;
    const result = await this.loading.run('loading.task.save', () => saveOrder(900));
    if (!result.ok) return;

    this.app.feedback.success(t('loading.done.save', {id: result.value}));
    this.app.log.add(`loading.save = ${result.value}`);
  }

  async exportReport(): Promise<void> {
    const {t} = this.app.settings;
    const result = await this.loading.run('loading.task.export', () => exportReport(1600));
    if (!result.ok) return;

    this.app.feedback.success(t('loading.done.export', {rows: result.value}));
  }

  /** 失败提示已经在 `LoadingState` 里弹过了，这里什么都不用写 —— 这就是封装的意义。 */
  async fail(): Promise<void> {
    await this.loading.run('loading.task.flaky', () => flakyRequest(900));
  }

  /** 两个请求叠在一起：`count` 变成 2，先结束的那个不会把条关掉。 */
  async both(): Promise<void> {
    const {t} = this.app.settings;
    const [saved, exported] = await Promise.all([
      this.loading.run('loading.task.save', () => saveOrder(700)),
      this.loading.run('loading.task.export', () => exportReport(1500)),
    ]);

    if (saved.ok) this.app.feedback.success(t('loading.done.save', {id: saved.value}));
    if (exported.ok) this.app.feedback.success(t('loading.done.export', {rows: exported.value}));
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <div>
        <PageHeader
          title={t('loading.title')}
          description={t('loading.description')}
          sourceLabel={t('nav.source')}
          sourceUrl={sourceUrl(this.sourcePath)}
        />
        <Space direction="vertical" size="middle" style={{width: '100%'}}>
          <Card size="small">
            <Space direction="vertical" size="middle" style={{width: '100%'}}>
              {/* 固定高度：条出现/消失时按钮不会跳一下 */}
              <div className="loading-slot">{this.loading.bar()}</div>
              {this.actions()}
              <Typography.Text type="secondary">{t('loading.hint')}</Typography.Text>
            </Space>
          </Card>
          {this.report.view()}
        </Space>
      </div>
    );
  }

  @OopReactRender()
  actions() {
    const {t} = this.app.settings;

    return (
      <Space wrap>
        <Button type="primary" onClick={() => void this.save()}>
          {t('loading.task.save')}
        </Button>
        <Button onClick={() => void this.exportReport()}>{t('loading.task.export')}</Button>
        <Button danger onClick={() => void this.fail()}>
          {t('loading.task.flaky')}
        </Button>
        <Button onClick={() => void this.both()}>{t('loading.task.both')}</Button>
      </Space>
    );
  }
}

/**
 * A second consumer of the same `LoadingState`: no provider, no callback passed
 * down — this object holds the page, the page holds the loading state.
 */
@OopReactState
export class ReportCard {
  @OopReactIgnore readonly page: LoadingPage;
  rows: number[] = [18, 32, 47];

  constructor(page: LoadingPage) {
    this.page = page;
  }

  async refresh(): Promise<void> {
    const {app, loading} = this.page;
    const result = await loading.run('loading.task.report', () => reportRows(1100));
    if (!result.ok) return;

    this.rows = result.value;
    app.feedback.success(app.settings.t('loading.done.report'));
  }

  @OopReactRender()
  view() {
    const {t} = this.page.app.settings;

    return (
      <Card size="small" title={t('loading.report.title')}>
        <Space direction="vertical" size="small" style={{width: '100%'}}>
          <span className="muted">{t('loading.report.body')}</span>
          <Space wrap>
            {this.rows.map((row) => (
              <Tag key={row}>{row}</Tag>
            ))}
          </Space>
          <Button size="small" onClick={() => void this.refresh()}>
            {t('loading.task.report')}
          </Button>
        </Space>
      </Card>
    );
  }
}
