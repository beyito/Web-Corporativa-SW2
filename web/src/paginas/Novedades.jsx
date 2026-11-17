import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api, formatoFecha } from '../api';
import { useIdioma, useTitulo } from '../i18n/Idioma';
import { Contenedor, EncabezadoPagina, TarjetaNovedad } from '../componentes/Comunes';
import Boletin from '../componentes/Boletin';

export default function Novedades() {
  const { t, idioma } = useIdioma();
  useTitulo(t.novedades.titulo);
  const [tipo, setTipo] = useState('');
  const [lista, setLista] = useState(null);

  useEffect(() => {
    setLista(null);
    api(`/novedades?idioma=${idioma}${tipo ? `&tipo=${tipo}` : ''}`).then(setLista).catch(() => setLista([]));
  }, [idioma, tipo]);

  const filtros = [['', t.novedades.todas], ['NOTICIA', t.novedades.noticias], ['VERSION', t.novedades.versiones]];
  return (
    <>
      <EncabezadoPagina titulo={t.novedades.titulo} sub={t.novedades.sub} />
      <Contenedor className="py-12">
        <div role="group" aria-label={t.novedades.titulo} className="flex flex-wrap gap-2">
          {filtros.map(([valor, nombre]) => (
            <button key={valor} type="button" onClick={() => setTipo(valor)} aria-pressed={tipo === valor}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tipo === valor ? 'bg-tinta-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {nombre}
            </button>
          ))}
        </div>
        {lista === null ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3" aria-busy="true">
            {[1, 2, 3].map((k) => <div key={k} className="h-56 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : lista.length === 0 ? (
          <p className="mt-8 text-slate-600">{t.novedades.vacio}</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {lista.map((n) => <TarjetaNovedad key={n.slug} n={n} t={t} idioma={idioma} />)}
          </div>
        )}
        <div className="mt-16 rounded-3xl bg-slate-50 p-8 ring-1 ring-slate-200"><Boletin /></div>
      </Contenedor>
    </>
  );
}

export function DetalleNovedad() {
  const { slug } = useParams();
  const { t, idioma } = useIdioma();
  const [n, setN] = useState(undefined);
  useTitulo(n?.titulo ?? t.novedades.titulo);

  useEffect(() => { api(`/novedades/${slug}?idioma=${idioma}`).then(setN).catch(() => setN(null)); }, [slug, idioma]);

  return (
    <Contenedor className="max-w-3xl py-12">
      <Link to="/novedades" className="inline-flex items-center gap-1 text-sm font-semibold text-kallpa-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t.novedades.volver}
      </Link>
      {n === undefined && <div className="mt-8 h-64 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />}
      {n === null && <p className="mt-8 text-slate-600">{t.novedades.noEncontrada}</p>}
      {n && (
        <article className="mt-6">
          <p className="text-sm text-slate-500">
            {n.tipo === 'VERSION' ? `${n.producto} · ${t.novedades.version} ${n.version}` : t.novedades.noticias} · <time dateTime={n.fecha_publicacion}>{formatoFecha(n.fecha_publicacion, idioma)}</time>
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-tinta-900 sm:text-4xl">{n.titulo}</h1>
          <p className="mt-4 text-lg text-slate-600">{n.resumen}</p>
          <div className="mt-8 space-y-4 text-slate-700">
            {n.contenido.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </article>
      )}
    </Contenedor>
  );
}
