import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {ReactNode} from 'react';
import type {MessageKey} from '../../i18n/messages';
import type {Settings} from '../../app/Settings';

/** 轮廓的语义：只影响外框，不影响内容。 */
export type FrameTone = 'plain' | 'info' | 'success' | 'warning' | 'danger';

export const FRAME_TONES: readonly FrameTone[] = ['plain', 'info', 'success', 'warning', 'danger'];

export const FRAME_TONE_LABEL: Record<FrameTone, MessageKey> = {
  plain: 'frame.tone.plain',
  info: 'frame.tone.info',
  success: 'frame.tone.success',
  warning: 'frame.tone.warning',
  danger: 'frame.tone.danger',
};

/**
 * The only thing a wrapper asks of its content: it can render itself.
 *
 * This is what replaces `children`. In React the parent *builds* the nodes and
 * passes them down, so the wrapper's JSX is where "what goes inside" is decided.
 * Here the wrapper holds an object and calls `body.view()`, which produces a
 * whole island — the wrapper knows nothing about what is in there, and the
 * content's state stays with the content.
 */
export interface FrameContent {
  view(): ReactNode;
}

interface FrameOptions {
  /** Omitted → no header at all: the same class is then just an outlined div. */
  titleKey?: MessageKey;
  /** The line under the title. */
  captionKey?: MessageKey;
  tone?: FrameTone;
}

/**
 * A wrapper component as an object: it owns the outline, the tone and the
 * title bar; the inside is another object. `div` / `Card` in React terms —
 * `titleKey` is what decides which of the two you get.
 *
 * Both halves are islands, so they move independently: changing `tone` or
 * `collapsed` re-renders this shell and *skips* the body island (its arguments
 * did not change), while a field changing inside the body re-renders only the
 * body.
 */
@OopReactState
export class Frame implements FrameContent {
  /** Semantic outline: a field on the wrapper, so changing it re-renders the wrapper alone. */
  tone: FrameTone;
  collapsed = false;
  /** Not readonly: swapping the whole content is one assignment, no new frame class. */
  body: FrameContent;
  @OopReactIgnore readonly settings: Settings;
  @OopReactIgnore readonly titleKey: MessageKey | undefined;
  @OopReactIgnore readonly captionKey: MessageKey | undefined;

  constructor(settings: Settings, body: FrameContent, options: FrameOptions = {}) {
    this.settings = settings;
    this.body = body;
    this.titleKey = options.titleKey;
    this.captionKey = options.captionKey;
    this.tone = options.tone ?? 'plain';
  }

  setTone(tone: FrameTone): void {
    this.tone = tone;
  }

  setBody(body: FrameContent): void {
    this.body = body;
    this.collapsed = false;
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
  }

  @OopReactRender()
  view() {
    const {t} = this.settings;
    const title = this.titleKey === undefined ? undefined : t(this.titleKey);

    return (
      <section className={`frame frame--${this.tone}`}>
        {title === undefined ? null : (
          <header className="frame-head">
            <div>
              <h3 className="frame-title">{title}</h3>
              {this.captionKey === undefined ? null : (
                <p className="frame-caption muted">{t(this.captionKey)}</p>
              )}
            </div>
            <button
              type="button"
              className="frame-toggle"
              aria-expanded={!this.collapsed}
              onClick={this.toggle}
            >
              {t(this.collapsed ? 'frame.expand' : 'frame.collapse')}
            </button>
          </header>
        )}
        {/* 一个调用就是一个岛：外框重渲染时参数没变，内容岛会被跳过。 */}
        {this.collapsed ? null : <div className="frame-body">{this.body.view()}</div>}
      </section>
    );
  }
}
