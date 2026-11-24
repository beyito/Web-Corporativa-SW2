import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, UserRound, X } from 'lucide-react';
import { api } from '../api';
import { useIdioma } from '../i18n/Idioma';
import { useConsentimiento } from './Consentimiento';

const CLAVE = 'kallpa-chat';
const leerSesion = () => { try { return JSON.parse(localStorage.getItem(CLAVE)); } catch { return null; } };
const guardarSesion = (s) => { try { s ? localStorage.setItem(CLAVE, JSON.stringify(s)) : localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ } };

export const abrirChat = () => window.dispatchEvent(new Event('kallpa-abrir-chat'));

export default function Chat() {
  const { t, idioma } = useIdioma();
  const { decision, aceptado, revisar } = useConsentimiento();
  const [abierto, setAbierto] = useState(false);
  const [sesion, setSesion] = useState(leerSesion);
  const [mensajes, setMensajes] = useState([]);
  const [estado, setEstado] = useState('AGENTE');
  const [atiende, setAtiende] = useState(null);
  const [texto, setTexto] = useState('');
  const [esperando, setEsperando] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [emailGuardado, setEmailGuardado] = useState(false);
  const lista = useRef(null);
  const ultimoId = mensajes.length ? mensajes[mensajes.length - 1].id : 0;

  const agregar = useCallback((nuevos) => {
    setMensajes((prev) => {
      const vistos = new Set(prev.map((m) => m.id));
      return [...prev, ...nuevos.filter((m) => !vistos.has(m.id))];
    });
  }, []);

  const aplicar = useCallback((r) => { setEstado(r.estado); setAtiende(r.atendida_por); agregar(r.mensajes); }, [agregar]);
  const cab = sesion ? { 'X-Chat-Token': sesion.token } : {};

  const iniciar = useCallback(async () => {
    const s = await api('/chat', { metodo: 'POST', cuerpo: { idioma } });
    const nueva = { id: s.id, token: s.token };
    guardarSesion(nueva);
    setSesion(nueva);
    setMensajes(s.mensajes);
    setEstado(s.estado);
    setEmailGuardado(false);
  }, [idioma]);

  useEffect(() => {
    const abrir = () => (aceptado ? setAbierto(true) : revisar());
    window.addEventListener('kallpa-abrir-chat', abrir);
    return () => window.removeEventListener('kallpa-abrir-chat', abrir);
  }, [aceptado, revisar]);

  // Si el visitante retira su aceptación, el chat se cierra
  useEffect(() => { if (!aceptado) setAbierto(false); }, [aceptado]);

  // Al abrir: retoma la conversación guardada o empieza una nueva
  useEffect(() => {
    if (!abierto) return;
    if (!sesion) { iniciar().catch(() => setError(t.chat.error)); return; }
    if (!mensajes.length) {
      api(`/chat/${sesion.id}`, { cabeceras: { 'X-Chat-Token': sesion.token } })
        .then(aplicar)
        .catch(() => { guardarSesion(null); setSesion(null); });
    }
  }, [abierto, sesion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mientras atiende una persona, consulta cada 3 s si hay mensajes nuevos
  useEffect(() => {
    if (!abierto || !sesion || estado === 'AGENTE' || estado === 'CERRADA') return undefined;
    const id = setInterval(() => {
      api(`/chat/${sesion.id}?desde=${ultimoId}`, { cabeceras: cab }).then(aplicar).catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [abierto, sesion, estado, ultimoId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' }); }, [mensajes, esperando]);

  const enviar = async (e) => {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || !sesion) return;
    setTexto('');
    setError(null);
    setEsperando(estado === 'AGENTE');
    try {
      aplicar(await api(`/chat/${sesion.id}/mensajes`, { metodo: 'POST', cuerpo: { texto: contenido }, cabeceras: cab }));
    } catch {
      setError(t.chat.error);
      setTexto(contenido);
    } finally {
      setEsperando(false);
    }
  };

  const pedirPersona = async () => {
    try { aplicar(await api(`/chat/${sesion.id}/persona?desde=${ultimoId}`, { metodo: 'POST', cabeceras: cab })); } catch { setError(t.chat.error); }
  };

  const guardarEmail = async (e) => {
    e.preventDefault();
    try { await api(`/chat/${sesion.id}/datos`, { metodo: 'POST', cuerpo: { email }, cabeceras: cab }); setEmailGuardado(true); } catch { setError(t.chat.error); }
  };

  const nueva = () => { guardarSesion(null); setSesion(null); setMensajes([]); setEstado('AGENTE'); setAtiende(null); iniciar().catch(() => setError(t.chat.error)); };

  const subtitulo = estado === 'ESPERANDO' ? t.chat.esperando : estado === 'HUMANO' ? `${t.chat.humano} ${atiende ?? ''}` : estado === 'CERRADA' ? t.chat.cerrada : t.chat.enLinea;

  return (
    <>
      {!abierto && decision !== null && (
        <button type="button" onClick={abrirChat} aria-label={t.chat.abrir}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-kallpa-600 text-white shadow-lg shadow-kallpa-900/30 hover:bg-kallpa-700 focus:outline-none focus:ring-4 focus:ring-kallpa-500/40">
          <MessageCircle className="h-7 w-7" />
        </button>
      )}
      {abierto && (
        <section role="dialog" aria-label={t.chat.titulo}
          className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[560px] sm:w-[380px] sm:rounded-2xl">
          <header className="flex items-center justify-between bg-tinta-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-kallpa-500">
                {estado === 'HUMANO' ? <UserRound className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-sm font-semibold">{t.chat.titulo}</p>
                <p className="text-xs text-slate-300" aria-live="polite">{subtitulo}</p>
              </div>
            </div>
            <button type="button" onClick={() => setAbierto(false)} aria-label={t.chat.cerrar} className="rounded p-1 hover:bg-white/10"><X className="h-5 w-5" /></button>
          </header>

          <div ref={lista} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4" aria-live="polite">
            {mensajes.map((m) => <Burbuja key={m.id} m={m} t={t} />)}
            {esperando && <p className="text-xs italic text-slate-500">{t.chat.escribiendo}</p>}
          </div>

          {estado === 'ESPERANDO' && !emailGuardado && (
            <form onSubmit={guardarEmail} className="flex gap-2 border-t border-slate-200 bg-sol-400/10 px-3 py-2">
              <label htmlFor="chat-email" className="sr-only">{t.chat.datosEmail}</label>
              <input id="chat-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.chat.datos}
                className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-xs" />
              <button className="rounded bg-tinta-900 px-2 py-1 text-xs font-semibold text-white">{t.chat.guardar}</button>
            </form>
          )}
          {emailGuardado && <p className="border-t border-slate-200 px-3 py-1 text-xs text-kallpa-700">{t.chat.guardado}</p>}
          {error && <p role="alert" className="px-3 py-1 text-xs text-red-600">{error}</p>}

          {estado === 'CERRADA' ? (
            <div className="border-t border-slate-200 p-3">
              <button type="button" onClick={nueva} className="w-full rounded-lg bg-kallpa-600 py-2 text-sm font-semibold text-white hover:bg-kallpa-700">{t.chat.nueva}</button>
            </div>
          ) : (
            <form onSubmit={enviar} className="border-t border-slate-200 p-3">
              <div className="flex gap-2">
                <label htmlFor="chat-texto" className="sr-only">{t.chat.placeholder}</label>
                <input id="chat-texto" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000} placeholder={t.chat.placeholder}
                  autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-kallpa-500 focus:outline-none focus:ring-2 focus:ring-kallpa-500/30" />
                <button type="submit" disabled={esperando || !texto.trim()} aria-label={t.chat.enviar}
                  className="rounded-lg bg-kallpa-600 px-3 text-white hover:bg-kallpa-700 disabled:opacity-50"><Send className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500">{t.chat.aviso}</p>
                {estado === 'AGENTE' && (
                  <button type="button" onClick={pedirPersona} className="shrink-0 text-xs font-semibold text-kallpa-700 hover:underline">{t.chat.persona}</button>
                )}
              </div>
            </form>
          )}
        </section>
      )}
    </>
  );
}

function Burbuja({ m, t }) {
  if (m.autor === 'SISTEMA') return <p className="text-center text-xs text-slate-500">{m.texto}</p>;
  const propio = m.autor === 'VISITANTE';
  return (
    <div className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${propio ? 'rounded-br-sm bg-kallpa-600 text-white' : 'rounded-bl-sm bg-white text-tinta-900 shadow-sm ring-1 ring-slate-200'}`}>
        <p className="whitespace-pre-wrap">{m.texto}</p>
        {m.autor === 'AGENTE' && m.origen && <p className="mt-1 text-[10px] text-slate-500">{t.chat.origen[m.origen] ?? ''}</p>}
        {m.autor === 'EQUIPO' && <p className="mt-1 text-[10px] text-slate-500">{m.origen}</p>}
      </div>
    </div>
  );
}
