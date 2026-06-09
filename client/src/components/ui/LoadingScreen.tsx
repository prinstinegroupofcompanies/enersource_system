import { BrandLogo } from '../brand/BrandLogo';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 text-white">
      <BrandLogo size="xl" subtitle="Loading your workspace…" variant="on-dark" showText />
      <div className="mt-8 h-1 w-32 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-500" />
      </div>
    </div>
  );
}
