// Logotipo de Kallpa Software: un cóndor estilizado en forma de "K" sobre un sol.
export default function Logo({ claro = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${className}`}>
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#111A2E" />
        <circle cx="28" cy="12" r="5" fill="#F59E0B" />
        <path d="M11 9v22M11 21l12-12M15 18l9 13" stroke="#14B8A6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className={claro ? 'text-white' : 'text-tinta-900'}>
        Kallpa<span className="text-kallpa-600"> Software</span>
      </span>
    </span>
  );
}
