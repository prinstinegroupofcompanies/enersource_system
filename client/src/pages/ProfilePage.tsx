import { useEffect, useState } from 'react';
import { Shield, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function ProfilePage() {
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });
  const [passwords, setPasswords] = useState({ current: '', next: '' });
  const [mfaQr, setMfaQr] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    api
      .get<{ firstName: string; lastName: string; phone?: string }>('/users/me', accessToken)
      .then((p) => setProfile({ firstName: p.firstName, lastName: p.lastName, phone: p.phone ?? '' }));
  }, [accessToken]);

  const saveProfile = async () => {
    if (!accessToken) return;
    await api.patch('/users/me', profile, accessToken);
    setMessage('Profile updated');
  };

  const changePassword = async () => {
    if (!accessToken) return;
    await api.post(
      '/auth/password/change',
      { currentPassword: passwords.current, newPassword: passwords.next },
      accessToken
    );
    setPasswords({ current: '', next: '' });
    setMessage('Password changed — please sign in again if sessions were cleared');
  };

  const setupMfa = async () => {
    if (!accessToken) return;
    const data = await api.get<{ qrCode: string }>('/auth/mfa/setup', accessToken);
    setMfaQr(data.qrCode);
  };

  const enableMfa = async () => {
    if (!accessToken) return;
    await api.post('/auth/mfa/enable', { code: mfaCode }, accessToken);
    setMfaQr(null);
    setMfaCode('');
    setMessage('MFA enabled successfully');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile & Security</h1>

      {message ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 fade-in">
          {message}
        </div>
      ) : null}

      <Card title="Personal Information">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={profile.firstName}
              onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
            />
            <Input
              label="Last name"
              value={profile.lastName}
              onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
            />
          </div>
          <Input
            label="Phone"
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
          />
          <p className="text-sm text-slate-500">
            {user?.email} · {user?.role.name}
            {user?.department ? ` · ${user.department.name}` : ''}
          </p>
          <Button onClick={saveProfile}>Save Profile</Button>
        </div>
      </Card>

      <Card title="Change Password">
        <div className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
          />
          <Input
            label="New password"
            type="password"
            value={passwords.next}
            onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
          />
          <p className="text-xs text-slate-500">
            Min 10 characters with upper, lower, number, and special character.
          </p>
          <Button variant="secondary" onClick={changePassword}>
            <Key className="h-4 w-4" /> Update Password
          </Button>
        </div>
      </Card>

      <Card title="Multi-Factor Authentication">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Status:{' '}
            <span className="font-semibold">{user?.mfaEnabled ? 'Enabled' : 'Disabled'}</span>
          </p>
          {!user?.mfaEnabled ? (
            <>
              {!mfaQr ? (
                <Button variant="secondary" onClick={setupMfa}>
                  <Shield className="h-4 w-4" /> Set up MFA
                </Button>
              ) : (
                <>
                  <img src={mfaQr} alt="MFA QR Code" className="mx-auto h-48 w-48 rounded-xl border" />
                  <Input
                    label="Enter code to confirm"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <Button onClick={enableMfa}>Enable MFA</Button>
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-emerald-700">Your account is protected with two-factor authentication.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
