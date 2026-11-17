import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, MessageCircle } from 'lucide-react';
import { api, ErrorApi } from '../api';
import { useIdioma, useTitulo } from '../i18n/Idioma';
import { Contenedor, EncabezadoPagina } from '../componentes/Comunes';
import { abrirChat } from '../componentes/Chat';
import Boletin from '../componentes/Boletin';

const VACIO = { nombre: '', email: '', empresa: '', asunto: 'COTIZACION', mensaje: '', sitio_web: '' };
const campo = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-kallpa-500 focus:outline-none focus:ring-2 focus:ring-kallpa-500/30';

export default function Contacto() {
  const { t, idioma } = useIdioma();
  const c = t.contacto;
  useTitulo(c.titulo);
  const [datos, setDatos] = useState(VACIO);
  const [estado, setEstado] = useState(null); // enviando | ok | error | limite

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setEstado('enviando');
    try {
      await api('/contacto', { metodo: 'POST', cuerpo: { ...datos, empresa: datos.empresa || null, idioma } });
      setEstado('ok');
      setDatos(VACIO);
    } catch (err) {
      setEstado(err instanceof ErrorApi && err.estado === 429 ? 'limite' : 'error');
    }
  };

  return (
    <>
      <EncabezadoPagina titulo={c.titulo} sub={c.sub} />
      <Contenedor className="grid gap-10 py-16 lg:grid-cols-3">
        <form onSubmit={enviar} className="space-y-4 rounded-2xl border border-slate-200 p-6 sm:p-8 lg:col-span-2" noValidate={false}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="text-sm font-medium text-slate-700">{c.nombre}</label>
              <input id="nombre" name="nombre" required minLength={2} maxLength={120} autoComplete="name" value={datos.nombre} onChange={cambiar} className={campo} />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">{c.email}</label>
              <input id="email" name="email" type="email" required autoComplete="email" value={datos.email} onChange={cambiar} className={campo} />
            </div>
            <div>
              <label htmlFor="empresa" className="text-sm font-medium text-slate-700">{c.empresa}</label>
              <input id="empresa" name="empresa" maxLength={160} autoComplete="organization" value={datos.empresa} onChange={cambiar} className={campo} />
            </div>
            <div>
              <label htmlFor="asunto" className="text-sm font-medium text-slate-700">{c.asunto}</label>
              <select id="asunto" name="asunto" value={datos.asunto} onChange={cambiar} className={campo}>
                {Object.entries(c.asuntos).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="mensaje" className="text-sm font-medium text-slate-700">{c.mensaje}</label>
            <textarea id="mensaje" name="mensaje" required minLength={10} maxLength={3000} rows={6} value={datos.mensaje} onChange={cambiar}
              aria-describedby="mensaje-ayuda" className={campo} />
            <p id="mensaje-ayuda" className="mt-1 text-xs text-slate-500">{c.minimo}</p>
          </div>
          {/* Trampa para bots: oculta para personas y lectores de pantalla */}
          <div aria-hidden="true" className="absolute -left-[9999px]">
            <label htmlFor="sitio_web">Sitio web</label>
            <input id="sitio_web" name="sitio_web" tabIndex={-1} autoComplete="off" value={datos.sitio_web} onChange={cambiar} />
          </div>
          <p className="text-xs text-slate-500">{c.privacidad} <Link to="/privacidad" className="text-kallpa-700 underline">{c.privacidadLink}</Link>.</p>
          <button type="submit" disabled={estado === 'enviando'}
            className="rounded-full bg-kallpa-600 px-6 py-3 font-semibold text-white hover:bg-kallpa-700 disabled:opacity-60">
            {estado === 'enviando' ? c.enviando : c.enviar}
          </button>
          <p role="status" className={`text-sm ${estado === 'ok' ? 'text-kallpa-700' : 'text-red-600'}`}>
            {estado === 'ok' && c.exito}
            {estado === 'error' && c.error}
            {estado === 'limite' && c.limite}
          </p>
        </form>

        <aside className="space-y-6">
          <h2 className="text-lg font-bold text-tinta-900">{c.otros}</h2>
          <div className="rounded-2xl bg-tinta-900 p-6 text-white">
            <MessageCircle className="h-7 w-7 text-sol-400" aria-hidden="true" />
            <h3 className="mt-3 font-bold">{c.chat}</h3>
            <p className="mt-1 text-sm text-slate-300">{c.chatTexto}</p>
            <button type="button" onClick={abrirChat} className="mt-4 rounded-full bg-kallpa-500 px-4 py-2 text-sm font-semibold text-tinta-950 hover:bg-kallpa-300">{c.abrirChat}</button>
          </div>
          <div className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-kallpa-600" aria-hidden="true" /><div><h3 className="text-sm font-semibold">{c.ubicacion}</h3><p className="text-sm text-slate-600">{c.ubicacionTexto}</p></div></div>
          <div className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-kallpa-600" aria-hidden="true" /><div><h3 className="text-sm font-semibold">{c.horario}</h3><p className="text-sm text-slate-600">{c.horarioTexto}</p></div></div>
          <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200"><Boletin /></div>
        </aside>
      </Contenedor>
    </>
  );
}
