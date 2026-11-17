import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Bot, Inbox, LogOut, Megaphone, MessagesSquare, Send, UserRound, Users } from 'lucide-react';
import { api, apiPanel, ErrorApi, tokenPanel } from '../api';
import { useTitulo } from '../i18n/Idioma';
import Logo from '../componentes/Logo';

// Panel interno del equipo (solo en español)
export default function Panel() {
  const [sesion, setSesion] = useState(() => (tokenPanel() ? sessionStorage.getItem('kallpa-panel-nombre') : null));
  const salir = () => { sessionStorage.removeItem('kallpa-panel'); sessionStorage.removeItem('kallpa-panel-nombre'); setSesion(null); };
  if (!sesion) return <Login onEntrar={setSesion} />;
  return <Escritorio nombre={sesion} onSalir={salir} />;
}

function Login({ onEntrar }) {
  useTitulo('Acceso del equipo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const entrar = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const r = await api('/admin/login', { metodo: 'POST', cuerpo: { email, password } });
      sessionStorage.setItem('kallpa-panel', r.token);
      sessionStorage.setItem('kallpa-panel-nombre', r.nombre);
      onEntrar(r.nombre);
    } catch (err) {
      setError(err instanceof ErrorApi && err.estado === 429 ? 'Demasiados intentos; espera unos minutos.' : 'Correo o contraseña incorrectos.');
    }
  };
  return (
    <main className="flex min-h-dvh items-center justify-center bg-tinta-950 px-4">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-xl">
        <Logo />
        <h1 className="text-lg font-bold text-tinta-900">Acceso del equipo</h1>
        <div>
          <label htmlFor="p-email" className="text-sm font-medium">Correo</label>
          <input id="p-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="p-pass" className="text-sm font-medium">Contraseña</label>
          <input id="p-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-lg bg-kallpa-600 py-2 font-semibold text-white hover:bg-kallpa-700">Entrar</button>
        <Link to="/" className="block text-center text-sm text-slate-500 hover:underline">Volver al sitio</Link>
      </form>
    </main>
  );
}

function Escritorio({ nombre, onSalir }) {
  const [resumen, setResumen] = useState(null);
  const navegar = useNavigate();
  const cargar = useCallback(() => apiPanel('/resumen').then(setResumen).catch((e) => { if (e.estado === 401) onSalir(); }), [onSalir]);
  useEffect(() => { cargar(); const id = setInterval(cargar, 10000); return () => clearInterval(id); }, [cargar]);

  const enlace = ({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`;
  const insignia = (n) => (n ? <span className="ml-auto rounded-full bg-sol-500 px-2 text-xs font-bold text-tinta-950">{n}</span> : null);

  return (
    <div className="min-h-dvh bg-slate-100 md:flex">
      <aside className="bg-tinta-950 p-4 md:min-h-dvh md:w-60">
        <Link to="/" className="block"><Logo claro /></Link>
        <nav className="mt-6 flex gap-1 overflow-x-auto md:flex-col" aria-label="Panel">
          <NavLink to="/panel" end className={enlace}><Bot className="h-4 w-4" />Resumen</NavLink>
          <NavLink to="/panel/chats" className={enlace}><MessagesSquare className="h-4 w-4" />Chats{insignia(resumen?.chats_esperando)}</NavLink>
          <NavLink to="/panel/mensajes" className={enlace}><Inbox className="h-4 w-4" />Mensajes{insignia(resumen?.mensajes_sin_leer)}</NavLink>
          <NavLink to="/panel/novedades" className={enlace}><Megaphone className="h-4 w-4" />Novedades</NavLink>
          <NavLink to="/panel/suscriptores" className={enlace}><Users className="h-4 w-4" />Suscriptores</NavLink>
        </nav>
        <div className="mt-6 border-t border-white/10 pt-4 text-sm text-slate-300">
          <p className="truncate">{nombre}</p>
          <button type="button" onClick={() => { onSalir(); navegar('/panel'); }} className="mt-2 flex items-center gap-2 text-slate-400 hover:text-white"><LogOut className="h-4 w-4" />Salir</button>
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-8">
        <Routes>
          <Route index element={<Resumen r={resumen} />} />
          <Route path="chats" element={<Chats />} />
          <Route path="chats/:id" element={<Chats />} />
          <Route path="mensajes" element={<Mensajes onCambio={cargar} />} />
          <Route path="novedades" element={<NovedadesPanel />} />
          <Route path="suscriptores" element={<Suscriptores />} />
          <Route path="*" element={<Navigate to="/panel" replace />} />
        </Routes>
      </main>
    </div>
  );
}

const Tarjeta = ({ titulo, valor, a }) => (
  <Link to={a} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-kallpa-300">
    <p className="text-sm text-slate-500">{titulo}</p><p className="mt-1 text-3xl font-extrabold text-tinta-900">{valor ?? '—'}</p>
  </Link>
);

function Resumen({ r }) {
  useTitulo('Panel');
  return (
    <>
      <h1 className="text-2xl font-extrabold text-tinta-900">Resumen</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tarjeta titulo="Chats esperando a una persona" valor={r?.chats_esperando} a="/panel/chats" />
        <Tarjeta titulo="Chats abiertos" valor={r?.chats_abiertos} a="/panel/chats" />
        <Tarjeta titulo="Mensajes sin leer" valor={r?.mensajes_sin_leer} a="/panel/mensajes" />
        <Tarjeta titulo="Suscriptores activos" valor={r?.suscriptores} a="/panel/suscriptores" />
        <Tarjeta titulo="Novedades publicadas" valor={r?.novedades_publicadas} a="/panel/novedades" />
      </div>
      {r && !r.correo_configurado && (
        <p className="mt-6 rounded-xl bg-sol-400/20 p-4 text-sm text-amber-900">El correo saliente (SMTP) no está configurado: los mensajes se guardan aquí, pero no se envían avisos ni confirmaciones.</p>
      )}
    </>
  );
}

const ESTADOS = { AGENTE: ['Agente IA', 'bg-kallpa-100 text-kallpa-700'], ESPERANDO: ['Esperando persona', 'bg-sol-400/30 text-amber-900'], HUMANO: ['Atendido', 'bg-blue-100 text-blue-800'], CERRADA: ['Cerrada', 'bg-slate-200 text-slate-600'] };
const Estado = ({ e }) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADOS[e][1]}`}>{ESTADOS[e][0]}</span>;
const hora = (iso) => new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });

