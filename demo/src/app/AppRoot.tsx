import {App as AntApp, ConfigProvider, theme} from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import {OopReactObserver} from 'oop-react';
import type {ReactNode} from 'react';
import type {App} from './App';
import {FeedbackHost} from './Feedback';

/**
 * The provider host, and the only reason the React layer has a component of its
 * own: antd's theme and locale have to wrap the tree, and they have to re-render
 * when the settings object changes — which is exactly what an
 * `OopReactObserver` does.
 *
 * `<AntApp>` is here for `App.useApp()`: it is what makes `message` / `modal` /
 * `notification` follow the current theme. `FeedbackBridge` captures that API
 * into an object once, so page methods can call it without touching hooks.
 */
export function AppRoot({app}: {app: App}): ReactNode {
  return OopReactObserver(() => {
    const dark = app.settings.theme === 'dark';

    return (
      <ConfigProvider
        theme={{algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm}}
        locale={app.settings.locale === 'en' ? enUS : zhCN}
        // antd pads two-character Chinese labels ("源 码"); these labels are
        // short by design, so keep them as written.
        button={{autoInsertSpace: false}}
      >
        <AntApp>
          <FeedbackHost feedback={app.feedback} />
          {app.view()}
        </AntApp>
      </ConfigProvider>
    );
  });
}
