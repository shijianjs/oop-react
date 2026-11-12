import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {App} from '../../app/App';
import type {MessageKey} from '../../i18n/messages';

/** 任务跑完的结果：成功带值、失败带错误。要不要重试、要不要提示，是调用方的事。 */
export type TaskResult<T> = {ok: true; value: T} | {ok: false; error: unknown};

/**
 * 一次异步操作的公共外壳：开条 → 跑 → 出错统一提示 → 收条。
 *
 * 值得抄的是三个决定：
 *
 * - **数数，不是布尔。** 两个请求叠在一起时，先结束的那个不会把进度条关掉；
 * - **`catch` 只写这一处。** 调用方拿到 `{ok: false}` 就结束，不用每个按钮各写一遍 try；
 * - **`finally` 收条。** `return` 和 `throw` 都漏不掉，屏幕上不会留一条永远不动的进度。
 *
 * 进度是假的：真实进度拿不到，让它一直往 90 爬，收条时冲到 100 —— 用户要的只是「还在动」。
 */
@OopReactState
export class LoadingState {
  @OopReactIgnore readonly app: App;
  /** 正在跑的任务数。 */
  count = 0;
  /** 0–100 的假进度。 */
  progress = 0;
  /** 当前任务的文案，进度条上显示。 */
  labelKey: MessageKey | null = null;

  #progressTimer: ReturnType<typeof setInterval> | null = null;
  #finishTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(app: App) {
    this.app = app;
  }

  /** 有没有事在做 —— 含收条那 300ms，否则条会闪一下就消失。 */
  get active(): boolean {
    return this.count > 0 || this.progress > 0;
  }

  async run<T>(labelKey: MessageKey, task: () => Promise<T>): Promise<TaskResult<T>> {
    this.begin(labelKey);
    try {
      return {ok: true, value: await task()};
    } catch (error) {
      this.report(labelKey, error);
      return {ok: false, error};
    } finally {
      this.end();
    }
  }

  @OopReactRender()
  bar() {
    if (!this.active) return null;

    const {t} = this.app.settings;

    return (
      <div className="loading-row">
        <div
          className="loading-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(this.progress)}
        >
          <div className="loading-bar-fill" style={{width: `${this.progress}%`}} />
        </div>
        <span className="loading-bar-label">{t(this.labelKey ?? 'loading.busy')}</span>
      </div>
    );
  }

  private begin(labelKey: MessageKey): void {
    this.count += 1;
    this.labelKey = labelKey;

    // 已经在爬了：第二个任务只管加计数，不要让进度条回到起点。
    if (this.#progressTimer !== null) return;

    this.#clearFinish();
    this.progress = 8;
    this.#progressTimer = setInterval(() => {
      this.progress = Math.min(90, this.progress + (90 - this.progress) * 0.2 + 1);
    }, 160);
  }

  private end(): void {
    this.count = Math.max(0, this.count - 1);
    if (this.count > 0) return;

    this.#stopProgress();
    this.progress = 100;
    this.#clearFinish();
    this.#finishTimer = setTimeout(() => {
      this.progress = 0;
      this.labelKey = null;
      this.#finishTimer = null;
    }, 320);
  }

  private report(labelKey: MessageKey, error: unknown): void {
    const {t} = this.app.settings;
    const detail = error instanceof Error ? error.message : String(error);

    this.app.log.add(`${labelKey}.error = ${detail}`);
    this.app.feedback.error(t('loading.failed', {message: detail}));
  }

  #stopProgress(): void {
    if (this.#progressTimer === null) return;
    clearInterval(this.#progressTimer);
    this.#progressTimer = null;
  }

  #clearFinish(): void {
    if (this.#finishTimer === null) return;
    clearTimeout(this.#finishTimer);
    this.#finishTimer = null;
  }
}
