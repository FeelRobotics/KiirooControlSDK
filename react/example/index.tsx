import 'react-app-polyfill/ie11';
import * as React from 'react';
import App from './App';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(<App />);
