'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight, Bell, User, Search, X, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  user?: any;
  variant?: 'home' | 'page';
}

function Clock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      };
      const timeString = now.toLocaleTimeString('en-US', options);
      const offset = -now.getTimezoneOffset();
      const hours = Math.floor(Math.abs(offset) / 60);
      const mins = Math.abs(offset) % 60;
      const gmt = `GMT${offset >= 0 ? '+' : '-'}${hours}:${mins.toString().padStart(2, '0')}`;

      setTime(`${timeString} ${gmt}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return <span className="text-[#a1a1aa] font-medium transition-colors hover:text-white cursor-default whitespace-nowrap">{time}</span>;
}

export function Header({ user, variant = 'home' }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync user state from storage and Supabase directly for absolute certainty
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    // 1. Initial resolution on mount
    const resolveUser = async () => {
      // Check Supabase first (source of truth)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setLocalUser({
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Explorer',
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          user_metadata: session.user.user_metadata
        });
      } else {
        // Fallback to localStorage
        const { getCurrentUser } = await import('@/lib/storage');
        setLocalUser(getCurrentUser());
      }
    };

    resolveUser();

    // 2. Local storage listener
    const handleStorageChange = () => {
      import('@/lib/storage').then(mod => {
        const updatedUser = mod.getCurrentUser();
        setLocalUser(updatedUser);
      });
    };

    // 3. Supabase Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setLocalUser({
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Explorer',
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          user_metadata: session.user.user_metadata
        });
      } else if (event === 'SIGNED_OUT') {
        setLocalUser(null);
      }
    });

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      subscription.unsubscribe();
    };
  }, []);

  // Click outside to close menus
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Close notifications if clicking outside
      if (showNotifications && !target.closest('.notifications-menu')) {
        setShowNotifications(false);
      }

      // Close profile menu if clicking outside
      if (showProfileMenu && !target.closest('.profile-menu')) {
        setShowProfileMenu(false);
      }
    };

    if (showNotifications || showProfileMenu) {
      document.addEventListener('mousedown', handleGlobalClick);
    }

    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [showNotifications, showProfileMenu]);

  const handleSignOut = async () => {
    try {
      // 1. Sign out from Supabase
      await supabase.auth.signOut();
      
      // 2. Clear local storage immediately for a snappy UI response
      const { setCurrentUser } = await import('@/lib/storage');
      setCurrentUser(null);
      
      // 3. Clear local state in the header
      setLocalUser(null);
      setShowProfileMenu(false);
      
      // 4. Force a hard refresh and redirect to ensure all states are reset
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
      // Fail-safe: at least redirect home
      window.location.href = '/';
    }
  };

  const notifications = [
    { id: 1, title: 'Gem Approved!', text: 'Your "Vibe Coffee" gem has been published.', time: '2m ago' },
    { id: 2, title: 'New Upvote', text: 'Someone liked your "Secret Garden" post.', time: '1h ago' },
    { id: 3, title: 'Content Update', text: 'System maintenance scheduled for tonight.', time: '5h ago' }
  ];

  return (
    <nav className={`${variant === 'home'
      ? 'fixed top-0 w-full z-50'
      : 'sticky top-0 z-40'
      } border-b border-border/40 bg-background/80 backdrop-blur-md transition-colors duration-500`}>
      <div className="max-w-6xl mx-auto px-6 h-[54px] flex items-center justify-between text-sm relative">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center group">
          <span className="font-bold tracking-tight text-foreground hover:text-primary transition-colors">Underrated</span>
        </Link>

        {/* Search Overlay */}
        {showSearch && (
          <div className="absolute inset-0 bg-background flex items-center px-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <Search className="w-5 h-5 text-[#a1a1aa] mr-4" />
            <input
              autoFocus
              type="text"
              placeholder="Search hidden gems, cities, categories..."
              className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-[#a1a1aa]/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setShowSearch(false)}
            />
            <button
              onClick={() => setShowSearch(false)}
              className="p-2 text-muted-foreground hover:text-foreground smooth-transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Right: Icons Cluster */}
        <div className="flex items-center gap-6">
          {!showSearch && (
            <div className="hidden md:flex items-center gap-6 border-r border-border/40 pr-6">
              <Clock />

              <Link
                href="/discover"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium smooth-transition"
              >
                Explore Events
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <div className="flex items-center gap-5 relative">
            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 smooth-transition"
            >
              <Search className="w-[18px] h-[18px] stroke-[1.5]" />
            </button>

            {localUser && (
              <div className="relative notifications-menu">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full relative text-muted-foreground hover:text-foreground hover:bg-secondary/80 smooth-transition"
                >
                  <Bell className="w-[18px] h-[18px] stroke-[1.5]" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-4 w-80 bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-border/40 flex items-center justify-between">
                      <span className="font-bold text-foreground">Notifications</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">3 New</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.map(notif => (
                        <div key={notif.id} className="p-4 hover:bg-secondary cursor-pointer border-b border-border/10 last:border-none smooth-transition">
                          <p className="text-xs font-bold text-foreground mb-1">{notif.title}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{notif.text}</p>
                          <span className="text-[10px] text-muted-foreground/40 mt-2 block">{notif.time}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-secondary/50 text-center border-t border-border/40">
                      <button className="text-[11px] font-bold text-primary hover:underline uppercase tracking-widest">Mark all as read</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {localUser ? (
              <div className="relative profile-menu">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full overflow-hidden border border-border/40 bg-secondary hover:border-border transition-all active:scale-95 smooth-transition"
                >
                  {localUser.avatar_url ? (
                    <img
                      src={localUser.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-[18px] h-[18px] text-muted-foreground" />
                  )}
                </button>

                {/* Profile Modal/Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-4 w-[240px] bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Dropdown Header */}
                    <div className="p-4 flex items-center gap-3 border-b border-border/40 bg-secondary/20">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
                        {localUser.avatar_url ? (
                          <img
                            src={localUser.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground leading-tight">
                          {localUser.user_metadata?.first_name || 'Rithvik Shetty'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          @{localUser.user_metadata?.username || 'rithvikshetty'}
                        </span>
                      </div>
                    </div>

                    {/* Menu List */}
                    <div className="p-1 space-y-0.5">
                      <Link
                        href={`/users/${localUser.id}`}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 w-full p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl smooth-transition group"
                      >
                        <User className="w-4 h-4 group-hover:text-primary transition-colors" />
                        View Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 w-full p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl smooth-transition group"
                      >
                        <SettingsIcon className="w-4 h-4 group-hover:text-primary transition-colors" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full p-3 text-sm text-[#ef4444] hover:bg-red-500/10 rounded-xl smooth-transition group text-left"
                      >
                        <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login">
                <button className="px-5 py-[6px] bg-foreground text-background rounded-full font-medium hover:opacity-90 smooth-transition">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
