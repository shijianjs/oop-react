import {Button} from 'antd';
import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {TodosPage} from './TodosPage';

/**
 * The deep end: an item holds the page that owns it and, through it, the whole
 * App — so it writes the shared log without a callback or a context.
 */
@OopReactState
export class TodoItem {
  @OopReactIgnore readonly title: string;
  @OopReactIgnore readonly page: TodosPage;
  done = false;

  constructor(title: string, page: TodosPage) {
    this.title = title;
    this.page = page;
  }

  toggle(): void {
    this.done = !this.done;
    this.page.app.log.add(`todos.item(${JSON.stringify(this.title)}).done = ${this.done}`);
  }

  select(): void {
    this.page.select(this);
    this.page.app.log.add(`todos.select(${JSON.stringify(this.title)})`);
  }

  remove(): void {
    this.page.remove(this);
  }

  @OopReactRender({key: 'title'})
  row() {
    return (
      <li className={this.done ? 'todo-row todo-row--done' : 'todo-row'}>
        <input type="checkbox" checked={this.done} onChange={this.toggle} aria-label={this.title} />
        <button type="button" className="todo-title" onClick={this.select}>
          {this.title}
        </button>
        <Button size="small" type="text" danger onClick={this.remove}>
          ✕
        </Button>
      </li>
    );
  }
}
