import type {OopReactResource} from 'oop-react';
import type {ReactNode} from 'react';

interface AsyncViewOptions {
  /** 还没有数据时画什么：首次加载，或者根本还没开始取。 */
  skeleton: ReactNode;
  /** 有数据时画什么。 */
  ready: ReactNode;
  /**
   * 失败时画什么。没有旧数据时它就是整块内容；有旧数据时它显示在数据上面，
   * 像一条「这次刷新失败」的横幅。不传就当失败不显示 —— 适合失败已经由 toast 说过的场合。
   */
  failed?: (error: unknown) => ReactNode;
}

/**
 * 「加载 → 骨架屏 / 数据 / 失败」这一套，写一次。
 *
 * 它是普通函数而不是组件：在渲染方法里调用时，读到的 `data` / `error` 记在**那个岛**上，
 * 不需要再包一层 observer。所以它能放进任何「只留给一个 node」的位置 ——
 * 弹窗的 children、表格的 `render`、回调组件的返回值。
 *
 * 有旧数据时失败不清屏：数据照旧显示，错误报在上面。清空是 `invalidate()` 的事。
 */
export function asyncView<T>(resource: OopReactResource<T>, options: AsyncViewOptions): ReactNode {
  const banner = resource.error === null ? null : options.failed?.(resource.error);

  if (resource.data !== null) {
    if (banner === null) return options.ready;
    return (
      <>
        {banner}
        {options.ready}
      </>
    );
  }

  return banner ?? options.skeleton;
}
