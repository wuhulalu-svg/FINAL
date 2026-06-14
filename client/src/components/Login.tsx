import { useState } from 'react';
import { Activity, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

// API 基础地址
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
      setError('Invalid email or password. Please register if you don\'t have an account.');
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!resetEmail) {
      setResetError('请输入邮箱地址');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const response = await fetch(`${API_BASE}/password/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess('验证码已发送，请查收邮件');
        setStep('code');

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
      setResetError('网络错误，请稍后再试');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetCode) {
      setResetError('请输入验证码');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const response = await fetch(`${API_BASE}/password/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('reset');
        setResetSuccess('验证成功，请设置新密码');
      } else {
        setResetError(data.error || '验证失败');
      }
    } catch {
      setResetError('网络错误，请稍后再试');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setResetError('请填写新密码');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('两次输入的密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('密码长度不能少于6位');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const response = await fetch(`${API_BASE}/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess('密码重置成功！请重新登录');

        setTimeout(() => {
          setShowForgotPassword(false);
          setResetEmail('');
          setResetCode('');
          setNewPassword('');
          setConfirmPassword('');
          setStep('email');
          setResetSuccess('');
        }, 2000);
      } else {
        setResetError(data.error || '重置失败');
      }
    } catch {
      setResetError('网络错误，请稍后再试');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* LOGIN CARD - 方框在这里 */}
        {!showForgotPassword ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl mb-4 shadow-lg">
                <Activity className="text-white" size={40} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Smart Healthcare Tracker</h1>
              <p className="text-gray-600">Sign in to view your health data</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label className="block text-sm text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-indigo-600">
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm mt-6 text-gray-600">
              Don't have an account?{' '}
              <button onClick={onShowRegister} className="text-indigo-600">Sign up</button>
            </p>
          </div>
        ) : (

          /* FORGOT PASSWORD */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">

            <button onClick={() => setShowForgotPassword(false)} className="mb-4 flex items-center gap-2 text-gray-600">
              <ArrowLeft size={20} /> Back
            </button>

            <h2 className="text-xl font-bold mb-4">Forgot Password</h2>

            {/* 其余忘记密码逻辑不动 */}
            {step === 'email' && (
              <>
                <input value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="w-full border p-3 rounded-xl mb-3" />
                <button onClick={handleSendCode} className="w-full bg-indigo-600 text-white py-3 rounded-xl">
                  Send Code
                </button>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