function Chats() {
  useTitulo('Chats');
  const { id } = useParams();
  const [filtro, setFiltro] = useState('');
  const [lista, setLista] = useState([]);
  const cargar = useCallback(() => apiPanel(`/chats${filtro ? `?estado=${filtro}` : ''}`).then(setLista).catch(() => {}), [filtro]);
  useEffect(() => { cargar(); const t = setInterval(cargar, 5000); return () => clearInterval(t); }, [cargar]);

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <section className={`${id ? 'hidden lg:block' : ''}`}>
        <h1 className="text-2xl font-extrabold text-tinta-900">Chats</h1>
        <select aria-label="Filtrar por estado" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todos</option>
          {Object.entries(ESTADOS).map(([k, [n]]) => <option key={k} value={k}>{n}</option>)}
        </select>
        <ul className="mt-3 space-y-2">
          {lista.map((c) => (
            <li key={c.id}>
              <Link to={`/panel/chats/${c.id}`} className={`block rounded-xl bg-white p-3 ring-1 ${c.id === id ? 'ring-kallpa-500' : 'ring-slate-200'} hover:ring-kallpa-300`}>
                <div className="flex items-center justify-between gap-2"><Estado e={c.estado} /><span className="text-xs text-slate-500">{hora(c.actualizado)}</span></div>
                <p className="mt-1 truncate text-sm text-slate-700">{c.email || c.nombre || `Visitante (${c.idioma.toUpperCase()})`}</p>
                <p className="truncate text-xs text-slate-500">{c.ultimo}</p>
              </Link>
            </li>
          ))}
          {!lista.length && <li className="text-sm text-slate-500">No hay conversaciones.</li>}
        </ul>
      </section>
      {id ? <Conversacion id={id} onCambio={cargar} /> : <p className="hidden self-center text-center text-slate-500 lg:block">Elige una conversación.</p>}
    </div>
  );
}

