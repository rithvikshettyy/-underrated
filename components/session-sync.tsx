'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUser, setCurrentUser } from '@/lib/storage';

export function SessionSync() {
  const supabase = createClient();

  useEffect(() => {
    const syncSession = async () => {
      // Check if we have a Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // If we have a session but NO local storage user, sync them
        const localUser = getCurrentUser();
        if (!localUser || localUser.id !== session.user.id) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Explorer',
          });
        }
      } else {
        // If NO session, clear local storage
        if (getCurrentUser()) {
          setCurrentUser(null);
        }
      }
    };

    syncSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Explorer',
          });
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
