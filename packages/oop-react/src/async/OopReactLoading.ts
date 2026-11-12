import {OopReactState} from '../reactivity/OopReactState';

/** 一次异步任务的结果：成功带值，失败带错误，以及是不是超时（提示文案通常不一样）。 */
export type OopReactTaskResult<T> =
  | {ok: true; value: T}
  | {ok: false; error: unknown; timedOut: boolean};

export interface OopReactTaskOptions {
  /** > 0 时给这次任务一个上限，到点按超时返回。任务本身不会被中断。 */
  timeoutMs?: number;
}

/** `timeoutMs` 到点时 `run` 给出的错误。`result.timedOut` 和 `instanceof` 都能认出来。 */
export class OopReactTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Timed out after ${timeoutMs}ms`);
    this.name = 'OopReactTimeoutError';
  }
}

/**
 * 一次异步操作的状态：一个对象一个（通常就是一个按钮、一次提交），彼此无关。
 *
 * ```ts
 * class SaveButton {
 *   readonly loading = new OopReactLoading();
 *
 *   async click(): Promise<void> {
 *     const result = await this.loading.run(() => api.save(order), {timeoutMs: 5000});
 *     if (!result.ok) this.page.feedback.error(...);
 *   }
 *
 *   @OopReactRender()
 *   view() {
 *     return <Button loading={this.loading.loading} onClick={() => void this.click()}>保存</Button>;
 *   }
 * }
 * ```
 *
 * 它只管三件事：跑之前把 `loading` 置起来、跑完一定放下、出错和超时转成返回值。
 * **不弹提示、不记日志、不画进度条** —— 那些是持有它的对象的事。
 *
 * 内部按次数记账，所以同一个对象上重叠两次 `run` 时，先结束的那个不会把 `loading` 关掉。
 */
@OopReactState
export class OopReactLoading {
  loading = false;
  #count = 0;

  async run<T>(
    task: () => Promise<T>,
    options: OopReactTaskOptions = {},
  ): Promise<OopReactTaskResult<T>> {
    this.#count += 1;
    this.loading = true;

    try {
      const timeoutMs = options.timeoutMs ?? 0;
      const value = timeoutMs > 0 ? await withTimeout(task(), timeoutMs) : await task();
      return {ok: true, value};
    } catch (error) {
      return {ok: false, error, timedOut: error instanceof OopReactTimeoutError};
    } finally {
      this.#count -= 1;
      if (this.#count === 0) this.loading = false;
    }
  }
}

/** 到点就 reject。任务停不下来 —— 真要取消，得把 AbortSignal 传进 fetch。 */
function withTimeout<T>(task: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new OopReactTimeoutError(timeoutMs)), timeoutMs);
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
