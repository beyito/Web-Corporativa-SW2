import { Link } from 'react-router-dom';
import { BarChart3, Blocks, BrainCircuit, Globe, ShieldCheck, Smartphone } from 'lucide-react';
import { formatoFecha } from '../api';

export const ICONOS = { web: Globe, movil: Smartphone, ia: BrainCircuit, blockchain: Blocks, bi: BarChart3, calidad: ShieldCheck };

export function EncabezadoPagina({ titulo, sub }) {
  return (
    <section className="bg-tinta-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{titulo}</h1>
        {sub && <p className="mt-3 max-w-2xl text-lg text-slate-300">{sub}</p>}
      </div>
    </section>
  );
}

export function TarjetaNovedad({ n, t, idioma }) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${n.tipo === 'VERSION' ? 'bg-kallpa-100 text-kallpa-700' : 'bg-sol-400/20 text-amber-800'}`}>
          {n.tipo === 'VERSION' ? `${t.novedades.version} ${n.version ?? ''}` : t.novedades.noticias}
        </span>
        <time dateTime={n.fecha_publicacion} className="text-slate-500">{formatoFecha(n.fecha_publicacion, idioma)}</time>
      </div>
      <h3 className="mt-3 text-lg font-bold text-tinta-900">{n.titulo}</h3>
      {n.producto && <p className="text-xs text-slate-500">{n.producto}</p>}
      <p className="mt-2 flex-1 text-sm text-slate-600">{n.resumen}</p>
      <Link to={`/novedades/${n.slug}`} className="mt-4 text-sm font-semibold text-kallpa-700 hover:underline">
        {t.novedades.leer} <span aria-hidden="true">→</span><span className="sr-only">: {n.titulo}</span>
      </Link>
    </article>
  );
}

export const Contenedor = ({ children, className = '' }) => <div className={`mx-auto max-w-6xl px-4 ${className}`}>{children}</div>;
