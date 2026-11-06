import {reaction} from 'mobx';
import {OopReactObservable} from 'oop-react';
import {MESSAGES, type Locale, type MessageKey} from '../i18n/messages';

export type Theme = 'light' | 'dark';

/**
 * Theme and language are state like any other, so they live on an object instead
 * of in a context or a hook. Everything that reads `t()` subscribes to `locale`;
 * everything that reads `theme` subscribes to it.
 *
 * The side effect that pushes them onto `<html>` is a `reaction` owned by this
 * object — created in the constructor, disposed with the object. Reactions do
 * not have to live at the application root; an object that owns a piece of state
 * can own the effect that follows it.
 */
export class Settings {
  theme: Theme = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  locale: Locale = 'zh';
  #dispose: (() => void) | null = null;

  constructor() {
    OopReactObservable(this);

    this.#dispose = reaction(
      () => [this.theme, this.locale] as const,
      ([theme, locale]) => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.lang = locale === 'zh' ? 'zh-Hans' : 'en';
      },
      {fireImmediately: true},
    );
  }

  dispose(): void {
    this.#dispose?.();
    this.#dispose = null;
  }

  toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
  }

  toggleLocale(): void {
    this.locale = this.locale === 'zh' ? 'en' : 'zh';
  }

  /** Reads `locale`, so a render method calling this re-renders on a switch. */
  t(key: MessageKey, values: Record<string, string | number> = {}): string {
    let message: string = MESSAGES[this.locale][key];
    for (const [name, value] of Object.entries(values)) {
      message = message.replace(`{${name}}`, String(value));
    }
    return message;
  }
}
