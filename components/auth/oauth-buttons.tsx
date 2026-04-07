'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function OAuthButtons() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const supabase = createClient();

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setIsLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: process.env.NODE_ENV === 'production'
            ? 'https://underrated-ten.vercel.app/auth/callback'
            : `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-foreground/40">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={!!isLoading}
          onClick={() => handleOAuthSignIn('google')}
          className="bg-card border-border hover:bg-secondary/50 smooth-transition h-11"
        >
          {isLoading === 'google' ? (
            <span className="animate-spin mr-2">...</span>
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.01.69-2.29 1.1-3.71 1.1-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.87 14.17c-.22-.69-.35-1.43-.35-2.17s.13-1.48.35-2.17V7.01H2.18C1.43 8.51 1 10.21 1 12s.43 3.49 1.18 4.99l3.69-2.82z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.01l3.69 2.82c.86-2.59 3.28-4.51 6.13-4.51z"
                fill="#EA4335"
              />
            </svg>
          )}
          Google
        </Button>

        <Button
          variant="outline"
          type="button"
          disabled={!!isLoading}
          onClick={() => handleOAuthSignIn('apple')}
          className="bg-card border-border hover:bg-secondary/50 smooth-transition h-11"
        >
          {isLoading === 'apple' ? (
            <span className="animate-spin mr-2">...</span>
          ) : (
            <svg className="mr-2 h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.96.95-2.1 1.51-3.3 1.51-2.15 0-3.33-1.32-5.4-1.32-2.06 0-3.4 1.3-5.45 1.3-1.2 0-2.34-.56-3.3-1.51C-1.8 17.8-.5 11.4 3.76 11.4c1.23 0 2.24.47 3.06.47 1 0 1.63-.47 2.94-.47 1.25 0 2.37.47 3.24 1.5-1.12.63-2.1 1.84-2.1 3.56 0 2.05 1.5 3.1 2.15 3.82M12.03 7.25c0-2.8 2.25-5.07 5.04-5.07.13 0 .26.01.4.03C17.47 5.2 14.86 7.4 12.03 7.25M17.47 2.21c-.14-.02-.27-.03-.4-.03-2.79 0-5.04 2.27-5.04 5.07 2.83.15 5.44-2.05 5.44-5.04z" />
            </svg>
          )}
          Apple
        </Button>
      </div>
    </div>
  );
}
