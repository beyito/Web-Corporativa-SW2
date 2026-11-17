import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useIdioma, useTitulo } from '../i18n/Idioma';
import { Contenedor, EncabezadoPagina } from '../componentes/Comunes';

const TECNOLOGIAS = ['React', 'Vite', 'Tailwind CSS', 'FastAPI', 'PostgreSQL 16', 'Redis', 'Flutter', 'LangGraph', 'Ollama', 'Solidity', 'Ethereum Sepolia', 'pyHanko (firma digital)', 'Docker', 'Caddy / Nginx'];

export default function Proyectos() {
  const { t } = useIdioma();
  const b = t.proyectos.becas;
  useTitulo(t.proyectos.titulo);
  return (
    <>
      <EncabezadoPagina titulo={t.proyectos.titulo} sub={t.proyectos.sub} />
      <Contenedor className="py-16">
        <article className="overflow-hidden rounded-3xl border border-slate-200">
          <header className="bg-gradient-to-br from-kallpa-700 to-tinta-900 p-8 text-white sm:p-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-kallpa-100">{b.etiqueta}</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{b.titulo}</h2>
            <p className="mt-3 max-w-3xl text-slate-200">{b.cliente}</p>
            <a href="https://becas-dubss-is.duckdns.org" target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-tinta-900 hover:bg-kallpa-50">
              {b.verDemo} <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </header>

          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-2">
            <section>
              <h3 className="text-lg font-bold text-tinta-900">{b.problemaTitulo}</h3>
              <p className="mt-2 text-slate-600">{b.problema}</p>
              <h3 className="mt-8 text-lg font-bold text-tinta-900">{b.solucionTitulo}</h3>
              <p className="mt-2 text-slate-600">{b.solucion}</p>
              <h3 className="mt-8 text-lg font-bold text-tinta-900">{b.tecnologiasTitulo}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {TECNOLOGIAS.map((x) => <li key={x} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{x}</li>)}
              </ul>
            </section>
            <section>
              <h3 className="text-lg font-bold text-tinta-900">{b.modulosTitulo}</h3>
              <ul className="mt-3 space-y-2">
                {b.modulos.map((m) => (
                  <li key={m} className="flex gap-2 text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-kallpa-600" aria-hidden="true" />{m}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="border-t border-slate-200 bg-slate-50 p-8 sm:p-12">
            <h3 className="text-lg font-bold text-tinta-900">{b.resultadosTitulo}</h3>
            <dl className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
              {b.resultados.map(([v, e]) => (
                <div key={e} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                  <dt className="sr-only">{e}</dt>
                  <dd className="text-3xl font-extrabold text-kallpa-700">{v}</dd>
                  <dd className="mt-1 text-sm text-slate-600">{e}</dd>
                </div>
              ))}
            </dl>
          </section>
        </article>
      </Contenedor>
    </>
  );
}
