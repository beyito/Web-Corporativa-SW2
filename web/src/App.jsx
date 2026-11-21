import { lazy, Suspense, useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Cabecera from './componentes/Cabecera';
import Pie from './componentes/Pie';
import Chat from './componentes/Chat';
import WhatsappBoton from './componentes/WhatsappBoton';
import Inicio from './paginas/Inicio';
import Servicios from './paginas/Servicios';
import Proyectos from './paginas/Proyectos';
import Novedades, { DetalleNovedad } from './paginas/Novedades';
import Nosotros from './paginas/Nosotros';
import Contacto from './paginas/Contacto';
import { Baja, NoEncontrada, Privacidad, Terminos } from './paginas/Varias';

// El panel del equipo se descarga solo cuando se usa
const Panel = lazy(() => import('./panel/Panel'));

function Sitio() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="flex min-h-dvh flex-col">
      <Cabecera />
      <main id="contenido" className="flex-1" tabIndex={-1}><Outlet /></main>
      <Pie />
      <WhatsappBoton />
      <Chat />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Sitio />}>
        <Route index element={<Inicio />} />
        <Route path="servicios" element={<Servicios />} />
        <Route path="proyectos" element={<Proyectos />} />
        <Route path="novedades" element={<Novedades />} />
        <Route path="novedades/:slug" element={<DetalleNovedad />} />
        <Route path="nosotros" element={<Nosotros />} />
        <Route path="contacto" element={<Contacto />} />
        <Route path="privacidad" element={<Privacidad />} />
        <Route path="terminos" element={<Terminos />} />
        <Route path="baja/:token" element={<Baja />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
      <Route path="panel/*" element={<Suspense fallback={<p className="p-8">Cargando…</p>}><Panel /></Suspense>} />
    </Routes>
  );
}
