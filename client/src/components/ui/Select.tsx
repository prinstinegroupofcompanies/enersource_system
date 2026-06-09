import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-all duration-200 hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

export function Select({ label, error, className = '', id, children, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={`${selectClass} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-sm text-red-600 fade-in">{error}</p> : null}
    </div>
  );
}

export { selectClass };