function Conversacion({ id, onCambio }) {
  const [chat, setChat] = useState(null);
  const [texto, setTexto] = useState('');
  const fin = useRef(null);
  const cargar = useCallback(() => apiPanel(`/chats/${id}`).then(setChat).catch(() => setChat(null)), [id]);
  useEffect(() => { cargar(); const t = setInterval(cargar, 3000); return () => clearInterval(t); }, [cargar]);
  useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }); }, [chat?.mensajes.length]);

  const responder = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    await apiPanel(`/chats/${id}/responder`, { metodo: 'POST', cuerpo: { texto } });
    setTexto('');
    cargar(); onCambio();
  };
  const accion = async (ruta) => { await apiPanel(`/chats/${id}/${ruta}`, { metodo: 'POST' }); cargar(); onCambio(); };
  if (!chat) return <p className="text-slate-500">Cargando…</p>;
  const cerrada = chat.estado === 'CERRADA';

  return (
    <section className="flex h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-4">
        <div>
          <Link to="/panel/chats" className="text-xs text-kallpa-700 lg:hidden">← Volver</Link>
          <p className="font-semibold text-tinta-900">{chat.email || chat.nombre || 'Visitante'} <span className="text-xs font-normal text-slate-500">· {chat.idioma.toUpperCase()}</span></p>
          <Estado e={chat.estado} />
        </div>
        {!cerrada && (
          <div className="flex gap-2">
            {chat.estado !== 'AGENTE' && <button type="button" onClick={() => accion('devolver-al-agente')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold">Devolver al agente</button>}
            <button type="button" onClick={() => accion('cerrar')} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">Cerrar</button>
          </div>
        )}
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {chat.mensajes.map((m) => (
          m.autor === 'SISTEMA' ? <p key={m.id} className="text-center text-xs text-slate-500">{m.texto}</p> : (
            <div key={m.id} className={`flex ${m.autor === 'VISITANTE' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.autor === 'VISITANTE' ? 'bg-white ring-1 ring-slate-200' : m.autor === 'AGENTE' ? 'bg-kallpa-100 text-tinta-900' : 'bg-tinta-900 text-white'}`}>
                <p className="flex items-center gap-1 text-[10px] font-semibold opacity-70">
                  {m.autor === 'AGENTE' ? <><Bot className="h-3 w-3" />Agente IA · {m.origen}</> : m.autor === 'EQUIPO' ? <><UserRound className="h-3 w-3" />{m.origen}</> : 'Visitante'}
                </p>
                <p className="whitespace-pre-wrap">{m.texto}</p>
              </div>
            </div>
          )
        ))}
        <div ref={fin} />
      </div>
      {!cerrada && (
        <form onSubmit={responder} className="flex gap-2 border-t border-slate-200 p-3">
          <label htmlFor="resp" className="sr-only">Respuesta</label>
          <input id="resp" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000} placeholder="Responder como persona del equipo…" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button className="rounded-lg bg-kallpa-600 px-3 text-white hover:bg-kallpa-700" aria-label="Enviar"><Send className="h-4 w-4" /></button>
        </form>
      )}
    </section>
  );
}

function Mensajes({ onCambio }) {
  useTitulo('Mensajes');
  const [lista, setLista] = useState([]);
  const cargar = () => apiPanel('/mensajes').then(setLista).catch(() => {});
  useEffect(() => { cargar(); }, []);
  const leer = async (m) => { if (!m.leido) { await apiPanel(`/mensajes/${m.id}/leido`, { metodo: 'PATCH' }); cargar(); onCambio(); } };
  return (
    <>
      <h1 className="text-2xl font-extrabold text-tinta-900">Mensajes de contacto</h1>
      <ul className="mt-6 space-y-3">
        {lista.map((m) => (
          <li key={m.id}>
            <details onToggle={(e) => e.currentTarget.open && leer(m)} className={`rounded-xl bg-white p-4 ring-1 ${m.leido ? 'ring-slate-200' : 'ring-kallpa-500'}`}>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {!m.leido && <span className="h-2 w-2 rounded-full bg-kallpa-500" aria-label="Sin leer" />}
                  <span className="font-semibold">{m.nombre}</span><span className="text-slate-500">{m.email}</span>
                  <span className="rounded-full bg-slate-100 px-2 text-xs">{m.asunto}</span>
                  <span className="ml-auto text-xs text-slate-500">{hora(m.creado)}</span>
                </div>
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{m.mensaje}</p>
              <p className="mt-3 text-xs text-slate-500">{m.empresa && `${m.empresa} · `}Idioma: {m.idioma.toUpperCase()} · Aviso por correo: {m.correo_enviado ? 'enviado' : 'no enviado'}</p>
              <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: tu mensaje a Kallpa Software')}`} className="mt-3 inline-block text-sm font-semibold text-kallpa-700 hover:underline">Responder por correo</a>
            </details>
          </li>
        ))}
        {!lista.length && <li className="text-sm text-slate-500">No hay mensajes.</li>}
      </ul>
    </>
  );
}

const NUEVA = { slug: '', tipo: 'NOTICIA', producto: '', version: '', titulo_es: '', titulo_en: '', resumen_es: '', resumen_en: '', contenido_es: '', contenido_en: '', publicada: false };

