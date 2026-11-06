import {reaction} from 'mobx';
import {OopReactConfigure} from 'oop-react';
import {createRoot} from 'react-dom/client';
import {App} from './app/App';
import {AppRoot} from './app/AppRoot';
import {DemoFallback} from './app/DemoFallback';
import './app/app.css';

OopReactConfigure({fallback: DemoFallback});

// The composition root: the graph is built once, here, and handed to React.
const app = new App();

// Side effects that reach outside React are MobX's job, not a render method's:
// the document attributes follow the settings object.
reaction(
  () => app.settings.theme,
  (theme) => {
    document.documentElement.dataset.theme = theme;
  },
  {fireImmediately: true},
);
reaction(
  () => app.settings.locale,
  (locale) => {
    document.documentElement.lang = locale === 'zh' ? 'zh-Hans' : 'en';
  },
  {fireImmediately: true},
);

createRoot(document.getElementById('root')!).render(<AppRoot app={app} />);
