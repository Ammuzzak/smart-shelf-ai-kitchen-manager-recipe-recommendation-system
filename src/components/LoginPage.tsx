import React, { useState } from 'react';
import {
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
  Sun,
  Moon,
  Leaf,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { theme, toggleTheme, setCurrentUserWithToken, setToastMessage } = useKitchen();
  const isDark = theme === 'dark';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup') {
      if (!trimmedName) {
        setError('Please enter your name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your password.');
        return;
      }
    }

    setIsLoading(true);

   try {
  const accountsKey = 'smart_shelf_local_accounts';

  type LocalAccount = {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    isGuest: boolean;
    createdAt: string;
    avatar?: string;
  };

  const hashPassword = async (value: string) => {
    const data = new TextEncoder().encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  const storedAccounts = localStorage.getItem(accountsKey);

  let accounts: LocalAccount[] = [];

  try {
    accounts = storedAccounts ? JSON.parse(storedAccounts) : [];
  } catch {
    accounts = [];
  }

  const passwordHash = await hashPassword(password);
  const existingAccount = accounts.find(
    (account) => account.email === trimmedEmail
  );

  if (mode === 'signup') {
    if (existingAccount) {
      throw new Error(
        'An account with this email already exists. Please sign in instead.'
      );
    }

    const newAccount: LocalAccount = {
      id: crypto.randomUUID(),
      name: trimmedName,
      email: trimmedEmail,
      passwordHash,
      isGuest: false,
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    localStorage.setItem(accountsKey, JSON.stringify(accounts));

    const user: AuthUser = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      isGuest: false,
      createdAt: newAccount.createdAt,
    };

    const token = crypto.randomUUID();

    setCurrentUserWithToken(user, token);

    setToastMessage(`Welcome to Smart Shelf, ${user.name}!`);

    if (onLoginSuccess) {
      onLoginSuccess();
    }

    return;
  }

  if (!existingAccount) {
    throw new Error(
      'No account found with this email. Please create an account first.'
    );
  }

  if (existingAccount.passwordHash !== passwordHash) {
    throw new Error('Incorrect password. Please try again.');
  }

  const user: AuthUser = {
    id: existingAccount.id,
    name: existingAccount.name,
    email: existingAccount.email,
    isGuest: existingAccount.isGuest,
    createdAt: existingAccount.createdAt,
    avatar: existingAccount.avatar,
  };

  const token = crypto.randomUUID();

  setCurrentUserWithToken(user, token);

  setToastMessage(`Welcome back, ${user.name}!`);

  if (onLoginSuccess) {
    onLoginSuccess();
  }
} catch (err: any) {
  setError(
    err.message || 'An unexpected error occurred. Please try again.'
  );
} finally {
  setIsLoading(false);
}
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between transition-colors duration-200 ${
        isDark ? 'bg-[#0d1518] text-[#dbe4e8]' : 'bg-[#F7F5EF] text-[#24332D]'
      }`}
    >
      {/* Top Bar with Brand & Theme Toggle */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-colors ${
              isDark ? 'bg-[#a1e3f9] text-[#003642]' : 'bg-[#557A62] text-white'
            }`}
          >
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">Smart Shelf</h1>
            <p className={`text-[11px] font-mono ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Zero-Waste Kitchen Intelligence
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            isDark
              ? 'bg-[#151d20] border-white/10 text-[#a1e3f9] hover:bg-[#1c2529]'
              : 'bg-[#FFFFFF] border-[#E4DED2] text-[#557A62] hover:bg-[#EFE9DE]'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div
          className={`w-full max-w-md rounded-3xl border p-8 shadow-2xl transition-all ${
            isDark ? 'bg-[#151d20] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
          }`}
        >
          {/* Header & Mode Switcher */}
          <div className="text-center space-y-2 mb-6">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
                isDark ? 'bg-[#a1e3f9]/10 text-[#a1e3f9]' : 'bg-[#557A62]/10 text-[#557A62]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Isolated Private Kitchen Data</span>
            </div>

            <h2 className={`font-display text-2xl font-black ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              {mode === 'login' ? 'Sign In to Your Kitchen' : 'Create Your Kitchen Account'}
            </h2>
            <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              {mode === 'login'
                ? 'Enter your credentials to manage your inventory and meal rescues.'
                : 'Get started with zero-waste cooking and personalized pantry tracking.'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div
            className={`grid grid-cols-2 p-1 rounded-2xl mb-6 border ${
              isDark ? 'bg-[#0d1518] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? isDark
                    ? 'bg-[#a1e3f9] text-[#003642] shadow-sm'
                    : 'bg-[#557A62] text-white shadow-sm'
                  : isDark
                  ? 'text-[#8e989b] hover:text-white'
                  : 'text-[#68736D] hover:text-[#24332D]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? isDark
                    ? 'bg-[#a1e3f9] text-[#003642] shadow-sm'
                    : 'bg-[#557A62] text-white shadow-sm'
                  : isDark
                  ? 'text-[#8e989b] hover:text-white'
                  : 'text-[#68736D] hover:text-[#24332D]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 mb-5 ${
                isDark
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Your Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none opacity-50">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Arathy"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-[#1c2529] border-white/10 text-white placeholder-white/30 focus:border-[#a1e3f9]'
                        : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] placeholder-[#68736D]/50 focus:border-[#557A62]'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none opacity-50">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. arathy@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-[#1c2529] border-white/10 text-white placeholder-white/30 focus:border-[#a1e3f9]'
                      : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] placeholder-[#68736D]/50 focus:border-[#557A62]'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none opacity-50">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-[#1c2529] border-white/10 text-white placeholder-white/30 focus:border-[#a1e3f9]'
                      : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] placeholder-[#68736D]/50 focus:border-[#557A62]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs opacity-60 hover:opacity-100 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none opacity-50">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-[#1c2529] border-white/10 text-white placeholder-white/30 focus:border-[#a1e3f9]'
                        : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] placeholder-[#68736D]/50 focus:border-[#557A62]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs opacity-60 hover:opacity-100 cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              } ${
                isDark
                  ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                  : 'bg-[#557A62] hover:bg-[#43634F] text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Kitchen Account' : 'Sign In to Smart Shelf'}</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom helper */}
          <div className={`mt-6 pt-5 border-t text-center text-xs ${isDark ? 'border-white/5 text-[#8e989b]' : 'border-[#E4DED2] text-[#68736D]'}`}>
            {mode === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className={`font-bold hover:underline cursor-pointer ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`}
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className={`font-bold hover:underline cursor-pointer ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`}
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-4 text-center text-xs font-mono opacity-60 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
        Smart Shelf Kitchen Intelligence • Encrypted Server Auth • Zero Food Waste
      </footer>
    </div>
  );
};
