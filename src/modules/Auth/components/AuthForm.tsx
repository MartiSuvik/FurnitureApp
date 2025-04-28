import React, { useState, ChangeEvent, FormEvent } from 'react';
import { supabase, AuthError } from '../../../services/supabaseClient';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  switchMode: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, switchMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(email);
    setEmailError(isValid ? null : 'Please enter a valid email address');
    return isValid;
  };

  const validatePassword = (password: string): boolean => {
    const isValid = password.length >= 8;
    setPasswordError(isValid ? null : 'Password must be at least 8 characters');
    return isValid;
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail) validateEmail(newEmail);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword) validatePassword(newPassword);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        
        if (error) throw error;
      }
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !validateEmail(email)) {
      setEmailError('Please enter a valid email first');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setError('Password reset link sent to your email');
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2" role="alert">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={() => email && validateEmail(email)}
          className={`w-full px-4 py-2 border ${
            emailError ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
          placeholder="your@email.com"
          aria-invalid={emailError ? 'true' : 'false'}
          aria-describedby={emailError ? 'email-error' : undefined}
          required
        />
        {emailError && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {emailError}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => password && validatePassword(password)}
            className={`w-full px-4 py-2 border ${
              passwordError ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            placeholder="••••••••"
            aria-invalid={passwordError ? 'true' : 'false'}
            aria-describedby={passwordError ? 'password-error' : undefined}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {passwordError && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {passwordError}
          </p>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Remember me
          </label>
        </div>
        
        {mode === 'signin' && (
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Forgot password?
          </button>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            {mode === 'signin' ? 'Signing in...' : 'Signing up...'}
          </>
        ) : (
          <>{mode === 'signin' ? 'Sign in' : 'Sign up'}</>
        )}
      </button>
      
      <div className="text-center mt-4">
        <p className="text-gray-600">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            onClick={switchMode}
            className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </form>
  );
};

export default AuthForm;