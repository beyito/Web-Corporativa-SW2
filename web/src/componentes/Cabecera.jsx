import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import { useIdioma } from '../i18n/Idioma';

const RUTAS = [['/', 'inicio'], ['/servicios', 'servicios'], ['/proyectos', 'proyectos'], ['/novedades', 'novedades'], ['/nosotros', 'nosotros']];

export default function Cabecera() {
  const { t, idioma, setIdioma } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setAbierto(false), [pathname]);

  const enlace = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-kallpa-700' : 'text-slate-600 hover:text-tinta-900'}`;

  const selectorIdioma = (
    <div role="group" aria-label={t.nav.idioma} className="flex rounded-full border border-slate-200 p-0.5 text-xs font-semibold">
      {['es', 'en'].map((l) => (
        <button key={l} type="button" onClick={() => setIdioma(l)} aria-pressed={idioma === l}
          className={`rounded-full px-2.5 py-1 uppercase ${idioma === l ? 'bg-tinta-900 text-white' : 'text-slate-500 hover:text-tinta-900'}`}>
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow">
        {t.nav.saltar}
      </a>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4" aria-label="Principal">
        <Link to="/" aria-label="Kallpa Software"><Logo /></Link>
        <div className="hidden items-center gap-1 md:flex">
          {RUTAS.map(([ruta, clave]) => <NavLink key={ruta} to={ruta} end={ruta === '/'} className={enlace}>{t.nav[clave]}</NavLink>)}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {selectorIdioma}
          <Link to="/contacto" className="rounded-full bg-kallpa-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kallpa-700">{t.nav.contacto}</Link>
        </div>
        <button type="button" className="rounded-md p-2 text-tinta-900 md:hidden" onClick={() => setAbierto(!abierto)}
          aria-expanded={abierto} aria-controls="menu-movil" aria-label={abierto ? t.nav.cerrar : t.nav.menu}>
          {abierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {abierto && (
        <div id="menu-movil" className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <div className="flex flex-col py-2">
            {[...RUTAS, ['/contacto', 'contacto']].map(([ruta, clave]) => (
              <NavLink key={ruta} to={ruta} end={ruta === '/'} className={enlace}>{t.nav[clave]}</NavLink>
            ))}
          </div>
          {selectorIdioma}
        </div>
      )}
    </header>
  );
}
