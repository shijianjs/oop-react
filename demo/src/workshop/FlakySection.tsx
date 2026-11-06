import {Alert, Button, Card, Space, Typography} from 'antd';
import {OopReactObservable, OopReactRender} from 'oop-react';
import type {ReactNode} from 'react';
import {bumpRender} from '../app/renderStats';
import type {Workshop} from './Workshop';

/**
 * Two islands in one object: the controls keep working while the content island
 * throws, which is the whole point of one boundary per render method.
 */
export class FlakySection {
  broken = false;
  readonly workshop: Workshop;

  constructor(workshop: Workshop) {
    this.workshop = workshop;
    OopReactObservable(this, {workshop: false});
  }

  arm(): void {
    this.broken = true;
    this.workshop.log.add('让一个岛抛错');
  }

  disarm(): void {
    this.broken = false;
    this.workshop.log.add('解除故障');
  }

  @OopReactRender()
  view() {
    return (
      <Card
        title="故障隔离"
        extra={<span className="render-count">这个岛渲染 {bumpRender('flaky')} 次</span>}
      >
        <Space direction="vertical" size="middle" style={{width: '100%'}}>
          {this.controls()}
          {this.content()}
        </Space>
      </Card>
    );
  }

  @OopReactRender()
  controls() {
    return (
      <Space wrap>
        <Button danger onClick={this.arm}>
          让下面的岛抛错
        </Button>
        <Button onClick={this.disarm}>解除故障</Button>
        <Typography.Text type="secondary">故障期间这两个按钮照样能点。</Typography.Text>
      </Space>
    );
  }

  // The name is written out here because a production build minifies the class
  // name, and this one is printed in the fallback — the one a human reads.
  @OopReactRender({name: 'FlakySection'})
  content(): ReactNode {
    if (this.broken) {
      throw new Error('这个渲染方法故意抛错');
    }

    return (
      <Alert
        type="success"
        showIcon
        message="这个岛正常"
        description="抛错后只有这里变成 fallback，解除故障再点 fallback 上的「重试」即可恢复。"
      />
    );
  }
}
