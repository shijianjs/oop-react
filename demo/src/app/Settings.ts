import {OopReactState} from 'oop-react';
import {MESSAGES, type Locale, type MessageKey} from '../i18n/messages';

export type Theme = 'light' | 'dark';

/**
 * Theme and language are state like any other, so they live on an object instead
 * of in a context or a hook. Everything that reads `t()` subscribes to `locale`;
 * everything that reads `theme` subscribes to it.
 *
 * The `<html>` attributes are written by the setters, not by a `reaction`: the
 * effect happens exactly where the state changes, which is both shorter and the
 * conventional object-oriented shape. `init()` covers the one case a setter cannot
 * — the value the object starts with.
 */
@OopReactState
export class Settings {
  theme: Theme = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  locale: Locale = 'zh';

  init(): void {
    this.apply();
  }

  toggleTheme(): void {
    this.setTheme(this.theme === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    this.apply();
  }

  toggleLocale(): void {
    this.setLocale(this.locale === 'zh' ? 'en' : 'zh');
  }

  setLocale(locale: Locale): void {
    this.locale = locale;
    this.apply();
  }

  /** Reads `locale`, so a render method calling this re-renders on a switch. */
  t(key: MessageKey, values: Record<string, string | number> = {}): string {
    let message: string = MESSAGES[this.locale][key];
    for (const [name, value] of Object.entries(values)) {
      message = message.replace(`{${name}}`, String(value));
    }
    return message;
  }

  private apply(): void {
    document.documentElement.dataset.theme = this.theme;
    document.documentElement.lang = this.locale === 'zh' ? 'zh-Hans' : 'en';
  }
}
