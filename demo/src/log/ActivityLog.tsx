import {Card} from 'antd';
import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {App} from '../app/App';

/**
 * One log, written by every page — and read by a panel that lives in the layout,
 * not inside any of them. Entries are written as traces (`todos.item("x").done = true`)
 * rather than sentences, so the panel shows *who called whom*.
 */
@OopReactState
export class ActivityLog {
  entries: string[] = [];
  @OopReactIgnore readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  add(entry: string): void {
    this.entries.unshift(entry);
    if (this.entries.length > 12) {
      this.entries.length = 12;
    }
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <Card size="small" title={t('log.title')} className="log-card">
        {this.entries.length === 0 ? (
          <span className="muted">{t('log.empty')}</span>
        ) : (
          <ol className="log-list">
            {this.entries.map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ol>
        )}
      </Card>
    );
  }
}
