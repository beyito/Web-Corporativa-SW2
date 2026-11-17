import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useIdioma, useTitulo } from '../i18n/Idioma';
import { Contenedor, EncabezadoPagina, ICONOS } from '../componentes/Comunes';

export default function Servicios() {
  const { t } = useIdioma();
  useTitulo(t.servicios.titulo);
  return (
    <>
      <EncabezadoPagina titulo={t.servicios.titulo} sub={t.servicios.sub} />
      <Contenedor className="grid gap-6 py-16 md:grid-cols-2">
        {t.servicios.lista.map(([clave, titulo, desc, incluye]) => {
          const Icono = ICONOS[clave];
          return (
            <article key={clave} id={clave} className="rounded-2xl border border-slate-200 p-8">
              <Icono className="h-10 w-10 text-kallpa-600" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold text-tinta-900">{titulo}</h2>
              <p className="mt-2 text-slate-600">{desc}</p>
              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">{t.servicios.incluye}</h3>
              <ul className="mt-2 space-y-2">
                {incluye.map((x) => (
                  <li key={x} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-kallpa-600" aria-hidden="true" />{x}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </Contenedor>
      <Contenedor className="pb-16 text-center">
        <Link to="/contacto" className="inline-block rounded-full bg-kallpa-600 px-8 py-3 font-semibold text-white hover:bg-kallpa-700">{t.inicio.cta1}</Link>
      </Contenedor>
    </>
  );
}
