import {Button, Card, Input, Segmented, Space, Typography} from 'antd';
import {OopReactComponent, OopReactRender} from 'oop-react';
import {bumpRender} from '../app/renderStats';

type Filter = 'all' | 'open' | 'done';

interface TodoItem {
  id: number;
  title: string;
  done: boolean;
}

class TodoBoard {
  draft = '';
  filter: Filter = 'all';
  items: TodoItem[] = [];
  #nextId = 1;

  /** Computed: recomputed only when `items` or `filter` changes. */
  get visible(): TodoItem[] {
    if (this.filter === 'open') return this.items.filter((item) => !item.done);
    if (this.filter === 'done') return this.items.filter((item) => item.done);
    return this.items;
  }

  get remaining(): number {
    return this.items.filter((item) => !item.done).length;
  }

  setDraft(value: string): void {
    this.draft = value;
  }

  setFilter(filter: Filter): void {
    this.filter = filter;
  }

  add(): void {
    const title = this.draft.trim();
    if (title === '') return;
    this.items.push({id: this.#nextId, title, done: false});
    this.#nextId += 1;
    this.draft = '';
  }

  toggle(id: number): void {
    const item = this.items.find((candidate) => candidate.id === id);
    if (item !== undefined) item.done = !item.done;
  }

  remove(id: number): void {
    this.items = this.items.filter((item) => item.id !== id);
  }

  @OopReactRender()
  view() {
    return (
      <Card
        title="待办"
        extra={<span className="render-count">这个岛渲染 {bumpRender('todos')} 次</span>}
      >
        <Space direction="vertical" size="middle" style={{width: '100%'}}>
          {this.composer()}
          {this.list()}
        </Space>
      </Card>
    );
  }

  /** Its own island: typing only re-renders the input row, not the list. */
  @OopReactRender()
  composer() {
    return (
      <Space.Compact style={{width: '100%'}}>
        <Input
          value={this.draft}
          placeholder="写一条待办，回车提交"
          onChange={(event) => this.setDraft(event.target.value)}
          onPressEnter={() => this.add()}
        />
        <Button type="primary" onClick={() => this.add()}>
          添加
        </Button>
      </Space.Compact>
    );
  }

  @OopReactRender()
  list() {
    const items = this.visible;

    return (
      <Space direction="vertical" size="small" style={{width: '100%'}}>
        <Space style={{justifyContent: 'space-between', width: '100%'}}>
          <Segmented<Filter>
            value={this.filter}
            onChange={(value) => this.setFilter(value)}
            options={[
              {label: '全部', value: 'all'},
              {label: '未完成', value: 'open'},
              {label: '已完成', value: 'done'},
            ]}
          />
          <Typography.Text type="secondary">还剩 {this.remaining} 条</Typography.Text>
        </Space>
        {items.length === 0 ? (
          <Typography.Text type="secondary">这里还没有条目。</Typography.Text>
        ) : (
          <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
            {items.map((item) => (
              <li
                key={item.id}
                style={{alignItems: 'center', display: 'flex', gap: 8, padding: '4px 0'}}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => this.toggle(item.id)}
                  aria-label={item.title}
                />
                <span style={{flex: 1, textDecoration: item.done ? 'line-through' : 'none'}}>
                  {item.title}
                </span>
                <Button size="small" type="text" danger onClick={() => this.remove(item.id)}>
                  删除
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Space>
    );
  }
}

export const TodoCard = OopReactComponent(TodoBoard, 'view');
