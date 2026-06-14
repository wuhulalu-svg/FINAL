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

  // 忘记密码状态
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
    } catch (error) {
      setResetError('网络错误，请稍后再试');
    } finally {
      setResetLoading(false);
    }
  };

  // 验证验证码
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
    } catch (error) {
      setResetError('网络错误，请稍后再试');
    } finally {
      setResetLoading(false);
    }
  };

  // 重置密码
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
    } catch (error) {
      setResetError('网络错误，请稍后再试');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* 登录表单 */}
        {!showForgotPassword ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl mb-4 shadow-lg">
                <Activity className="text-white" size={40} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Smart Healthcare Tracker</h1>
              <p className="text-gray-600">Sign in to view your health data</p>
            </div>

            {/* ✅ 已删除 Demo Account 区块 */}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-md"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <button type="button" onClick={onShowRegister} className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign up now
              </button>
            </p>
          </>
        ) : (
          // 忘记密码表单（完全不动）
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setStep('email');
                setResetError('');
                setResetSuccess('');
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Login</span>
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl mb-3">
                <Lock className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Forgot Password?</h2>
              <p className="text-sm text-gray-500 mt-1">
                {step === 'email' && 'Enter your email to receive a verification code'}
                {step === 'code' && 'Enter the verification code sent to your email'}
                {step === 'reset' && 'Set your new password'}
              </p>
            </div>

            {resetError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
                <p className="text-sm text-red-800">{resetError}</p>
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                <p className="text-sm text-green-800">{resetSuccess}</p>
              </div>
            )}

            {step === 'email' && (
              <div className="space-y-4">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSendCode}
                  disabled={resetLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl"
                >
                  {resetLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {step === 'code' && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center tracking-widest"
                />

                <button
                  onClick={handleVerifyCode}
                  disabled={resetLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl"
                >
                  {resetLoading ? 'Verifying...' : 'Verify Code'}
                </button>

                <button
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className="w-full text-indigo-600 py-2"
                >
                  Resend Code {countdown > 0 && `(${countdown}s)`}
                </button>
              </div>
            )}

            {step === 'reset' && (
              <div className="space-y-4">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />

                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
