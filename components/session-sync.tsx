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
          // Map metadata: Google uses 'avatar_url' and 'full_name' or 'name'
          const metadata = session.user.user_metadata || {};
          const googleAvatar = metadata.avatar_url || metadata.picture;
          const fullName = metadata.full_name || metadata.name || '';
          const firstName = fullName.split(' ')[0] || '';
          const lastName = fullName.split(' ').slice(1).join(' ') || '';

          setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            username: metadata.username || session.user.email?.split('@')[0] || 'Explorer',
            created_at: session.user.created_at || new Date().toISOString(),
            avatar_url: googleAvatar, // Automatically use Google profile picture initially
            user_metadata: {
              ...metadata,
              first_name: metadata.first_name || firstName,
              last_name: metadata.last_name || lastName,
            }
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
          const metadata = session.user.user_metadata || {};
          const googleAvatar = metadata.avatar_url || metadata.picture;
          const fullName = metadata.full_name || metadata.name || '';
          const firstName = fullName.split(' ')[0] || '';
          const lastName = fullName.split(' ').slice(1).join(' ') || '';

          setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            username: metadata.username || session.user.email?.split('@')[0] || 'Explorer',
            created_at: session.user.created_at || new Date().toISOString(),
            avatar_url: googleAvatar,
            user_metadata: {
              ...metadata,
              first_name: metadata.first_name || firstName,
              last_name: metadata.last_name || lastName,
            }
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
