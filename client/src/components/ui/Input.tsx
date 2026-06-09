import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
        {...props}
      />
      {error ? <p className="text-sm text-red-600 fade-in">{error}</p> : null}
    </div>
  );
}
