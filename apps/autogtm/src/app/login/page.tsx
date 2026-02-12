'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Recovery / forgot password state
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  // Detect recovery token in URL hash and set session
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(() => {
          setIsRecovery(true);
        });
      } else {
        setIsRecovery(true);
      }
    }
  }, []);

  // Invite code / signup state
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviteValidated, setIsInviteValidated] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      toast({ title: 'Password updated', description: 'You are now signed in.' });
      window.location.href = '/app';
    } catch {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setForgotMessage('');
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setForgotMessage('Reset link sent — check your email (and spam folder).');
    } catch {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateInvite = async () => {
    setIsValidatingCode(true);
    setInviteError(null);
    try {
      const response = await fetch('/api/validate-invite-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid invite code');
      }

      setIsInviteValidated(true);
      setIsSigningUp(true);
      setShowInviteInput(false);
    } catch (err: any) {
      setInviteError(err.message || 'An unexpected error occurred');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (isSigningUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { user_type: 'autogtm' } },
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        if (data?.user?.identities?.length === 0) {
          setErrorMessage('You already have an account. Please log in instead.');
          return;
        }

        toast({ title: 'Account created', description: 'You can now log in.' });
        setIsSigningUp(false);
        setIsInviteValidated(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        window.location.href = '/app';
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl border p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-0 mb-1">
            <span className="font-black text-3xl tracking-tight text-gray-900">auto</span>
            <span className="font-black text-3xl tracking-tight text-white bg-indigo-600 px-2 py-0.5 rounded-lg ml-0.5">gtm</span>
          </div>
          <p className="text-gray-500 mt-1 text-sm uppercase tracking-wider">
            {isRecovery ? 'Set new password' : showForgotPassword ? 'Reset your password' : isSigningUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {isRecovery && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isSubmitting}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
                minLength={6}
              />
            </div>
            {errorMessage && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                {errorMessage}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )}

        {showForgotPassword && !isRecovery && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            {errorMessage && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                {errorMessage}
              </div>
            )}
            {forgotMessage && (
              <div className="text-green-700 text-sm bg-green-50 p-3 rounded-md border border-green-200">
                {forgotMessage}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setErrorMessage(''); setForgotMessage(''); }}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {!isRecovery && !showForgotPassword && isInviteValidated && isSigningUp && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
            <p className="text-sm text-green-800">
              Invite code accepted! Create your account below.
            </p>
          </div>
        )}

        {!isRecovery && !showForgotPassword && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isSigningUp ? 'Create Password' : 'Password'}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={isSigningUp ? 'Min 6 characters' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              minLength={6}
            />
          </div>

          {errorMessage && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
              {errorMessage}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? (isSigningUp ? 'Creating account...' : 'Signing in...')
              : (isSigningUp ? 'Create Account' : 'Sign In')
            }
          </Button>

          {!isSigningUp && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setErrorMessage(''); }}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Forgot password?
              </button>
            </div>
          )}
        </form>
        )}

        {!isRecovery && !showForgotPassword && (
        <div className="mt-6 flex flex-col items-center space-y-3">
          {!showInviteInput && !isSigningUp && (
            <button
              type="button"
              onClick={() => setShowInviteInput(true)}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Have an invite code?
            </button>
          )}

          {showInviteInput && !isInviteValidated && (
            <div className="w-full space-y-3">
              {inviteError && (
                <div className="text-xs text-center p-2 rounded bg-red-50 text-red-700">
                  {inviteError}
                </div>
              )}
              <Input
                type="text"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                disabled={isValidatingCode}
                maxLength={20}
                className="text-center"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleValidateInvite}
                disabled={isValidatingCode || !inviteCode}
              >
                {isValidatingCode ? 'Validating...' : 'Submit Code'}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteInput(false);
                    setInviteError(null);
                    setInviteCode('');
                  }}
                  className="text-sm text-gray-400 hover:text-gray-600 underline"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {isSigningUp && (
            <button
              type="button"
              onClick={() => {
                setIsSigningUp(false);
                setIsInviteValidated(false);
                setErrorMessage('');
              }}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
