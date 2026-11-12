import {OopReactState} from '../reactivity/OopReactState';

/**
 * 一组 id 的「选中了哪些」。
 *
 * ```ts
 * class OrdersPage {
 *   readonly selection = new OopReactSelection<number>();
 *
 *   @OopReactRender()
 *   table() {
 *     return (
 *       <Table
 *         rowSelection={{
 *           selectedRowKeys: this.selection.ids,
 *           onChange: (keys) => this.selection.set(keys as number[]),
 *         }}
 *       />
 *     );
 *   }
 * }
 * ```
 *
 * 只存「选了什么」，不碰行数据：要判断哪些行选中了，行自己问 `selection.has(row.id)`。
 * 用数组而不是 Set，因为一页几十行，按 id 比较比哈希更省事，也更好在 DevTools 里看。
 */
@OopReactState
export class OopReactSelection<K = string> {
  ids: K[] = [];

  get size(): number {
    return this.ids.length;
  }

  get empty(): boolean {
    return this.ids.length === 0;
  }

  has(id: K): boolean {
    return this.ids.includes(id);
  }

  add(id: K): void {
    if (this.ids.includes(id)) return;
    this.ids.push(id);
  }

  remove(id: K): void {
    this.ids = this.ids.filter((candidate) => candidate !== id);
  }

  toggle(id: K): void {
    if (this.has(id)) {
      this.remove(id);
      return;
    }

    this.add(id);
  }

  /** 整批替换（表格的 `onChange` 直接把它交进来）。 */
  set(ids: readonly K[]): void {
    this.ids = [...new Set(ids)];
  }

  clear(): void {
    this.ids = [];
  }

  /** 全选：`total` 是这一批的总条数。空集合不算全选。 */
  isAll(total: number): boolean {
    return total > 0 && this.ids.length >= total;
  }

  /** 半选：选了一些，但没选完 —— 复选框该画成横杠的那种状态。 */
  isPartial(total: number): boolean {
    return this.ids.length > 0 && this.ids.length < total;
  }
}
