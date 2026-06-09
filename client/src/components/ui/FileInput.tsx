import type { InputHTMLAttributes } from 'react';

interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export function FileInput({ label, error, className = '', id, ...props }: FileInputProps) {
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
        type="file"
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-800 hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error ? <p className="text-sm text-red-600 fade-in">{error}</p> : null}
    </div>
  );
}
