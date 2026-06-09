import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/brand/BrandLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ApiError } from '../lib/api';

export function MfaPage() {
  const { verifyMfa } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mfaToken = (location.state as { mfaToken?: string })?.mfaToken;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!mfaToken) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMfa(mfaToken, code);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50 px-6">
      <div className="w-full max-w-sm slide-up rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex justify-center">
          <BrandLogo size="md" showText={false} variant="on-light" />
        </div>
        <div className="mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
          <Shield className="h-6 w-6 text-brand-600" />
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-slate-900">Two-factor authentication</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter the 6-digit code from your authenticator app
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Verification code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="text-center text-lg tracking-[0.3em]"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" loading={loading}>
            Verify
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/login')}>
            Back to login
          </Button>
        </form>
      </div>
    </div>
  );
}
