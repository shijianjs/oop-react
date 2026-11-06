import {OopReactObservable} from 'oop-react';
import {MESSAGES, type Locale, type MessageKey} from '../i18n/messages';

export type Theme = 'light' | 'dark';

/**
 * Theme and language are state like any other, so they live on an object instead
 * of in a context or a hook. Everything that reads `t()` subscribes to `locale`;
 * everything that reads `theme` subscribes to it.
 */
export class Settings {
  theme: Theme = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  locale: Locale = 'zh';

  constructor() {
    OopReactObservable(this);
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
