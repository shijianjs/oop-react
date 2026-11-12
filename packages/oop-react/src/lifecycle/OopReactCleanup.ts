/**
 * 一个对象攒下来的清理动作：`reaction`、timer、DOM 监听、第三方实例。
 *
 * ```ts
 * class Settings {
 *   readonly cleanup = new OopReactCleanup();
 *
 *   constructor() {
 *     this.cleanup.add(reaction(() => this.theme, (theme) => apply(theme)));
 *     this.cleanup.add(() => window.removeEventListener('hashchange', this.sync));
 *   }
 *
 *   dispose(): void {
 *     this.cleanup.dispose();
 *   }
 * }
 * ```
 *
 * 普通类，没有状态、不参与渲染，所以不需要 `@OopReactState`。
 */
export class OopReactCleanup {
  #disposers = new Set<() => void>();
  #disposed = false;

  get size(): number {
    return this.#disposers.size;
  }

  get disposed(): boolean {
    return this.#disposed;
  }

  /**
   * 登记一个清理动作，返回「撤销登记」的函数。
   * 在已经 `dispose()` 过的对象上再登记，会立刻执行 —— 漏清理比晚清理难查。
   */
  add(disposer: () => void): () => void {
    if (this.#disposed) {
      disposer();
      return () => {};
    }

    this.#disposers.add(disposer);
    return () => {
      this.#disposers.delete(disposer);
    };
  }

  /**
   * 依次执行并清空。重复调用没有副作用。
   * 一个清理动作抛错不影响其余的：能清理多少算多少，这是收尾，不是事务。
   */
  dispose(): void {
    if (this.#disposed) return;

    this.#disposed = true;
    const disposers = [...this.#disposers];
    this.#disposers.clear();

    for (const disposer of disposers) {
      try {
        disposer();
      } catch {
        // 收尾阶段吞掉：剩下的清理动作比这一个的错误重要。
      }
    }
  }
}
