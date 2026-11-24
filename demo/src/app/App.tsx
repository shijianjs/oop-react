import {App as AntApp, Button, ConfigProvider, Menu, Space, theme} from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import {ActivityLog} from '../log/ActivityLog';
import {AnimationPage} from '../pages/animation/AnimationPage';
import {ChartPage} from '../pages/chart/ChartPage';
import {CounterPage} from '../pages/counter/CounterPage';
import {FailurePage} from '../pages/failure/FailurePage';
import {FramePage} from '../pages/frame/FramePage';
import {InvitePage} from '../pages/invite/InvitePage';
import {LoadingPage} from '../pages/loading/LoadingPage';
import {OrdersPage} from '../pages/orders/OrdersPage';
import {OverviewPage} from '../pages/overview/OverviewPage';
import {TicTacToePage} from '../pages/tictactoe/TicTacToePage';
import {TodosPage} from '../pages/todos/TodosPage';
import type {Route} from '../routing/Route';
import {Router} from '../routing/Router';
import {Feedback, FeedbackHost} from './Feedback';
import {DOCS_HREF} from './links';
import {Progress} from './Progress';
import {Settings} from './Settings';

/**
 * The root of the graph: settings, the router, one shared log, and the route
 * table.
 *
 * The table is metadata plus a factory per entry; the router builds a page only
 * when its route is entered. That is what keeps a long menu from instantiating
 * every page — and every page's state — up front.
 *
 * It also owns the whole page — the providers, the layout, and the islands the
 * layout is split into, so that switching a page does not re-render the header
 * and writing to the log does not re-render the menu.
 */
@OopReactState
export class App {
  @OopReactIgnore readonly settings: Settings;
  @OopReactIgnore readonly log: ActivityLog;
  @OopReactIgnore readonly feedback: Feedback;
  @OopReactIgnore readonly progress: Progress;
  @OopReactIgnore readonly routes: readonly Route[];
  @OopReactIgnore readonly router: Router;

  constructor() {
    this.settings = new Settings();
    this.log = new ActivityLog(this);
    this.feedback = new Feedback();
    this.progress = new Progress();
    this.routes = [
      {path: 'overview', titleKey: 'route.overview', create: () => new OverviewPage(this)},
      {path: 'counter', titleKey: 'route.counter', create: () => new CounterPage(this)},
      {path: 'todos', titleKey: 'route.todos', create: () => new TodosPage(this)},
      {path: 'orders', titleKey: 'route.orders', create: () => new OrdersPage(this)},
      {path: 'frame', titleKey: 'route.frame', create: () => new FramePage(this)},
      {path: 'loading', titleKey: 'route.loading', create: () => new LoadingPage(this)},
      {path: 'tictactoe', titleKey: 'route.tictactoe', create: () => new TicTacToePage(this)},
      {path: 'chart', titleKey: 'route.chart', create: () => new ChartPage(this)},
      {path: 'animation', titleKey: 'route.animation', create: () => new AnimationPage(this)},
      {path: 'invite', titleKey: 'route.invite', create: () => new InvitePage(this)},
      {path: 'failure', titleKey: 'route.failure', create: () => new FailurePage(this)},
    ];
    this.router = new Router(this.routes);
  }

  /**
   * What the whole application is mounted from.
   *
   * antd's theme and locale have to wrap the tree and follow `settings`, which is
   * exactly what a render method does; `<AntApp>` is here because `App.useApp()`
   * is what makes `message` theme-aware, and `FeedbackHost` captures that API for
   * the objects. There is no separate "React layer" for this — it is a method
   * like any other, and the entry file just renders its element.
   */
  @OopReactRender()
  root() {
    const {settings} = this;

    return (
      <ConfigProvider
        theme={{algorithm: settings.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm}}
        locale={settings.locale === 'en' ? enUS : zhCN}
        // antd pads two-character Chinese labels ("源 码"); these labels are
        // short by design, so keep them as written.
        button={{autoInsertSpace: false}}
      >
        <AntApp>
          <FeedbackHost feedback={this.feedback} />
          {this.view()}
        </AntApp>
      </ConfigProvider>
    );
  }

  @OopReactRender()
  view() {
    return (
      <div className="app">
        {/* 窗口最顶上那条进度，和页面无关：谁开始干活谁让它动一下。 */}
        {this.progress.bar()}
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
          <img className="app-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
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
    const routes = this.routes;

    return (
      <aside className="app-sidebar">
        <Menu
          mode="inline"
          className="app-menu"
          selectedKeys={[router.path]}
          onClick={({key}) => router.goPath(String(key))}
          items={routes.map((route) => ({key: route.path, label: settings.t(route.titleKey)}))}
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
