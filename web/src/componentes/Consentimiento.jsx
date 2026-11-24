import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useIdioma } from '../i18n/Idioma';

// Al cambiar los términos se sube la versión y se vuelve a preguntar
export const VERSION_TERMINOS = '1.1';
const CLAVE = 'kallpa-terminos';
const RUTAS_LEGALES = ['/terminos', '/privacidad'];

function leerDecision() {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE));
    return g?.version === VERSION_TERMINOS && ['aceptado', 'rechazado'].includes(g.decision) ? g.decision : null;
  } catch { return null; }
}

const Contexto = createContext(null);
export const useConsentimiento = () => useContext(Contexto);

/** Guarda en el navegador si el visitante aceptó o rechazó los términos. Sin aceptar, no se usan chat, WhatsApp, contacto ni boletín. */
export function ProveedorConsentimiento({ children }) {
  const [decision, setDecision] = useState(leerDecision);
  const [revisando, setRevisando] = useState(false);

  const decidir = useCallback((valor) => {
    setDecision(valor);
    setRevisando(false);
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ decision: valor, version: VERSION_TERMINOS, fecha: new Date().toISOString() }));
    } catch { /* sin almacenamiento: vale solo para esta visita */ }
  }, []);
  const revisar = useCallback(() => setRevisando(true), []);
  const cerrar = useCallback(() => setRevisando(false), []);

  const valor = useMemo(
    () => ({ decision, aceptado: decision === 'aceptado', revisando, decidir, revisar, cerrar }),
    [decision, revisando, decidir, revisar, cerrar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

function Botones({ t, decidir }) {
  return (
    <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={() => decidir('rechazado')}
        className="rounded-full border border-slate-400 bg-white px-6 py-2.5 text-sm font-semibold text-tinta-900 hover:bg-slate-100">{t.rechazar}</button>
      <button type="button" onClick={() => decidir('aceptado')}
        className="rounded-full bg-kallpa-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-tinta-900">{t.aceptar}</button>
    </div>
  );
}

/** Ventana de la primera visita. En las páginas legales se muestra como barra, para poder leerlas antes de decidir. */
export default function Consentimiento() {
  const { t: textos } = useIdioma();
  const t = textos.consentimiento;
  const { decision, revisando, decidir, cerrar } = useConsentimiento();
  const { pathname } = useLocation();
  const dialogo = useRef(null);

  const enLegal = RUTAS_LEGALES.includes(pathname);
  // La baja del boletín no exige aceptar nada
  const ventana = revisando || (decision === null && !enLegal && !pathname.startsWith('/baja/'));

  useEffect(() => {
    const d = dialogo.current;
    if (ventana && !d.open) d.showModal();
    if (!ventana && d.open) d.close();
    document.documentElement.classList.toggle('overflow-hidden', ventana);
    return () => document.documentElement.classList.remove('overflow-hidden');
  }, [ventana]);

  // Escape cierra solo si ya había una decisión tomada
  const alCancelar = (e) => { e.preventDefault(); if (decision !== null) cerrar(); };
  // Un segundo Escape puede cerrar el diálogo aunque se cancele: se vuelve a abrir si falta decidir
  const alCerrar = () => {
    if (!ventana) return;
    if (decision !== null) cerrar();
    else if (!dialogo.current.open) dialogo.current.showModal();
  };

  return (
    <>
      <dialog ref={dialogo} onCancel={alCancelar} onClose={alCerrar} aria-labelledby="consentimiento-titulo" aria-describedby="consentimiento-texto"
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white p-6 text-tinta-900 shadow-2xl backdrop:bg-tinta-950/70 sm:p-8">
        <ShieldCheck className="h-9 w-9 text-kallpa-600" aria-hidden="true" />
        <h2 id="consentimiento-titulo" className="mt-3 text-xl font-extrabold">{t.titulo}</h2>
        <p id="consentimiento-texto" className="mt-2 text-sm text-slate-600">{t.texto}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {t.puntos.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <p className="mt-4 text-sm">
          {t.leer} <Link to="/terminos" onClick={cerrar} className="font-semibold text-kallpa-700 underline">{t.terminos}</Link> {t.y}{' '}
          <Link to="/privacidad" onClick={cerrar} className="font-semibold text-kallpa-700 underline">{t.privacidad}</Link>.
        </p>
        {decision !== null && <p className="mt-3 text-sm font-medium text-slate-700">{t.actual} {t[decision]}.</p>}
        <div className="mt-6"><Botones t={t} decidir={decidir} /></div>
      </dialog>
      {decision === null && enLegal && !ventana && (
        <section aria-label={t.titulo} className="sticky bottom-0 z-40 border-t border-slate-200 bg-white px-4 py-4 shadow-2xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-700">{t.barra}</p>
            <Botones t={t} decidir={decidir} />
          </div>
        </section>
      )}
    </>
  );
}

/** Aviso que acompaña a un formulario desactivado mientras no se acepten los términos. */
export function AvisoConsentimiento({ oscuro = false }) {
  const { t } = useIdioma();
  const { revisar } = useConsentimiento();
  return (
    <p className={`mt-2 text-sm ${oscuro ? 'text-slate-200' : 'text-slate-700'}`}>
      {t.consentimiento.requerido}{' '}
      <button type="button" onClick={revisar} className={`font-semibold underline ${oscuro ? 'text-kallpa-300' : 'text-kallpa-700'}`}>{t.consentimiento.revisar}</button>
    </p>
  );
}
