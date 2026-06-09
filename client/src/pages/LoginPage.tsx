import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/brand/BrandLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ApiError } from '../lib/api';

const isDev = import.meta.env.DEV;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(isDev ? 'admin@enersource.local' : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.requiresMfa && result.mfaToken) {
        navigate('/mfa', { state: { mfaToken: result.mfaToken } });
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative">
          <BrandLogo size="lg" subtitle="Solar ERP Platform" variant="on-dark" />
        </div>
        <div className="relative max-w-lg space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Power your solar operations from one platform
          </h1>
          <p className="text-lg leading-relaxed text-slate-300">
            Finance, inventory, projects, HR, CRM, and reporting — secured with role-based access for every team member.
          </p>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-brand-400" />
              Enterprise-grade authentication & MFA
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-brand-400" />
              Real-time dashboards and audit trail
            </li>
          </ul>
        </div>
        <p className="relative text-sm text-brand-200/60">© {new Date().getFullYear()} EnerSource Inc</p>
      </div>

      {/* Sign-in panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:justify-start">
            <BrandLogo size="lg" subtitle="Solar ERP Platform" variant="on-light" className="lg:hidden" />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 slide-up">
            <div className="mb-8 hidden lg:block">
              <BrandLogo size="md" showText={false} variant="on-light" className="justify-center" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-1.5 text-sm text-slate-500">Sign in to your EnerSource workspace</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-[38px] z-10 h-4 w-4 text-slate-400" />
                <Input
                  label="Work email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-[38px] z-10 h-4 w-4 text-slate-400" />
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-[38px] rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 fade-in"
                >
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Sign in
              </Button>
            </form>
          </div>

          {isDev ? (
            <p className="mt-6 text-center text-xs text-slate-400">
              Dev: admin@enersource.local · see README for passwords
            </p>
          ) : (
            <p className="mt-6 text-center text-xs text-slate-400">
              Authorized personnel only · Contact your administrator for access
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
