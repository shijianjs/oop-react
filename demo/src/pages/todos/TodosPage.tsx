import {Button, Card, Input, Space, Typography} from 'antd';
import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';
import {TodoItem} from './TodoItem';

@OopReactState
export class TodosPage implements Page {
  readonly path = 'todos';
  readonly titleKey = 'route.todos';
  readonly sourcePath = 'demo/src/pages/todos/TodosPage.tsx';
  @OopReactIgnore readonly app: App;
  draft = '';
  items: TodoItem[] = [];
  /** One-to-one: a reference to somebody else's child, rendered by its own island. */
  selected: TodoItem | null = null;

  constructor(app: App) {
    this.app = app;
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
    this.app.log.add(`todos.add(${JSON.stringify(title)})`);
  }

  select(item: TodoItem | null): void {
    this.selected = item;
  }

  remove(item: TodoItem): void {
    this.items = this.items.filter((candidate) => candidate !== item);
    this.app.log.add(`todos.remove(${JSON.stringify(item.title)})`);
    if (this.selected === item) {
      this.selected = null;
    }
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <div>
        <PageHeader
          title={t('todos.title')}
          description={t('todos.description')}
          sourceLabel={t('nav.source')}
          sourceUrl={sourceUrl(this.sourcePath)}
        />
        <Space direction="vertical" size="middle" style={{width: '100%'}}>
          {this.composer()}
          {this.list()}
          {this.detail()}
        </Space>
      </div>
    );
  }

  /** Its own island: typing re-renders this row and nothing else. */
  @OopReactRender()
  composer() {
    const {t} = this.app.settings;

    return (
      <Space.Compact style={{width: '100%'}}>
        <Input
          value={this.draft}
          placeholder={t('todos.placeholder')}
          onChange={(event) => this.setDraft(event.target.value)}
          onPressEnter={() => this.add()}
        />
        <Button type="primary" onClick={() => this.add()}>
          {t('todos.add')}
        </Button>
      </Space.Compact>
    );
  }

  @OopReactRender()
  list() {
    const {t} = this.app.settings;

    return (
      <Card size="small">
        <Space direction="vertical" size="small" style={{width: '100%'}}>
          <Typography.Text type="secondary">
            {t('todos.remaining', {count: this.remaining})}
          </Typography.Text>
          {this.items.length === 0 ? (
            <Typography.Text type="secondary">{t('todos.empty')}</Typography.Text>
          ) : (
            <ul className="todo-list">{this.items.map((item) => item.row())}</ul>
          )}
        </Space>
      </Card>
    );
  }

  @OopReactRender()
  detail() {
    const {t} = this.app.settings;
    const item = this.selected;

    return (
      <Card size="small" title={t('todos.detail')}>
        {item === null ? (
          <Typography.Text type="secondary">{t('todos.detail.empty')}</Typography.Text>
        ) : (
          <Space direction="vertical" size="small">
            <Typography.Text strong>{item.title}</Typography.Text>
            <Typography.Text type="secondary">
              {t('todos.detail.status', {status: t(item.done ? 'todos.status.done' : 'todos.status.open')})}
            </Typography.Text>
            <Space>
              <Button size="small" onClick={() => item.toggle()}>
                {t('todos.detail.toggle')}
              </Button>
              <Button size="small" danger onClick={() => item.remove()}>
                {t('todos.detail.remove')}
              </Button>
            </Space>
          </Space>
        )}
      </Card>
    );
  }
}
