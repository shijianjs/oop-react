import {Button, Menu, Space} from 'antd';
import {OopReactObservable, OopReactRender} from 'oop-react';
import {ActivityLog} from '../log/ActivityLog';
import {CounterPage} from '../pages/counter/CounterPage';
import {FailurePage} from '../pages/failure/FailurePage';
import {InvitePage} from '../pages/invite/InvitePage';
import {OrdersPage} from '../pages/orders/OrdersPage';
import {OverviewPage} from '../pages/overview/OverviewPage';
import type {Page} from '../pages/Page';
import {TodosPage} from '../pages/todos/TodosPage';
import {Router} from '../routing/Router';
import {Feedback} from './Feedback';
import {DOCS_HREF} from './links';
import {Settings} from './Settings';

/**
 * The root of the graph: settings, the router, one shared log, and five pages.
 *
 * It also owns the layout, and the layout is split into islands so that switching
 * a page does not re-render the header, and writing to the log does not re-render
 * the menu.
 */
export class App {
  readonly settings: Settings;
  readonly log: ActivityLog;
  readonly feedback: Feedback;
  readonly router: Router;
  readonly pages: Page[];

  constructor() {
    this.settings = new Settings();
    this.log = new ActivityLog(this);
    this.feedback = new Feedback();
    this.pages = [
      new OverviewPage(this),
      new CounterPage(this),
      new TodosPage(this),
      new OrdersPage(this),
      new InvitePage(this),
      new FailurePage(this),
    ];
    this.router = new Router(this.pages);

    // Everything above is a collaborator this object holds, not state it owns.
    OopReactObservable(this, {
      settings: false,
      log: false,
      feedback: false,
      router: false,
      pages: false,
    });
  }

  @OopReactRender()
  view() {
    return (
      <div className="app">
        {this.header()}
        <div className="app-body">
          {this.sidebar()}
          {this.content()}
        </div>
      </div>
    );
  }

  @OopReactRender()
  header() {
    const {settings} = this;

    return (
      <header className="app-header">
        <div className="app-brand">
          <strong>oop-react</strong>
          <span className="muted">{settings.t('app.tagline')}</span>
        </div>
        <Space>
          <Button size="small" href={DOCS_HREF}>
            {settings.t('nav.docs')}
          </Button>
          <Button size="small" onClick={settings.toggleLocale}>
            {settings.locale === 'zh' ? 'EN' : '中文'}
          </Button>
          <Button size="small" onClick={settings.toggleTheme}>
            {settings.t(settings.theme === 'dark' ? 'nav.theme.toLight' : 'nav.theme.toDark')}
          </Button>
        </Space>
      </header>
    );
  }

  @OopReactRender()
  sidebar() {
    const {router, settings} = this;

    return (
      <aside className="app-sidebar">
        <Menu
          mode="inline"
          className="app-menu"
          selectedKeys={[router.current.path]}
          onClick={({key}) => router.go(router.byPath(key))}
          items={router.pages.map((page) => ({key: page.path, label: settings.t(page.titleKey)}))}
        />
        {this.log.view()}
      </aside>
    );
  }

  /** Reads `router.current` only, so a page switch re-renders this island alone. */
  @OopReactRender()
  content() {
    return <main className="app-content">{this.router.current.view()}</main>;
  }
}
