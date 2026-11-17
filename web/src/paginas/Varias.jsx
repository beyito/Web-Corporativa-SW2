import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useIdioma, useTitulo } from '../i18n/Idioma';
import { Contenedor, EncabezadoPagina } from '../componentes/Comunes';

export function Privacidad() {
  const { t } = useIdioma();
  useTitulo(t.privacidad.titulo);
  return (
    <>
      <EncabezadoPagina titulo={t.privacidad.titulo} />
      <Contenedor className="max-w-3xl space-y-4 py-12 text-slate-700">
        {t.privacidad.parrafos.map((p) => <p key={p}>{p}</p>)}
      </Contenedor>
    </>
  );
}

export function Terminos() {
  const { t } = useIdioma();
  useTitulo(t.terminos.titulo);
  return (
    <>
      <EncabezadoPagina titulo={t.terminos.titulo} />
      <Contenedor className="max-w-3xl space-y-4 py-12 text-slate-700">
        {t.terminos.parrafos.map((p) => <p key={p}>{p}</p>)}
      </Contenedor>
    </>
  );
}

export function Baja() {
  const { token } = useParams();
  const { t } = useIdioma();
  useTitulo(t.baja.titulo);
  const [estado, setEstado] = useState('procesando');
  useEffect(() => {
    api(`/suscripcion/baja/${encodeURIComponent(token)}`, { metodo: 'POST' }).then(() => setEstado('exito')).catch(() => setEstado('error'));
  }, [token]);
  return (
    <Contenedor className="max-w-xl py-24 text-center">
      <h1 className="text-3xl font-extrabold text-tinta-900">{t.baja.titulo}</h1>
      <p role="status" className="mt-4 text-slate-600">{t.baja[estado]}</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-kallpa-700 hover:underline">{t.noEncontrada.volver}</Link>
    </Contenedor>
  );
}

export function NoEncontrada() {
  const { t } = useIdioma();
  useTitulo(t.noEncontrada.titulo);
  return (
    <Contenedor className="max-w-xl py-24 text-center">
      <p className="text-6xl font-extrabold text-kallpa-600">404</p>
      <h1 className="mt-4 text-3xl font-extrabold text-tinta-900">{t.noEncontrada.titulo}</h1>
      <p className="mt-3 text-slate-600">{t.noEncontrada.texto}</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-kallpa-600 px-6 py-3 font-semibold text-white hover:bg-kallpa-700">{t.noEncontrada.volver}</Link>
    </Contenedor>
  );
}
