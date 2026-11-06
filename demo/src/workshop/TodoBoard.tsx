import {Button, Card, Input, Space, Typography} from 'antd';
import {OopReactObservable, OopReactRender} from 'oop-react';
import {bumpRender} from '../app/renderStats';
import {TodoItem} from './TodoItem';
import type {Workshop} from './Workshop';

/**
 * One-to-many: the board owns the items, and every item knows its board. The
 * board also splits into three islands, so typing in the composer does not touch
 * the list and adding an item does not touch the composer.
 */
export class TodoBoard {
  draft = '';
  items: TodoItem[] = [];
  readonly workshop: Workshop;

  constructor(workshop: Workshop) {
    this.workshop = workshop;
    OopReactObservable(this, {workshop: false});
  }

  get remaining(): number {
    return this.items.filter((item) => !item.done).length;
  }

  setDraft(value: string): void {
    this.draft = value;
  }

  add(): void {
    const title = this.draft.trim();
    if (title === '') return;
    this.items.push(new TodoItem(title, this));
    this.draft = '';
    this.workshop.log.add(`新增待办「${title}」`);
  }

  remove(item: TodoItem): void {
    this.items = this.items.filter((candidate) => candidate !== item);
    this.workshop.log.add(`删除待办「${item.title}」`);
    if (this.workshop.selected === item) {
      this.workshop.select(null);
    }
  }

  @OopReactRender()
  view() {
    return (
      <Card
        title="待办"
        extra={<span className="render-count">列表岛渲染 {bumpRender('todos')} 次</span>}
      >
        <Space direction="vertical" size="middle" style={{width: '100%'}}>
          {this.composer()}
          {this.list()}
        </Space>
      </Card>
    );
  }

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
    return (
      <Space direction="vertical" size="small" style={{width: '100%'}}>
        <Typography.Text type="secondary">还剩 {this.remaining} 条</Typography.Text>
        {this.items.length === 0 ? (
          <Typography.Text type="secondary">这里还没有条目。</Typography.Text>
        ) : (
          <ul className="todo-list">{this.items.map((item) => item.row())}</ul>
        )}
      </Space>
    );
  }
}
