import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../api';
import { useIdioma, useTitulo } from '../i18n/Idioma';
import { Contenedor, ICONOS, TarjetaNovedad } from '../componentes/Comunes';

export default function Inicio() {
  const { t, idioma } = useIdioma();
  const i = t.inicio;
  useTitulo(null);
  const [novedades, setNovedades] = useState([]);
  useEffect(() => { api(`/novedades?idioma=${idioma}&limite=3`).then(setNovedades).catch(() => setNovedades([])); }, [idioma]);

  return (
    <>
      <section className="relative overflow-hidden bg-tinta-950 text-white">
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-kallpa-500/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-sol-500/10 blur-3xl" />
        <Contenedor className="relative py-20 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-wider text-kallpa-300">{i.etiqueta}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">{i.titulo}</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">{i.subtitulo}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contacto" className="inline-flex items-center gap-2 rounded-full bg-kallpa-500 px-6 py-3 font-semibold text-tinta-950 hover:bg-kallpa-300">
              {i.cta1} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/proyectos" className="rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">{i.cta2}</Link>
          </div>
          <dl className="mt-14 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 lg:grid-cols-4">
            {i.cifras.map(([valor, etiqueta]) => (
              <div key={etiqueta}>
                <dt className="sr-only">{etiqueta}</dt>
                <dd className="text-3xl font-extrabold text-sol-400">{valor}</dd>
                <dd className="mt-1 text-sm text-slate-300">{etiqueta}</dd>
              </div>
            ))}
          </dl>
        </Contenedor>
      </section>

      <section className="py-16 sm:py-20">
        <Contenedor>
          <h2 className="text-3xl font-extrabold text-tinta-900">{i.serviciosTitulo}</h2>
          <p className="mt-2 text-slate-600">{i.serviciosSub}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.servicios.lista.map(([clave, titulo, desc]) => {
              const Icono = ICONOS[clave];
              return (
                <Link key={clave} to="/servicios" className="group rounded-2xl border border-slate-200 p-6 transition hover:border-kallpa-300 hover:shadow-md">
                  <Icono className="h-9 w-9 text-kallpa-600" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold text-tinta-900 group-hover:text-kallpa-700">{titulo}</h3>
                  <p className="mt-2 text-sm text-slate-600">{desc}</p>
                </Link>
              );
            })}
          </div>
        </Contenedor>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <Contenedor>
          <h2 className="text-3xl font-extrabold text-tinta-900">{i.procesoTitulo}</h2>
          <p className="mt-2 text-slate-600">{i.procesoSub}</p>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {i.fases.map(([fase, desc], n) => (
              <li key={fase} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tinta-900 font-bold text-sol-400">{n + 1}</span>
                <h3 className="mt-4 font-bold text-tinta-900">{fase}</h3>
                <p className="mt-2 text-sm text-slate-600">{desc}</p>
              </li>
            ))}
          </ol>
        </Contenedor>
      </section>

      <section className="py-16 sm:py-20">
        <Contenedor>
          <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-tinta-900 p-8 text-white sm:p-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-kallpa-300">{i.destacadoEtiqueta}</p>
              <h2 className="mt-3 text-3xl font-extrabold">{i.destacadoTitulo}</h2>
              <p className="mt-4 text-slate-300">{i.destacadoTexto}</p>
              <Link to="/proyectos" className="mt-6 inline-flex items-center gap-2 font-semibold text-sol-400 hover:underline">
                {i.destacadoCta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-3 text-sm">
              {t.proyectos.becas.modulos.slice(0, 8).map((m) => (
                <li key={m} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">{m}</li>
              ))}
            </ul>
          </div>
        </Contenedor>
      </section>

      {novedades.length > 0 && (
        <section className="bg-slate-50 py-16 sm:py-20">
          <Contenedor>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-3xl font-extrabold text-tinta-900">{i.novedadesTitulo}</h2>
              <Link to="/novedades" className="text-sm font-semibold text-kallpa-700 hover:underline">{i.verTodas}</Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {novedades.map((n) => <TarjetaNovedad key={n.slug} n={n} t={t} idioma={idioma} />)}
            </div>
          </Contenedor>
        </section>
      )}

      <section className="py-16 sm:py-20">
        <Contenedor className="text-center">
          <h2 className="text-3xl font-extrabold text-tinta-900">{i.ctaTitulo}</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">{i.ctaTexto}</p>
          <Link to="/contacto" className="mt-6 inline-block rounded-full bg-kallpa-600 px-8 py-3 font-semibold text-white hover:bg-kallpa-700">{i.ctaBoton}</Link>
        </Contenedor>
      </section>
    </>
  );
}
