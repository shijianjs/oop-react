import {Button, Card, Space, Statistic, Typography} from 'antd';
import * as echarts from 'echarts';
import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';

/**
 * An imperative library, owned by the object.
 *
 * The only thing React does here is hand over the DOM node — a ref callback that
 * points straight at `attach`. No `useRef`, no `useEffect`, no wrapper component:
 * the object creates the chart, keeps it, repaints when its own data changes, and
 * tears it down when React takes the node away.
 *
 * Compare with the usual `<Chart option={…} />` wrapper: that shape re-creates the
 * instance lifecycle inside every project that needs a chart. Here the lifecycle
 * is a field of the page, the same object that owns the data.
 */
@OopReactState
export class ChartPage implements Page {
  readonly path = 'chart';
  readonly titleKey = 'route.chart';
  readonly sourcePath = 'demo/src/pages/chart/ChartPage.tsx';
  @OopReactIgnore readonly app: App;

  @OopReactIgnore host: HTMLDivElement | null = null;
  // Private fields never show up in `Object.keys`, so they are not observed and
  // need no mark (and legacy decorators cannot be applied to `#names` anyway).
  #chart: echarts.ECharts | null = null;
  #resize: ResizeObserver | null = null;

  points: number[] = [120, 200, 150, 80, 70, 110, 130];
  days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(app: App) {
    this.app = app;
  }

  /**
   * A ref callback with a stable identity: React calls it with the node on mount
   * and with `null` on unmount — which is exactly the lifetime of the chart.
   */
  attach = (node: HTMLDivElement | null): void => {
    this.#resize?.disconnect();
    this.#resize = null;

    if (node === null) {
      this.#chart?.dispose();
      this.#chart = null;
      this.host = null;
      return;
    }

    this.host = node;
    this.#chart = echarts.init(node);
    this.#resize = new ResizeObserver(() => this.#chart?.resize());
    this.#resize.observe(node);
    this.paint();
  };

  get total(): number {
    return this.points.reduce((sum, value) => sum + value, 0);
  }

  /** The chart's whole configuration is derived state — no local copy. */
  get option(): echarts.EChartsOption {
    return {
      grid: {left: 40, right: 16, top: 24, bottom: 32},
      tooltip: {trigger: 'axis'},
      xAxis: {type: 'category', data: this.days},
      yAxis: {type: 'value'},
      series: [
        {
          type: 'line',
          smooth: true,
          areaStyle: {opacity: 0.15},
          data: this.points,
        },
      ],
    };
  }

  randomize(): void {
    this.points = this.points.map(() => Math.round(40 + Math.random() * 200));
    this.paint();
    this.app.log.add('chart.randomize()');
  }

  double(): void {
    this.points = this.points.map((value) => value * 2);
    this.paint();
    this.app.log.add('chart.double()');
  }

  /** Called by the data-changing methods; nothing else decides when to redraw. */
  paint(): void {
    this.#chart?.setOption(this.option, true);
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <div>
        <PageHeader
          title={t('chart.title')}
          description={t('chart.description')}
          sourceLabel={t('nav.source')}
          sourceUrl={sourceUrl(this.sourcePath)}
        />
        <Card size="small">
          <Space direction="vertical" size="middle" style={{width: '100%'}}>
            <Space>
              <Button type="primary" onClick={() => this.randomize()}>
                {t('chart.random')}
              </Button>
              <Button onClick={() => this.double()}>{t('chart.double')}</Button>
              <Statistic title={t('chart.total')} value={this.total} />
            </Space>
            {this.canvas()}
            <Typography.Text type="secondary">{t('chart.hint')}</Typography.Text>
          </Space>
        </Card>
      </div>
    );
  }

  @OopReactRender()
  canvas() {
    return <div ref={this.attach} style={{height: 280, width: '100%'}} />;
  }
}
