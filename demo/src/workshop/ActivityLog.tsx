import {Card, Typography} from 'antd';
import {OopReactObservable, OopReactRender} from 'oop-react';
import {bumpRender} from '../app/renderStats';

/**
 * A leaf nobody renders *into* — everyone renders *through* it. Every other
 * object in the graph holds a reference to this one and writes to it directly,
 * which is what replaces callbacks and event buses here.
 */
export class ActivityLog {
  entries: string[] = [];

  constructor() {
    OopReactObservable(this);
  }

  add(entry: string): void {
    this.entries.unshift(entry);
    if (this.entries.length > 20) {
      this.entries.length = 20;
    }
  }

  @OopReactRender()
  view() {
    const renders = bumpRender('log');

    return (
      <Card
        title="活动日志"
        className="workshop-wide"
        extra={<span className="render-count">这个岛渲染 {renders} 次</span>}
      >
        {this.entries.length === 0 ? (
          <Typography.Text type="secondary">
            还没有任何操作。点别的卡片上的按钮，一行文字会出现在这里 —— 它是被写进来的，不是被通知出来的。
          </Typography.Text>
        ) : (
          <ol className="log-list">
            {this.entries.map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ol>
        )}
      </Card>
    );
  }
}
