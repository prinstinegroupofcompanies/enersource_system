import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/brand/BrandLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ApiError } from '../lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@enersource.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.requiresMfa && result.mfaToken) {
        navigate('/mfa', { state: { mfaToken: result.mfaToken } });
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 p-12 text-white lg:flex">
        <BrandLogo size="lg" subtitle="Solar ERP Platform" variant="on-dark" />
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Office management built for solar operations
          </h1>
          <p className="text-lg text-slate-300">
            Finance, inventory, projects, HR, CRM, and reporting — unified with role-based access for your entire team.
          </p>
        </div>
        <p className="text-sm text-brand-200/70">EnerSource Inc · Enterprise Resource Planning</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md slide-up">
          <div className="mb-8 lg:hidden">
            <BrandLogo size="md" subtitle="Solar ERP Platform" variant="on-light" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-1 text-slate-600">Enter your credentials to access the platform</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-[38px] h-4 w-4 text-slate-400" />
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-[38px] h-4 w-4 text-slate-400" />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 fade-in">
                {error}
              </div>
            ) : null}
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Demo: admin@enersource.local · Default password in README after seed
          </p>
        </div>
      </div>
    </div>
  );
}
