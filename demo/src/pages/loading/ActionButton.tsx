import {Button} from 'antd';
import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {App} from '../../app/App';
import type {MessageKey} from '../../i18n/messages';
import {LoadingState} from './LoadingState';

interface ActionButtonOptions {
  labelKey: MessageKey;
  /** 点下去要跑的 —— 页面自己的方法，成功提示也写在那个方法里。 */
  task: () => Promise<void>;
  /** > 0 时给这次操作一个上限，超时按失败处理。 */
  timeoutMs?: number;
  primary?: boolean;
  danger?: boolean;
}

/**
 * 按钮也是对象：它持有一个自己的 `LoadingState` 和一个要跑的方法。
 *
 * 三件「顺手」都是按钮自己的事，跟别的按钮无关：转圈和不可点是 antd `loading`，
 * 失败弹一条提示，顶上的全局进度条由 `app.progress` 管。
 */
@OopReactState
export class ActionButton {
  @OopReactIgnore readonly app: App;
  /** 一个按钮一个：旁边那个在转，这个照样能点。 */
  @OopReactIgnore readonly state: LoadingState;
  @OopReactIgnore readonly labelKey: MessageKey;
  @OopReactIgnore readonly task: () => Promise<void>;
  @OopReactIgnore readonly timeoutMs: number;
  @OopReactIgnore readonly primary: boolean;
  @OopReactIgnore readonly danger: boolean;

  constructor(app: App, options: ActionButtonOptions) {
    this.app = app;
    this.state = new LoadingState();
    this.labelKey = options.labelKey;
    this.task = options.task;
    this.timeoutMs = options.timeoutMs ?? 0;
    this.primary = options.primary ?? false;
    this.danger = options.danger ?? false;
  }

  async click(): Promise<void> {
    const {progress, settings, feedback, log} = this.app;
    progress.start();
    try {
      const result = await this.state.run(this.task, this.timeoutMs);
      if (result.ok) return;

      const detail = result.error instanceof Error ? result.error.message : String(result.error);
      feedback.error(
        result.timedOut
          ? settings.t('loading.timeout', {ms: this.timeoutMs})
          : settings.t('loading.failed', {message: detail}),
      );
      log.add(`${this.labelKey}.error = ${detail}`);
    } finally {
      progress.finish();
    }
  }

  // 列表里是对象自己渲染自己，key 只能写在注解上。
  @OopReactRender({key: (self: ActionButton) => self.labelKey})
  view() {
    const {t} = this.app.settings;

    return (
      <Button
        type={this.primary ? 'primary' : 'default'}
        danger={this.danger}
        loading={this.state.loading}
        onClick={() => void this.click()}
      >
        {t(this.labelKey)}
      </Button>
    );
  }
}
