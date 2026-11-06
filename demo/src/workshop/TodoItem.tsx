import {Button} from 'antd';
import {OopReactObservable, OopReactRender} from 'oop-react';
import type {TodoBoard} from './TodoBoard';

/**
 * The deep end of the graph: an item knows the board that owns it, and through
 * it the workshop — so "toggle me" and "log this" need no callback, no context
 * and no ref, and a list row can write into a panel that lives three levels up.
 */
export class TodoItem {
  readonly title: string;
  readonly board: TodoBoard;
  done = false;

  constructor(title: string, board: TodoBoard) {
    this.title = title;
    this.board = board;
    // `title` never changes and `board` is a parent, not this object's state.
    OopReactObservable(this, {title: false, board: false});
  }

  get status(): string {
    return this.done ? '已完成' : '未完成';
  }

  toggle(): void {
    this.done = !this.done;
    this.board.workshop.log.add(`「${this.title}」→ ${this.status}`);
  }

  select(): void {
    this.board.workshop.select(this);
  }

  remove(): void {
    this.board.remove(this);
  }

  @OopReactRender({key: (self: TodoItem) => self.title})
  row() {
    return (
      <li className={this.done ? 'todo-row todo-row--done' : 'todo-row'}>
        <input type="checkbox" checked={this.done} onChange={this.toggle} aria-label={this.title} />
        <button type="button" className="todo-title" onClick={this.select}>
          {this.title}
        </button>
        <Button size="small" type="text" danger onClick={this.remove}>
          删除
        </Button>
      </li>
    );
  }
}
