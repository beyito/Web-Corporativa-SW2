import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { textos } from './textos';

const Contexto = createContext(null);

function idiomaInicial() {
  try {
    const guardado = localStorage.getItem('kallpa-idioma');
    if (guardado === 'es' || guardado === 'en') return guardado;
  } catch { /* almacenamiento no disponible */ }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function ProveedorIdioma({ children }) {
  const [idioma, setIdioma] = useState(idiomaInicial);

  useEffect(() => {
    document.documentElement.lang = idioma;
    document.querySelector('meta[name="description"]')?.setAttribute('content', textos[idioma].meta.descripcion);
    try { localStorage.setItem('kallpa-idioma', idioma); } catch { /* sin almacenamiento */ }
  }, [idioma]);

  const valor = useMemo(() => ({ idioma, setIdioma, t: textos[idioma] }), [idioma]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useIdioma = () => useContext(Contexto);

// Título de la pestaña por página
export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Kallpa Software` : 'Kallpa Software · Desarrollo de software';
  }, [titulo]);
}
