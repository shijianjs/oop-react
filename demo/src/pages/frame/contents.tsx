import {Button, Space} from 'antd';
import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {App} from '../../app/App';
import {bumpRender} from '../../app/renderStats';
import type {MessageKey} from '../../i18n/messages';
import type {Settings} from '../../app/Settings';
import type {FrameContent} from './Frame';

/**
 * Three contents with nothing in common — a paragraph, a counter, a checklist —
 * all usable in the same `Frame`, because the only thing the frame requires is
 * `view()`. Each of them owns its own state, so the frame never sees it.
 */

@OopReactState
export class Prose implements FrameContent {
  @OopReactIgnore readonly settings: Settings;
  @OopReactIgnore readonly textKey: MessageKey;

  constructor(settings: Settings, textKey: MessageKey) {
    this.settings = settings;
    this.textKey = textKey;
  }

  @OopReactRender()
  view() {
    const {t} = this.settings;
    const renders = bumpRender(`frame.prose.${this.textKey}`);

    return (
      <div className="frame-prose">
        <p>{t(this.textKey)}</p>
        <span className="render-count">renders: {renders}</span>
      </div>
    );
  }
}

@OopReactState
export class Tally implements FrameContent {
  @OopReactIgnore readonly app: App;
  count = 0;

  constructor(app: App) {
    this.app = app;
  }

  increment(): void {
    this.count += 1;
    this.app.log.add(`frame.tally = ${this.count}`);
  }

  decrement(): void {
    this.count -= 1;
    this.app.log.add(`frame.tally = ${this.count}`);
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <div className="frame-tally">
        <strong className="frame-tally-count">{this.count}</strong>
        <Space size="small">
          <Button size="small" onClick={this.decrement}>
            -1
          </Button>
          <Button size="small" type="primary" onClick={this.increment}>
            +1
          </Button>
        </Space>
        <p className="frame-hint muted">{t('frame.tally.hint')}</p>
      </div>
    );
  }
}

interface Task {
  readonly labelKey: MessageKey;
  done: boolean;
}

@OopReactState
export class Checklist implements FrameContent {
  @OopReactIgnore readonly app: App;
  items: Task[] = [
    {labelKey: 'frame.list.item1', done: true},
    {labelKey: 'frame.list.item2', done: false},
    {labelKey: 'frame.list.item3', done: false},
  ];

  constructor(app: App) {
    this.app = app;
  }

  toggle(labelKey: MessageKey): void {
    const item = this.items.find((candidate) => candidate.labelKey === labelKey);
    if (item === undefined) return;
    item.done = !item.done;
    this.app.log.add(`frame.checklist(${labelKey}).done = ${item.done}`);
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <ul className="frame-tasks">
        {this.items.map((item) => (
          <li key={item.labelKey} className={item.done ? 'frame-task frame-task--done' : 'frame-task'}>
            <label>
              <input type="checkbox" checked={item.done} onChange={() => this.toggle(item.labelKey)} />
              {t(item.labelKey)}
            </label>
          </li>
        ))}
      </ul>
    );
  }
}
