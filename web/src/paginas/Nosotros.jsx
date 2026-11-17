import { Eye, HeartHandshake, Lock, Medal, Target, Users } from 'lucide-react';
import { equipo } from '../i18n/textos';
import { useIdioma, useTitulo } from '../i18n/Idioma';
import { Contenedor, EncabezadoPagina } from '../componentes/Comunes';

const ICONOS_VALORES = [Eye, Lock, Medal, HeartHandshake];
const iniciales = (nombre) => nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('');

export default function Nosotros() {
  const { t, idioma } = useIdioma();
  const n = t.nosotros;
  useTitulo(n.titulo);
  return (
    <>
      <EncabezadoPagina titulo={n.titulo} sub={n.sub} />
      <Contenedor className="py-16">
        <p className="max-w-3xl text-lg text-slate-700">{n.historia}</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[[Target, n.mision], [Eye, n.vision]].map(([Icono, [titulo, texto]]) => (
            <section key={titulo} className="rounded-2xl bg-tinta-900 p-8 text-white">
              <Icono className="h-8 w-8 text-sol-400" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold">{titulo}</h2>
              <p className="mt-2 text-slate-300">{texto}</p>
            </section>
          ))}
        </div>

        <h2 className="mt-16 text-2xl font-extrabold text-tinta-900">{n.valoresTitulo}</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {n.valores.map(([titulo, texto], i) => {
            const Icono = ICONOS_VALORES[i];
            return (
              <section key={titulo} className="rounded-2xl border border-slate-200 p-6">
                <Icono className="h-7 w-7 text-kallpa-600" aria-hidden="true" />
                <h3 className="mt-3 font-bold text-tinta-900">{titulo}</h3>
                <p className="mt-1 text-sm text-slate-600">{texto}</p>
              </section>
            );
          })}
        </div>

        <h2 className="mt-16 flex items-center gap-2 text-2xl font-extrabold text-tinta-900"><Users className="h-6 w-6 text-kallpa-600" aria-hidden="true" />{n.equipoTitulo}</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {equipo.map((p) => (
            <li key={p.nombre} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5">
              <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-kallpa-100 text-lg font-bold text-kallpa-700">{iniciales(p.nombre)}</span>
              <div>
                <p className="font-bold text-tinta-900">{p.nombre}</p>
                <p className="text-sm text-slate-600">{p.rol[idioma]}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-12 rounded-xl bg-sol-400/15 p-4 text-sm text-amber-900">{n.ficticia}</p>
      </Contenedor>
    </>
  );
}
