import {OopReactConfigure} from 'oop-react';
import {createRoot} from 'react-dom/client';
import {App} from './app/App';
import {DemoFallback} from './app/DemoFallback';
import './app/app.css';

OopReactConfigure({fallback: DemoFallback});

createRoot(document.getElementById('root')!).render(<App />);
