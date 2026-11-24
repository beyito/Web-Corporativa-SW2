import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useIdioma } from '../i18n/Idioma';
import { AvisoConsentimiento, useConsentimiento } from './Consentimiento';

// Suscripción al boletín de actualizaciones (correo)
export default function Boletin({ oscuro = false }) {
  const { t, idioma } = useIdioma();
  const { aceptado } = useConsentimiento();
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState(null); // ok | error | enviando

  const enviar = async (e) => {
    e.preventDefault();
    setEstado('enviando');
    try {
      await api('/suscripcion', { metodo: 'POST', cuerpo: { email, idioma } });
      setEstado('ok');
      setEmail('');
    } catch {
      setEstado('error');
    }
  };

  return (
    <div>
      <h2 className={`text-base font-semibold ${oscuro ? 'text-white' : 'text-tinta-900'}`}>{t.boletin.titulo}</h2>
      <p className={`mt-1 text-sm ${oscuro ? 'text-slate-300' : 'text-slate-600'}`}>{t.boletin.texto}</p>
      <form onSubmit={enviar} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`boletin-${oscuro}`} className="sr-only">{t.contacto.email}</label>
        <input id={`boletin-${oscuro}`} type="email" required disabled={!aceptado} value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={t.boletin.placeholder} autoComplete="email"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-tinta-900 focus:border-kallpa-500 focus:outline-none focus:ring-2 focus:ring-kallpa-500/30 disabled:bg-slate-200" />
        <button type="submit" disabled={!aceptado || estado === 'enviando'}
          className="rounded-lg bg-sol-500 px-4 py-2 text-sm font-semibold text-tinta-950 hover:bg-sol-400 disabled:opacity-60">
          {t.boletin.boton}
        </button>
      </form>
      {!aceptado && <AvisoConsentimiento oscuro={oscuro} />}
      <p className={`mt-2 text-xs ${oscuro ? 'text-slate-400' : 'text-slate-500'}`}>
        {t.boletin.acepto} <Link to="/terminos" className="underline">{t.boletin.terminos}</Link> {t.boletin.y}{' '}
        <Link to="/privacidad" className="underline">{t.boletin.privacidad}</Link>.
      </p>
      <p role="status" className={`mt-2 text-sm ${estado === 'error' ? 'text-red-400' : oscuro ? 'text-kallpa-300' : 'text-kallpa-700'}`}>
        {estado === 'ok' && t.boletin.exito}
        {estado === 'error' && t.boletin.error}
      </p>
    </div>
  );
}
