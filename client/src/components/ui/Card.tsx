import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50 transition-shadow duration-300 hover:shadow-md ${className}`}
    >
      {title ? (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {action}
        </div>
      ) : null}
      <div className={title ? 'p-5' : 'p-5'}>{children}</div>
    </div>
  );
}
