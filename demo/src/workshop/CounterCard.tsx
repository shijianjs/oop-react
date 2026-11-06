import {Button, Card, Space, Typography} from 'antd';
import {OopReactObservable, OopReactRender} from 'oop-react';
import {bumpRender} from '../app/renderStats';
import type {Workshop} from './Workshop';

export class CounterCard {
  count = 0;
  readonly workshop: Workshop;

  constructor(workshop: Workshop) {
    this.workshop = workshop;
    OopReactObservable(this, {workshop: false});
  }

  increment(): void {
    this.count += 1;
    this.workshop.log.add(`计数 → ${this.count}`);
  }

  decrement(): void {
    this.count -= 1;
    this.workshop.log.add(`计数 → ${this.count}`);
  }

  reset(): void {
    this.count = 0;
    this.workshop.log.add('计数归零');
  }

  @OopReactRender()
  view() {
    const renders = bumpRender('counter');

    return (
      <Card title="计数器" extra={<span className="render-count">这个岛渲染 {renders} 次</span>}>
        <Space direction="vertical" size="middle" style={{width: '100%'}}>
          <Typography.Title level={2} style={{margin: 0}}>
            {this.count}
          </Typography.Title>
          <Space>
            <Button onClick={this.decrement}>-1</Button>
            <Button type="primary" onClick={this.increment}>
              +1
            </Button>
            <Button onClick={this.reset}>归零</Button>
          </Space>
          <span className="muted">
            三个按钮是三个方法；方法里顺手写了 <code>this.workshop.log</code> —— 持有关系，不是回调。
          </span>
        </Space>
      </Card>
    );
  }
}
