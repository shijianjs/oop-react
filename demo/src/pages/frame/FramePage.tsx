import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {MessageKey} from '../../i18n/messages';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';
import {Checklist, Prose, Tally} from './contents';
import {FRAME_TONES, FRAME_TONE_LABEL, Frame, type FrameContent, type FrameTone} from './Frame';

type SlotKey = 'prose' | 'tally' | 'checklist';

const SLOT_KEYS: readonly SlotKey[] = ['prose', 'tally', 'checklist'];

const SLOT_LABEL: Record<SlotKey, MessageKey> = {
  prose: 'frame.slot.prose',
  tally: 'frame.slot.tally',
  checklist: 'frame.slot.checklist',
};

/**
 * Wrapper components: an outline with semantics on the outside, anything at all
 * on the inside.
 *
 * Every frame on this page is the same class. What differs is the `body` object
 * and the `tone` field — the two things a wrapper is made of. The page only
 * wires them together; it never writes "this frame contains a counter" in JSX.
 */
@OopReactState
export class FramePage implements Page {
  readonly path = 'frame';
  readonly titleKey = 'route.frame';
  readonly sourcePath = 'demo/src/pages/frame/FramePage.tsx';
  @OopReactIgnore readonly app: App;

  @OopReactIgnore readonly toneFrame: Frame;
  @OopReactIgnore readonly slotFrame: Frame;
  @OopReactIgnore readonly outerFrame: Frame;
  /** The three bodies the slot frame can hold — same frame instance all along. */
  @OopReactIgnore readonly contents: Record<SlotKey, FrameContent>;
  /** Which body is in the slot right now; only the buttons read it. */
  slot: SlotKey = 'prose';

  constructor(app: App) {
    this.app = app;
    const {settings} = app;

    this.contents = {
      prose: new Prose(settings, 'frame.slot.body'),
      tally: new Tally(app),
      checklist: new Checklist(app),
    };

    this.toneFrame = new Frame(settings, new Prose(settings, 'frame.tone.body'), {
      titleKey: 'frame.tone.title',
      captionKey: 'frame.tone.caption',
    });

    this.slotFrame = new Frame(settings, this.contents.prose, {
      titleKey: 'frame.slot.title',
      captionKey: 'frame.slot.caption',
    });

    // A frame inside a frame inside a frame. The innermost one has no title, so
    // it is the plain "div" half of the same class.
    const bare = new Frame(settings, new Tally(app), {tone: 'warning'});
    const inner = new Frame(settings, bare, {
      titleKey: 'frame.nest.inner',
      captionKey: 'frame.nest.innerCaption',
      tone: 'success',
    });
    this.outerFrame = new Frame(settings, inner, {
      titleKey: 'frame.nest.title',
      captionKey: 'frame.nest.caption',
      tone: 'info',
    });
  }

  setTone(tone: FrameTone): void {
    this.toneFrame.setTone(tone);
    this.app.log.add(`frame.tone = ${tone}`);
  }

  setSlot(slot: SlotKey): void {
    this.slot = slot;
    this.slotFrame.setBody(this.contents[slot]);
    this.app.log.add(`frame.body = ${slot}`);
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <div>
        <PageHeader
          title={t('frame.title')}
          description={t('frame.description')}
          sourceLabel={t('nav.source')}
          sourceUrl={sourceUrl(this.sourcePath)}
        />
        <div className="frame-page">
          <div className="frame-stack">
            {this.tonePicker()}
            {this.toneFrame.view()}
          </div>
          <div className="frame-stack">
            {this.slotPicker()}
            {this.slotFrame.view()}
          </div>
          <div className="frame-stack frame-stack--full">{this.outerFrame.view()}</div>
        </div>
      </div>
    );
  }

  /** Reads only `toneFrame.tone`, so a tone change re-renders this row and nothing else. */
  @OopReactRender()
  tonePicker() {
    const {t} = this.app.settings;

    return (
      <div className="frame-toolbar">
        {FRAME_TONES.map((tone) => (
          <button
            key={tone}
            type="button"
            className="frame-chip"
            data-tone={tone}
            data-active={this.toneFrame.tone === tone}
            aria-pressed={this.toneFrame.tone === tone}
            onClick={() => this.setTone(tone)}
          >
            {t(FRAME_TONE_LABEL[tone])}
          </button>
        ))}
      </div>
    );
  }

  @OopReactRender()
  slotPicker() {
    const {t} = this.app.settings;

    return (
      <div className="frame-toolbar">
        {SLOT_KEYS.map((slot) => (
          <button
            key={slot}
            type="button"
            className="frame-chip"
            data-active={this.slot === slot}
            aria-pressed={this.slot === slot}
            onClick={() => this.setSlot(slot)}
          >
            {t(SLOT_LABEL[slot])}
          </button>
        ))}
      </div>
    );
  }
}
