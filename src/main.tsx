import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const root = document.getElementById("root")!;

// StrictMode только в dev — в prod двойных рендеров нет, меньше нагрузки
if (import.meta.env.DEV) {
  createRoot(root).render(<StrictMode><App /></StrictMode>);
} else {
  createRoot(root).render(<App />);
}