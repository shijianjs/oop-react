import {OopReactIgnore} from '../reactivity/ignore';
import {OopReactState} from '../reactivity/OopReactState';
import {OopReactLoading, type OopReactTaskOptions, type OopReactTaskResult} from './OopReactLoading';

/**
 * 一份远程数据：`data` / `loading` / `error`，加上把它取回来的 `load`。
 *
 * ```ts
 * class OrdersPage {
 *   readonly orders = new OopReactResource<Order[]>();
 *   async open(): Promise<void> {
 *     await this.orders.load(() => api.orders());
 *   }
 * }
 * ```
 *
 * 没有缓存、没有去重、没有 stale-while-revalidate —— 那一层策略一进来就得跟着框架走。
 * 这里只回答「这份数据现在是什么」；要重新取，就再调一次 `load` 把同一个 fetcher 传进来。
 */
@OopReactState
export class OopReactResource<T> {
  @OopReactIgnore readonly loading = new OopReactLoading();
  data: T | null = null;
  error: unknown = null;

  async load(
    fetcher: () => Promise<T>,
    options?: OopReactTaskOptions,
  ): Promise<OopReactTaskResult<T>> {
    const result = await this.loading.run(fetcher, options);
    this.apply(result);
    return result;
  }

  /** 清空数据，让读它的地方回到「还没有」。 */
  invalidate(): void {
    this.data = null;
    this.error = null;
  }

  /** `await` 之后的几次写入收在一个方法里，仍然只通知一次。 */
  private apply(result: OopReactTaskResult<T>): void {
    if (result.ok) {
      this.data = result.value;
      this.error = null;
      return;
    }

    this.error = result.error;
  }
}
