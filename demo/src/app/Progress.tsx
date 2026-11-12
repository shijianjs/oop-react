import {OopReactRender, OopReactState} from 'oop-react';

/**
 * The NProgress-style bar at the very top of the window.
 *
 * Deliberately loose: `start` / `finish` do not count, so two overlapping requests
 * end the bar when the first one finishes. It is a "something is happening"
 * signal, not a scheduler — the strict version lives on each button, where the
 * count actually matters. Nothing here knows about any of the pages.
 */
@OopReactState
export class Progress {
  active = false;
  percent = 0;

  #tick: ReturnType<typeof setInterval> | null = null;
  #hide: ReturnType<typeof setTimeout> | null = null;

  start(): void {
    // 上一次的收尾还没落地：取消它，接着走。
    if (this.#hide !== null) {
      clearTimeout(this.#hide);
      this.#hide = null;
    }
    if (this.#tick !== null) return;

    this.active = true;
    this.percent = 10;
    this.#tick = setInterval(() => {
      this.percent = Math.min(92, this.percent + (92 - this.percent) * 0.18 + 1);
    }, 180);
  }

  finish(): void {
    if (this.#tick === null) return;

    clearInterval(this.#tick);
    this.#tick = null;
    this.percent = 100;
    this.#hide = setTimeout(() => {
      this.active = false;
      this.percent = 0;
      this.#hide = null;
    }, 320);
  }

  @OopReactRender()
  bar() {
    if (!this.active) return null;

    return (
      <div className="nprogress" aria-hidden="true">
        <div className="nprogress-fill" style={{width: `${this.percent}%`}} />
      </div>
    );
  }
}
