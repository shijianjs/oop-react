import {Button, Card, Space, Typography} from 'antd';
import {OopReactComponent, OopReactRender} from 'oop-react';
import {bumpRender} from '../app/renderStats';

class Counter {
  count = 0;

  increment(): void {
    this.count += 1;
  }

  decrement(): void {
    this.count -= 1;
  }

  reset(): void {
    this.count = 0;
  }

  @OopReactRender()
  view() {
    const renders = bumpRender('counter');

    return (
      <Card
        title="计数器"
        extra={<span className="render-count">这个岛渲染 {renders} 次</span>}
      >
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
            三个按钮直接传 <code>this.increment</code>：实例方法已经绑好，不需要 useCallback，也不存在依赖数组。
          </span>
        </Space>
      </Card>
    );
  }
}

export const CounterCard = OopReactComponent(Counter, 'view');
