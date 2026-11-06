import {Alert, Button, Card, Space, Typography} from 'antd';
import {OopReactComponent, OopReactRender} from 'oop-react';
import type {ReactNode} from 'react';
import {bumpRender} from '../app/renderStats';

class FailureBoard {
  broken = false;

  arm(): void {
    this.broken = true;
  }

  disarm(): void {
    this.broken = false;
  }

  @OopReactRender()
  view() {
    return (
      <Card
        title="故障隔离"
        extra={<span className="render-count">这个岛渲染 {bumpRender('failure-shell')} 次</span>}
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
        <Typography.Text type="secondary">
          两个按钮在另一个岛里，故障期间照样能点。
        </Typography.Text>
      </Space>
    );
  }

  /** Throws on purpose: the point is that only this island loses its content. */
  @OopReactRender()
  content(): ReactNode {
    if (this.broken) {
      throw new Error('这个渲染方法故意抛错');
    }

    return (
      <Alert
        type="success"
        showIcon
        message="这个岛正常"
        description="点「让下面的岛抛错」之后，只有这里会被替换成 fallback；解除故障再点一下 fallback 上的「重试」即可恢复。"
      />
    );
  }
}

// An explicit name is what the fallback and the error report show. Without it
// the name comes from the class, which a production build minifies.
export const FailureCard = OopReactComponent(FailureBoard, 'view', {name: 'FailureBoard'});
