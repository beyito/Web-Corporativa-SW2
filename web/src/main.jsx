import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProveedorIdioma } from './i18n/Idioma';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorIdioma>
        <App />
      </ProveedorIdioma>
    </BrowserRouter>
  </StrictMode>,
);
