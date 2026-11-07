import {Button, Card, Space, Statistic, Typography} from 'antd';
import * as echarts from 'echarts';
import {OopReactIgnore, OopReactObservable, OopReactRender} from 'oop-react';
import {useEffect, useRef} from 'react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';

/**
 * A thin presentational wrapper around an imperative library: it owns the
 * instance and its lifecycle, takes plain props, and knows nothing about the
 * object graph. This is the normal way to bring in ECharts, CodeMirror, a map…
 */
function EChart({option}: {option: echarts.EChartsOption}) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (host.current === null) return;

    const instance = echarts.init(host.current);
    chart.current = instance;

    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(host.current);

    return () => {
      observer.disconnect();
      instance.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    chart.current?.setOption(option, true);
  }, [option]);

  return <div ref={host} style={{height: 280, width: '100%'}} />;
}

export class ChartPage implements Page {
  readonly path = 'chart';
  readonly titleKey = 'route.chart';
  readonly sourcePath = 'demo/src/pages/chart/ChartPage.tsx';
  @OopReactIgnore
  readonly app: App;

  points: number[] = [120, 200, 150, 80, 70, 110, 130];
  days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(app: App) {
    this.app = app;
    OopReactObservable(this);
  }

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
    this.app.log.add('chart.randomize()');
  }

  double(): void {
    this.points = this.points.map((value) => value * 2);
    this.app.log.add('chart.double()');
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
            <EChart option={this.option} />
            <Typography.Text type="secondary">{t('chart.hint')}</Typography.Text>
          </Space>
        </Card>
      </div>
    );
  }
}
