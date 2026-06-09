const LOGO_SRC = '/enersource_logo.jpeg';

const sizes = {
  sm: { img: 'h-7', text: 'text-sm' },
  md: { img: 'h-9', text: 'text-base' },
  lg: { img: 'h-11', text: 'text-lg' },
  xl: { img: 'h-14', text: 'text-2xl' },
};

export function BrandLogo({
  size = 'md',
  showText = true,
  subtitle,
  variant = 'default',
  className = '',
}: {
  size?: keyof typeof sizes;
  showText?: boolean;
  subtitle?: string;
  variant?: 'default' | 'on-dark' | 'on-light';
  className?: string;
}) {
  const s = sizes[size];
  const imgWrap =
    variant === 'on-dark'
      ? 'rounded-xl bg-white px-2 py-1 shadow-sm'
      : variant === 'on-light'
        ? 'rounded-lg'
        : 'rounded-xl bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200/80';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`shrink-0 ${imgWrap}`}>
        <img
          src={LOGO_SRC}
          alt="EnerSource Inc"
          className={`${s.img} w-auto object-contain`}
        />
      </div>
      {showText ? (
        <div className="min-w-0">
          <p className={`truncate font-bold tracking-tight ${s.text} ${variant === 'on-dark' ? 'text-white' : 'text-slate-900'}`}>
            EnerSource
          </p>
          {subtitle ? (
            <p className={`truncate text-xs ${variant === 'on-dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
