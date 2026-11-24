import { useEffect, useState } from 'react';
import { api } from '../api';
import { useIdioma } from '../i18n/Idioma';
import { useConsentimiento } from './Consentimiento';

const TEXTOS = {
  es: { etiqueta: 'Escríbenos por WhatsApp', mensaje: 'Hola Kallpa, quiero información sobre la Plataforma de Becas.' },
  en: { etiqueta: 'Message us on WhatsApp', mensaje: 'Hi Kallpa, I would like information about the Scholarship Platform.' },
};

/** Botón flotante: abre WhatsApp con el bot de Kallpa (el mismo agente del chat). Solo aparece si el canal está activo. */
export default function WhatsappBoton() {
  const { idioma } = useIdioma();
  const { decision, aceptado, revisar } = useConsentimiento();
  const [numero, setNumero] = useState(null);

  useEffect(() => {
    api('/whatsapp/contacto').then((r) => setNumero(r.disponible ? r.numero : null)).catch(() => setNumero(null));
  }, []);

  if (!numero || decision === null) return null;
  const t = TEXTOS[idioma] ?? TEXTOS.es;
  const enlace = `https://wa.me/${numero}?text=${encodeURIComponent(t.mensaje)}`;
  return (
    <a href={enlace} onClick={(e) => { if (!aceptado) { e.preventDefault(); revisar(); } }} target="_blank" rel="noopener noreferrer" aria-label={t.etiqueta} title={t.etiqueta}
      className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40">
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="currentColor" aria-hidden="true">
        <path d="M16.04 3C9.4 3 4 8.33 4 14.9c0 2.33.69 4.5 1.88 6.34L4 29l7.97-1.84A12.2 12.2 0 0 0 16.04 26.8C22.68 26.8 28 21.47 28 14.9 28 8.33 22.68 3 16.04 3Zm0 21.6c-1.9 0-3.68-.51-5.2-1.4l-.37-.22-4.73 1.09 1.12-4.53-.25-.39a9.6 9.6 0 0 1-1.5-5.15c0-5.36 4.4-9.72 9.83-9.72 5.42 0 9.82 4.36 9.82 9.72 0 5.36-4.4 9.6-9.72 9.6Zm5.38-7.24c-.29-.15-1.74-.85-2.01-.95-.27-.1-.47-.15-.67.15-.2.29-.77.95-.94 1.15-.17.2-.35.22-.64.07-.29-.15-1.24-.45-2.36-1.44-.87-.77-1.46-1.72-1.63-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.67-1.6-.92-2.19-.24-.57-.49-.5-.67-.5h-.57c-.2 0-.51.07-.78.37-.27.29-1.03 1-1.03 2.44 0 1.44 1.05 2.83 1.2 3.02.15.2 2.07 3.14 5.02 4.4.7.3 1.25.48 1.68.62.7.22 1.35.19 1.85.12.57-.08 1.74-.7 1.99-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.56-.34Z" />
      </svg>
    </a>
  );
}
