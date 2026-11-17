// Cliente mínimo de la API (mismo dominio: /api)
export class ErrorApi extends Error {
  constructor(estado, detalle) {
    super(typeof detalle === 'string' ? detalle : 'Error');
    this.estado = estado;
  }
}

export async function api(ruta, { metodo = 'GET', cuerpo, cabeceras = {} } = {}) {
  const r = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: { ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}), ...cabeceras },
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
  if (r.status === 204) return null;
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw new ErrorApi(r.status, datos?.detail);
  return datos;
}

// Panel: token del equipo en sessionStorage
export function tokenPanel() {
  try { return sessionStorage.getItem('kallpa-panel'); } catch { return null; }
}

export function apiPanel(ruta, opciones = {}) {
  return api(`/admin${ruta}`, { ...opciones, cabeceras: { Authorization: `Bearer ${tokenPanel()}` } });
}

export const formatoFecha = (iso, idioma) =>
  iso ? new Date(iso).toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-BO', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
