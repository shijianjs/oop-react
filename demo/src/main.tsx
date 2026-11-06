import {OopReactConfigure} from 'oop-react';
import {createRoot} from 'react-dom/client';
import {App} from './app/App';
import {DemoFallback} from './app/DemoFallback';
import './app/app.css';

OopReactConfigure({fallback: DemoFallback});

// The composition root: the graph is built once, here, and handed to React as a
// single element. Everything else — routing, theming, language, side effects —
// is owned by the objects.
const app = new App();

createRoot(document.getElementById('root')!).render(app.root());
