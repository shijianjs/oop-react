import {OopReactConfigure} from 'oop-react';
import {createRoot} from 'react-dom/client';
import {DemoFallback} from './app/DemoFallback';
import {Workshop} from './workshop/Workshop';
import {WorkshopView} from './workshop/WorkshopView';
import './app/app.css';

OopReactConfigure({fallback: DemoFallback});

// The composition root. The object graph is built here, once, and handed to
// React — the opposite of building it inside components.
const workshop = new Workshop();

createRoot(document.getElementById('root')!).render(<WorkshopView workshop={workshop} />);
