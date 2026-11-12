import type {ReactNode} from 'react';

/**
 * Anything that knows its current value and the error of the last fetch.
 * `OopReactResource` is one; so is any object with these two fields.
 */
export interface OopReactAsyncState<T> {
  readonly data: T | null;
  readonly error: unknown;
}

export interface OopReactAsyncViewOptions {
  /** Shown while there is no data: the first load, or nothing fetched yet. */
  skeleton: ReactNode;
  /** Shown once there is data. */
  ready: ReactNode;
  /**
   * Shown when the last attempt failed. Without data it is the whole content;
   * with data it is rendered above it, like a "this refresh failed" banner.
   * Omitted means failures are not shown here — a toast may already have said it.
   */
  failed?: (error: unknown) => ReactNode;
}

/**
 * The three screens of delayed data in one call: skeleton / content / failure.
 *
 * ```tsx
 * @OopReactRender()
 * view() {
 *   return OopReactAsyncView(this.rows, {
 *     skeleton: <Skeleton active />,
 *     ready: this.table(),
 *     failed: (error) => <Alert type="error" title={String(error)} />,
 *   });
 * }
 * ```
 *
 * It is a plain function, not a component: called inside a render method, the
 * `data` / `error` reads belong to *that island*, so nothing needs an extra
 * observer — which is what lets it fill anywhere only one node fits (a dialog's
 * children, a table cell render, the return value of a render prop).
 *
 * Stale data is not thrown away on failure: the value stays on screen and the
 * error shows above it. Clearing is `invalidate()`'s job.
 */
export function OopReactAsyncView<T>(
  resource: OopReactAsyncState<T>,
  options: OopReactAsyncViewOptions,
): ReactNode {
  const failed = resource.error === null ? null : options.failed?.(resource.error);

  if (resource.data !== null) {
    if (failed === null) return options.ready;
    return (
      <>
        {failed}
        {options.ready}
      </>
    );
  }

  // No data: a failure shows only the failure — without a renderer nothing is
  // shown at all, rather than pretending it is still loading.
  return resource.error === null ? options.skeleton : failed;
}
