import {Alert, Card, Skeleton, Space, Tag, Typography} from 'antd';
import {
  OopReactAsyncView,
  OopReactIgnore,
  OopReactRender,
  OopReactResource,
  OopReactState,
} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';
import {ActionButton} from './ActionButton';

/** 假接口：延迟 + 可选失败，够演示「成功 / 失败 / 慢到超时」三种情况。 */
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

async function slowRequest(ms: number): Promise<number> {
  await sleep(ms);
  return 999;
}

async function reportRows(ms: number): Promise<number[]> {
  await sleep(ms);
  return Array.from({length: 3}, () => 10 + Math.round(Math.random() * 50));
}

async function brokenReport(ms: number): Promise<never> {
  await sleep(ms);
  throw new Error('HTTP 503 /api/report');
}

/**
 * 每个按钮是一个对象，各带一个 `LoadingState`：点 A 的时候 B 照样能点，
 * 各自转各自的圈。失败提示、超时、顶上那条全局进度，都在按钮对象和 `app` 里。
 */
@OopReactState
export class LoadingPage implements Page {
  readonly path = 'loading';
  readonly titleKey = 'route.loading';
  readonly sourcePath = 'demo/src/pages/loading/LoadingPage.tsx';
  @OopReactIgnore readonly app: App;
  @OopReactIgnore readonly buttons: ActionButton[];
  @OopReactIgnore readonly report: ReportCard;

  constructor(app: App) {
    this.app = app;
    this.buttons = [
      new ActionButton(app, {labelKey: 'loading.task.save', primary: true, task: () => this.save()}),
      new ActionButton(app, {labelKey: 'loading.task.export', task: () => this.exportReport()}),
      new ActionButton(app, {labelKey: 'loading.task.flaky', danger: true, task: () => this.fail()}),
      new ActionButton(app, {labelKey: 'loading.task.slow', timeoutMs: 1500, task: () => this.slow()}),
    ];
    this.report = new ReportCard(this);
  }

  async save(): Promise<void> {
    const {t} = this.app.settings;
    const id = await saveOrder(900);
    this.app.feedback.success(t('loading.done.save', {id}));
    this.app.log.add(`loading.save = ${id}`);
  }

  async exportReport(): Promise<void> {
    const {t} = this.app.settings;
    const rows = await exportReport(1600);
    this.app.feedback.success(t('loading.done.export', {rows}));
  }

  /** 直接抛：`LoadingState` 会把它变成 `{ok: false}`，按钮负责弹提示。 */
  async fail(): Promise<void> {
    await flakyRequest(900);
  }

  /**
   * 这个请求要 5 秒，按钮上给的上限是 1.5 秒 —— 到点就报超时。
   *
   * 超时只让按钮这边先收工，请求本身不会停：所以这里不弹成功提示，否则 3.5 秒后
   * 会凭空冒出一条。真项目里把 `AbortSignal` 传进 `fetch`，让它真的断掉。
   */
  async slow(): Promise<void> {
    await slowRequest(5000);
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
            <Space direction="vertical" size="small" style={{width: '100%'}}>
              <Space wrap>{this.buttons.map((button) => button.view())}</Space>
              <Typography.Text type="secondary">{t('loading.hint')}</Typography.Text>
            </Space>
          </Card>
          {this.report.view()}
        </Space>
      </div>
    );
  }
}

/**
 * 延时数据的三个界面：骨架屏 / 数据 / 失败。
 *
 * 分支在 `asyncView` 里只写一次，这个对象只管「有数据时画什么」——
 * 所以它能出现在任何只留得下一个 node 的位置：弹窗的 children、表格的 render、回调组件的返回值。
 */
@OopReactState
export class ReportCard {
  @OopReactIgnore readonly page: LoadingPage;
  /** 数据 / 加载中 / 错误三件套交给库里的 `OopReactResource`。 */
  @OopReactIgnore readonly rows = new OopReactResource<number[]>();
  @OopReactIgnore readonly reloadButton: ActionButton;
  @OopReactIgnore readonly brokenButton: ActionButton;

  constructor(page: LoadingPage) {
    this.page = page;
    this.reloadButton = new ActionButton(page.app, {
      labelKey: 'loading.task.report',
      task: () => this.load(false),
    });
    this.brokenButton = new ActionButton(page.app, {
      labelKey: 'loading.task.reportFail',
      danger: true,
      task: () => this.load(true),
    });
  }

  /** 失败不抛：`OopReactResource` 记在 `error` 上，交给 `asyncView` 画成失败态。 */
  async load(fail: boolean): Promise<void> {
    await this.rows.load(() => (fail ? brokenReport(900) : reportRows(1100)));
  }

  @OopReactRender()
  view() {
    const {t} = this.page.app.settings;

    return (
      <Card size="small" title={t('loading.report.title')}>
        <Space direction="vertical" size="small" style={{width: '100%'}}>
          <span className="muted">{t('loading.report.body')}</span>
          {OopReactAsyncView(this.rows, {
            skeleton: <Skeleton active title={false} paragraph={{rows: 1}} />,
            ready: this.values(),
            failed: (error) => (
              <Alert type="error" showIcon title={t('loading.report.failed', {message: String(error)})} />
            ),
          })}
          <Space wrap>
            {this.reloadButton.view()}
            {this.brokenButton.view()}
          </Space>
        </Space>
      </Card>
    );
  }

  @OopReactRender()
  values() {
    const rows = this.rows.data ?? [];

    return (
      <Space wrap>
        {rows.map((row) => (
          <Tag key={row}>{row}</Tag>
        ))}
      </Space>
    );
  }
}
