import { Link } from 'react-router-dom';
import Logo from './Logo';
import Boletin from './Boletin';
import { useIdioma } from '../i18n/Idioma';

export default function Pie() {
  const { t } = useIdioma();
  const enlace = 'text-sm text-slate-300 hover:text-white';
  return (
    <footer className="bg-tinta-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo claro />
          <p className="mt-3 text-sm">{t.pie.lema}</p>
          <p className="mt-2 text-sm">{t.contacto.ubicacionTexto}</p>
        </div>
        <nav aria-label={t.pie.enlaces}>
          <h2 className="text-sm font-semibold text-white">{t.pie.enlaces}</h2>
          <ul className="mt-3 space-y-2">
            {[['/servicios', t.nav.servicios], ['/proyectos', t.nav.proyectos], ['/novedades', t.nav.novedades], ['/nosotros', t.nav.nosotros], ['/contacto', t.nav.contacto]].map(([r, n]) => (
              <li key={r}><Link className={enlace} to={r}>{n}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t.pie.legal}>
          <h2 className="text-sm font-semibold text-white">{t.pie.legal}</h2>
          <ul className="mt-3 space-y-2">
            <li><Link className={enlace} to="/terminos">{t.pie.terminos}</Link></li>
            <li><Link className={enlace} to="/privacidad">{t.pie.privacidad}</Link></li>
            <li><Link className={enlace} to="/panel">{t.pie.panel}</Link></li>
          </ul>
        </nav>
        <Boletin oscuro />
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-slate-400">
          © {new Date().getFullYear()} Kallpa Software · {t.pie.derechos} {t.nosotros.ficticia}
        </p>
      </div>
    </footer>
  );
}
