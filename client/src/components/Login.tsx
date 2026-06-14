import { useState } from 'react';
import { Activity, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const API_BASE = 'https://final-production-4362.up.railway.app/api';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onShowRegister: () => void;
}

export function Login({ onLogin, onShowRegister }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'reset'>('email');

  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    const success = await onLogin(email, password);
    setLoading(false);

    if (!success) {
      setError('Invalid email or password');
    }
  };

  const handleSendCode = async () => {
    if (!resetEmail) return setResetError('请输入邮箱');

    setResetLoading(true);
    setResetError('');

    try {
      const res = await fetch(`${API_BASE}/password/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await res.json();

      if (res.ok) {
        setStep('code');
        setResetSuccess('验证码已发送');

        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setResetError(data.error || '发送失败');
      }
    } catch {
      setResetError('网络错误');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetCode) return setResetError('请输入验证码');

    setResetLoading(true);
    setResetError('');

    try {
      const res = await fetch(`${API_BASE}/password/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode })
      });

      const data = await res.json();

      if (res.ok) {
        setStep('reset');
        setResetSuccess('验证成功');
      } else {
        setResetError(data.error || '验证码错误');
      }
    } catch {
      setResetError('网络错误');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) return setResetError('请填写密码');
    if (newPassword !== confirmPassword) return setResetError('两次密码不一致');
    if (newPassword.length < 6) return setResetError('密码至少6位');

    setResetLoading(true);
    setResetError('');

    try {
      const res = await fetch(`${API_BASE}/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setResetSuccess('密码重置成功');

        setTimeout(() => {
          setShowForgotPassword(false);
          setStep('email');
          setResetEmail('');
          setResetCode('');
          setNewPassword('');
          setConfirmPassword('');
          setResetSuccess('');
        }, 1500);
      } else {
        setResetError(data.error || '失败');
      }
    } catch {
      setResetError('网络错误');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="w-full max-w-md">

        {!showForgotPassword ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center bg-indigo-600 p-4 rounded-2xl mb-4">
                <Activity className="text-white" size={40} />
              </div>
              <h1 className="text-2xl font-bold">Smart Healthcare Tracker</h1>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl flex gap-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label>Email</label>
                <input
                  className="w-full border p-3 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label>Password</label>
                <div className="relative">
                  <input
                    className="w-full border p-3 rounded-xl pr-10"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <button className="w-full bg-indigo-600 text-white py-3 rounded-xl">
                {loading ? 'Loading...' : 'Sign In'}
              </button>
            </form>

            <div className="text-center mt-4">
              <button onClick={onShowRegister} className="text-indigo-600">
                Sign up now
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-xl">

            <button
              onClick={() => setShowForgotPassword(false)}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <h2 className="text-xl font-bold mb-4">Forgot Password</h2>

            {resetError && <p className="text-red-500">{resetError}</p>}
            {resetSuccess && <p className="text-green-600">{resetSuccess}</p>}

            {step === 'email' && (
              <>
                <input
                  className="w-full border p-3 rounded-xl mb-3"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Email"
                />
                <button
                  onClick={handleSendCode}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl"
                >
                  Send Code
                </button>
              </>
            )}

            {step === 'code' && (
              <>
                <input
                  className="w-full border p-3 rounded-xl mb-3"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Code"
                />
                <button onClick={handleVerifyCode} className="w-full bg-indigo-600 text-white py-3 rounded-xl">
                  Verify
                </button>
              </>
            )}

            {step === 'reset' && (
              <>
                <input
                  className="w-full border p-3 rounded-xl mb-3"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                />

                <input
                  className="w-full border p-3 rounded-xl mb-3"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />

                <button
                  onClick={handleResetPassword}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl"
                >
                  Reset Password
                </button>
              </>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
