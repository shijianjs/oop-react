import {OopReactState} from 'oop-react';

/** 任务跑完的结果：成功带值，失败带错误，以及是不是超时（提示文案不一样）。 */
export type TaskResult<T> =
  | {ok: true; value: T}
  | {ok: false; error: unknown; timedOut: boolean};

class TimeoutError extends Error {}

/**
 * 一次异步操作的状态：**一个按钮一个，互不干扰**。
 *
 * `loading` 就一个布尔 —— UI 那边不用自己画遮罩、也不用记「禁用前是什么样式」：
 * antd 的 `Button` 自带 `loading`（转圈 + 不吃点击），把值塞进去就够了。
 *
 * 顺手收进来的三件事，都是每次写异步按钮都要重抄的：
 * `catch` 不让调用方写、`finally` 一定复位、超时可以直接给一个上限。
 */
@OopReactState
export class LoadingState {
  loading = false;

  async run<T>(task: () => Promise<T>, timeoutMs = 0): Promise<TaskResult<T>> {
    this.loading = true;
    try {
      const value = timeoutMs > 0 ? await withTimeout(task(), timeoutMs) : await task();
      return {ok: true, value};
    } catch (error) {
      return {ok: false, error, timedOut: error instanceof TimeoutError};
    } finally {
      this.loading = false;
    }
  }
}

/** 到点就 reject。任务本身停不下来 —— 真要取消得把 AbortSignal 传进 fetch。 */
function withTimeout<T>(task: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(`timeout after ${ms}ms`)), ms);
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
