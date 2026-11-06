import {Button, Card, Space, Typography} from 'antd';
import {OopReactObservable, OopReactRender} from 'oop-react';
import {bumpRender} from '../app/renderStats';
import {ActivityLog} from './ActivityLog';
import {CounterCard} from './CounterCard';
import {FlakySection} from './FlakySection';
import {InviteBoard} from './InviteBoard';
import {TodoBoard} from './TodoBoard';
import type {TodoItem} from './TodoItem';

/** On GitHub Pages the demo lives under `<site>/demo/`; locally it lives at `/`. */
const docsHref = import.meta.env.BASE_URL.replace(/demo\/$/, '');

/**
 * The root of the object graph. It owns five collaborators and one reference to
 * a selected item; the children hold it back, so any of them can reach any other
 * without going through props.
 */
export class Workshop {
  readonly log: ActivityLog;
  readonly counter: CounterCard;
  readonly todos: TodoBoard;
  readonly invites: InviteBoard;
  readonly flaky: FlakySection;
  selected: TodoItem | null = null;

  constructor() {
    // Children first: they only store the reference, but building them before
    // the parent declares its own state keeps the order obvious.
    this.log = new ActivityLog();
    this.counter = new CounterCard(this);
    this.todos = new TodoBoard(this);
    this.invites = new InviteBoard(this);
    this.flaky = new FlakySection(this);

    // `log: false` and friends: those fields hold objects that already declared
    // their own state. `selected` is deliberately *not* listed — it is this
    // object's state, and the detail island has to re-render when it changes.
    OopReactObservable(this, {
      log: false,
      counter: false,
      todos: false,
      invites: false,
      flaky: false,
    });
  }

  select(item: TodoItem | null): void {
    this.selected = item;
  }

  @OopReactRender()
  view() {
    return (
      <div className="page">
        <header className="page-header">
          <Typography.Title level={1} style={{marginBottom: 8}}>
            oop-react
          </Typography.Title>
          <Typography.Paragraph style={{marginBottom: 12, maxWidth: '70ch'}}>
            这一页只有两行 React：一个函数组件返回 <code>workshop.view()</code>。下面所有卡片都是对象 ——{' '}
            <code>Workshop</code> 持有五个子对象，待办项又反过来持有自己的板子和整个 Workshop。勾一条待办，
            它直接写进底部日志：没有回调、没有 context、没有 ref。
          </Typography.Paragraph>
          <Space>
            <Button type="primary" href={docsHref}>
              读文档
            </Button>
            <Button href="https://github.com/shijianjs/oop-react">GitHub</Button>
          </Space>
        </header>

        <main className="workshop-grid">
          {this.counter.view()}
          {this.todos.view()}
          {this.invites.view()}
          {this.flaky.view()}
          {this.detail()}
          {this.log.view()}
        </main>
      </div>
    );
  }

  /** One-to-one: a reference to somebody else's child, rendered by its own island. */
  @OopReactRender()
  detail() {
    const renders = bumpRender('detail');
    const item = this.selected;

    return (
      <Card
        title="选中的待办"
        extra={<span className="render-count">这个岛渲染 {renders} 次</span>}
      >
        {item === null ? (
          <Typography.Text type="secondary">
            点一条待办的标题，这里显示它。选中项是 Workshop 的字段，卡片读取它，所以只有这块重渲染。
          </Typography.Text>
        ) : (
          <Space direction="vertical" size="small" style={{width: '100%'}}>
            <Typography.Text strong>{item.title}</Typography.Text>
            <Typography.Text type="secondary">状态：{item.status}（读的是那条待办自己的字段）</Typography.Text>
            <Space>
              <Button size="small" onClick={() => item.toggle()}>
                切换状态
              </Button>
              <Button size="small" danger onClick={() => item.remove()}>
                删除
              </Button>
            </Space>
          </Space>
        )}
      </Card>
    );
  }
}
