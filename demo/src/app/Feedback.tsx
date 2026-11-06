import {App as AntApp} from 'antd';
import type {MessageInstance} from 'antd/es/message/interface';
import {useEffect} from 'react';

/**
 * antd's `message` only exists inside a component: `App.useApp()` reads the very
 * context that gives it the current theme and locale. An object method cannot
 * call a hook, so the value is captured once by a tiny bridge component and then
 * lives on this object — from that point any method can call it.
 *
 * This is the general shape for every context-bound hook an object needs:
 * mount a component that calls the hook, and hand the value to the object in an
 * effect (never during render).
 */
export class Feedback {
  #message: MessageInstance | null = null;

  bind(message: MessageInstance): void {
    this.#message = message;
  }

  success(text: string): void {
    void this.#message?.success(text);
  }

  error(text: string): void {
    void this.#message?.error(text);
  }
}

export function FeedbackBridge({feedback}: {feedback: Feedback}) {
  const {message} = AntApp.useApp();

  useEffect(() => {
    feedback.bind(message);
  }, [feedback, message]);

  return null;
}
