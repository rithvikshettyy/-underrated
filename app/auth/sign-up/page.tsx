'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Header } from '@/components/header';
import { getCurrentUser, setCurrentUser, initializeSampleData } from '@/lib/storage';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    initializeSampleData();
    setUser(getCurrentUser());
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;

      if (data?.user) {
        // Sync with legacy localStorage for compatibility across the app
        const user: any = {
           id: data.user.id,
           email: data.user.email,
           username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'Explorer',
        };
        setCurrentUser(user);
      }

      router.push('/auth/sign-up-success');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans antialiased">
      <Header user={user} variant="page" />
      
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <Card className="border-border/60 bg-card/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight text-white lowercase">create account</CardTitle>
              <CardDescription className="text-foreground/40 text-sm">
                Join our community of explorers sharing local gems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground/60 uppercase tracking-widest">Email Address</Label>
                   <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary/20 border-white/10 hover:border-white/20 focus-visible:border-accent/50 focus-visible:ring-accent/20 h-11 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" title="password" className="text-xs font-semibold text-foreground/60 uppercase tracking-widest">Password</Label>
                   <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary/20 border-white/10 hover:border-white/20 focus-visible:border-accent/50 focus-visible:ring-accent/20 h-11 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repeat-password" title="repeat password" className="text-xs font-semibold text-foreground/60 uppercase tracking-widest">Repeat Password</Label>
                   <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="bg-secondary/20 border-white/10 hover:border-white/20 focus-visible:border-accent/50 focus-visible:ring-accent/20 h-11 transition-all duration-200"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="terms" required className="border-border/60 data-[state=checked]:bg-accent data-[state=checked]:border-accent" />
                  <label htmlFor="terms" className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I agree to the <Link href="#" className="underline text-foreground/60">terms of service</Link>
                  </label>
                </div>

                {error && (
                   <p className="text-xs font-medium text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                     {error}
                   </p>
                )}
                <Button type="submit" className="w-full bg-white text-black font-bold h-11 hover:bg-neutral-200 smooth-transition active:scale-[0.98]" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Account'}
                </Button>
              </form>

              <OAuthButtons />

              <div className="pt-4 text-center text-xs text-foreground/40 font-medium tracking-tight">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-white hover:underline transition-colors decoration-accent underline-offset-4"
                >
                  Sign in instead
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