function NovedadesPanel() {
  useTitulo('Novedades');
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const cargar = () => apiPanel('/novedades').then(setLista).catch(() => {});
  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    const cuerpo = { ...form, producto: form.producto || null, version: form.version || null };
    try {
      await apiPanel(form.id ? `/novedades/${form.id}` : '/novedades', { metodo: form.id ? 'PUT' : 'POST', cuerpo });
      setForm(null); cargar();
    } catch (err) { setError(err.estado === 409 ? 'Ya existe una novedad con ese identificador.' : 'Revisa los campos (el identificador solo admite minúsculas, números y guiones).'); }
  };
  const borrar = async (n) => { if (window.confirm(`¿Borrar «${n.titulo_es}»?`)) { await apiPanel(`/novedades/${n.id}`, { metodo: 'DELETE' }); cargar(); } };
  const c = (k) => ({ id: `n-${k}`, value: form[k] ?? '', onChange: (e) => setForm({ ...form, [k]: e.target.value }), className: 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm' });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-tinta-900">Novedades</h1>
        {!form && <button type="button" onClick={() => setForm(NUEVA)} className="rounded-lg bg-kallpa-600 px-4 py-2 text-sm font-semibold text-white">Nueva</button>}
      </div>
      {form && (
        <form onSubmit={guardar} className="mt-6 grid gap-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200 md:grid-cols-2">
          <div><label htmlFor="n-slug" className="text-sm font-medium">Identificador (URL)</label><input required {...c('slug')} /></div>
          <div><label htmlFor="n-tipo" className="text-sm font-medium">Tipo</label>
            <select {...c('tipo')}><option value="NOTICIA">Noticia</option><option value="VERSION">Versión de producto</option></select></div>
          <div><label htmlFor="n-producto" className="text-sm font-medium">Producto</label><input {...c('producto')} /></div>
          <div><label htmlFor="n-version" className="text-sm font-medium">Versión</label><input {...c('version')} /></div>
          {['es', 'en'].map((l) => (
            <fieldset key={l} className="space-y-2 rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold">{l === 'es' ? 'Español' : 'Inglés'}</legend>
              <label htmlFor={`n-titulo_${l}`} className="text-sm font-medium">Título</label><input required {...c(`titulo_${l}`)} />
              <label htmlFor={`n-resumen_${l}`} className="text-sm font-medium">Resumen</label><input required maxLength={400} {...c(`resumen_${l}`)} />
              <label htmlFor={`n-contenido_${l}`} className="text-sm font-medium">Contenido (párrafos separados por una línea en blanco)</label><textarea required rows={6} {...c(`contenido_${l}`)} />
            </fieldset>
          ))}
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={form.publicada} onChange={(e) => setForm({ ...form, publicada: e.target.checked })} />
            Publicada (al publicar por primera vez se avisa por correo a los suscriptores)
          </label>
          {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}
          <div className="flex gap-2 md:col-span-2">
            <button className="rounded-lg bg-kallpa-600 px-4 py-2 text-sm font-semibold text-white">Guardar</button>
            <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
          </div>
        </form>
      )}
      <ul className="mt-6 space-y-2">
        {lista.map((n) => (
          <li key={n.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${n.publicada ? 'bg-kallpa-100 text-kallpa-700' : 'bg-slate-200 text-slate-600'}`}>{n.publicada ? 'Publicada' : 'Borrador'}</span>
            <span className="flex-1 text-sm font-medium">{n.titulo_es}{n.version && <span className="text-slate-500"> · v{n.version}</span>}</span>
            <button type="button" onClick={() => setForm({ ...n, producto: n.producto ?? '', version: n.version ?? '' })} className="text-sm font-semibold text-kallpa-700">Editar</button>
            <button type="button" onClick={() => borrar(n)} className="text-sm text-red-600">Borrar</button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Suscriptores() {
  useTitulo('Suscriptores');
  const [lista, setLista] = useState([]);
  useEffect(() => { apiPanel('/suscriptores').then(setLista).catch(() => {}); }, []);
  return (
    <>
      <h1 className="text-2xl font-extrabold text-tinta-900">Suscriptores</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Correo</th><th className="p-3">Idioma</th><th className="p-3">Estado</th><th className="p-3">Desde</th></tr></thead>
          <tbody>
            {lista.map((s) => (
              <tr key={s.email} className="border-t border-slate-100"><td className="p-3">{s.email}</td><td className="p-3">{s.idioma.toUpperCase()}</td><td className="p-3">{s.activo ? 'Activo' : 'De baja'}</td><td className="p-3">{hora(s.creado)}</td></tr>
            ))}
            {!lista.length && <tr><td colSpan={4} className="p-3 text-slate-500">Sin suscriptores.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
