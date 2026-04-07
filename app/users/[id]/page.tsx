'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  User as UserIcon,
  Calendar,
  Instagram,
  Linkedin,
  Globe,
  Youtube,
  Music2,
  ArrowUpRight,
  Trash2,
  Plus,
  Bookmark
} from 'lucide-react';
import { Header } from '@/components/header';
import { useTheme } from 'next-themes';
import { 
  getAllPlaces, 
  getCurrentUser, 
  deletePlace, 
  getSavedPlaces, 
  toggleSavePlace, 
  isPlaceSaved,
  type User
} from '@/lib/storage';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'shared' | 'saved'>('shared');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const isOwner = currentUser?.id === userId;

  useEffect(() => {
    setMounted(true);
    const fetchData = () => {
      const allPlaces = getAllPlaces(true);
      const userPlaces = allPlaces.filter(p => p.user_id === userId);
      setPlaces(userPlaces);

      const saved = getSavedPlaces(userId);
      setSavedPlaces(saved);

      let currUser = getCurrentUser();

      // Force current date if date is old/missing for demo purposes
      if (currUser && (currUser.id === userId) && (!currUser.created_at || currUser.created_at === '2023-07-01')) {
        currUser = { ...currUser, created_at: new Date().toISOString() };
      }

      setCurrentUser(currUser);

      // Smart resolution: check if it's 'me' by ID or username
      const isMe = currUser && (currUser.id === userId || currUser.username === userId);
      
      if (isMe) {
        setUser(currUser);
      } else if (userPlaces.length > 0) {
        // Find if any existing place suggests this user's identity
        const targetPlace = userPlaces[0];
        setUser({
          id: targetPlace.user_id,
          username: targetPlace.username,
          created_at: targetPlace.created_at || new Date().toISOString(),
          email: ''
        } as User);
      } else {
        // Final fallback for missing users
        setUser({
          id: userId,
          username: 'User',
          created_at: new Date().toISOString()
        } as User);
      }
      setLoading(false);
    };

    fetchData();

    const handleStorageChange = () => {
      fetchData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [userId, router]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm('Are you sure you want to delete this gem? This action cannot be undone.')) {
      deletePlace(id);
      setPlaces(places.filter(p => p.id !== id));
    }
  };

  const handleToggleSave = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    
    toggleSavePlace(currentUser.id, id);
    setSavedPlaces(getSavedPlaces(userId));
  };

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse font-bold tracking-widest text-[10px] uppercase">Loading profile...</div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.first_name || 'Rithvik Shetty';
  const username = user?.user_metadata?.username || 'rithvikshetty';

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 selection:bg-primary/10 overflow-x-hidden">
      <Header user={currentUser} variant="page" />

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Profile Info Section same as before... */}
        <div className="flex flex-col items-center sm:items-start sm:flex-row gap-8 mb-12">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-secondary shadow-2xl bg-secondary flex items-center justify-center flex-shrink-0">
            {user?.avatar_url ? (
               <img 
                 src={user.avatar_url} 
                 alt={displayName} 
                 className="w-full h-full object-cover"
               />
            ) : (
                <UserIcon className="w-16 h-16 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{displayName}</h1>
              <p className="text-muted-foreground text-lg mt-1 group">
                @{username}
              </p>
            </div>

            <p className="text-foreground/80 text-lg max-w-xl leading-relaxed">
              {user?.user_metadata?.bio || "Heyy! I'm an struggling engineer trying to cope up with llms"}
            </p>

            <div className="flex flex-col gap-4 text-muted-foreground">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                <Calendar className="w-4 h-4 opacity-60 text-muted-foreground" />
                Joined {user?.created_at
                  ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(user.created_at))
                  : new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())
                }
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-lg font-black tracking-tight">{places.length}</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Places</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-lg font-black tracking-tight">{savedPlaces.length}</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Saved</span>
                </div>
              </div>
            </div>

            {/* Social Icons - Fully Dynamic Logic */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
              {user?.user_metadata?.socials && Object.entries(user.user_metadata.socials).map(([platform, handle]) => {
                if (!handle) return null;
                
                const socialConfig: Record<string, { icon: any, color: string, url: string }> = {
                  instagram: { icon: Instagram, color: 'hover:text-[#E1306C]', url: `https://instagram.com/${handle}` },
                  linkedin: { icon: Linkedin, color: 'hover:text-[#0077b5]', url: `https://linkedin.com/in/${handle}` },
                  twitter: { icon: () => <span className="text-sm font-bold">𝕏</span>, color: 'hover:text-foreground', url: `https://x.com/${handle}` },
                  youtube: { icon: Youtube, color: 'hover:text-[#FF0000]', url: `https://youtube.com/@${handle}` },
                  tiktok: { icon: Music2, color: 'hover:text-[#00f2ea]', url: `https://tiktok.com/@${handle}` },
                  website: { icon: Globe, color: 'hover:text-primary', url: String(handle).startsWith('http') ? String(handle) : `https://${handle}` }
                };

                const config = socialConfig[platform];
                if (!config) return null;
                const Icon = config.icon;

                return (
                  <Link 
                    key={platform}
                    href={config.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground ${config.color} hover:bg-secondary transition-all active:scale-90`}
                    title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
              
              {/* Fallback check for missing socials */}
              {(!user?.user_metadata?.socials || Object.entries(user.user_metadata.socials).filter(([_, h]) => !!h).length === 0) && (
                 <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40 italic">No social links added</p>
              )}
            </div>
          </div>
        </div>

        {/* Tab System System System System Section */}
        <div className="border-b border-border/40 mb-12">
          <div className="flex gap-10">
            <button 
              onClick={() => setActiveTab('shared')}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                activeTab === 'shared' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Shared Gems
              {activeTab === 'shared' && (
                <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-foreground animate-in slide-in-from-left-full duration-300" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('saved')}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                activeTab === 'saved' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Saved Collection
              {activeTab === 'saved' && (
                <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-foreground animate-in slide-in-from-right-full duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">
                {activeTab === 'shared' ? 'My Contributions' : 'My Curated Collection'}
              </h2>
              <p className="text-xs text-[#a1a1aa] font-medium uppercase tracking-widest leading-none">
                {(activeTab === 'shared' ? places : savedPlaces).length} Total Places
              </p>
            </div>
            
            {activeTab === 'shared' && isOwner && (
              <Link href="/dashboard">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white/90 smooth-transition active:scale-95">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  Propose New Gem
                </button>
              </Link>
            )}
          </div>

          {(activeTab === 'shared' ? places : savedPlaces).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#09090b]">
              <div className="relative mb-10 group">
                <div className="w-32 h-32 bg-[#18181b] rounded-3xl flex items-center justify-center border border-[#27272a] shadow-inner">
                  <div className="grid grid-cols-2 gap-2 p-4 w-full h-full opacity-20 transition-opacity">
                    <div className="bg-white rounded-lg" />
                    <div className="bg-white rounded-lg flex items-center justify-center text-[#18181b] font-black text-xl">0</div>
                    <div className="bg-white rounded-lg" />
                    <div className="bg-white rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  {activeTab === 'shared' ? 'No Gems Shared' : 'No Gems Saved'}
                </h2>
                <p className="text-[#a1a1aa] text-lg max-w-sm mx-auto leading-relaxed">
                  {activeTab === 'shared' 
                    ? `${displayName} has no public contributions at this time.` 
                    : `You haven't bookmarked any favorite places yet.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {(activeTab === 'shared' ? places : savedPlaces).map((place) => (
                <Link key={place.id} href={`/places/${place.id}`} className="group block">
                  <div className="bg-[#18181b] border border-[#27272a] rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300 h-full flex flex-col relative">
                    {/* Actions Toolbar */}
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                       {isOwner && activeTab === 'shared' && (
                         <button 
                           onClick={(e) => handleDelete(e, place.id)}
                           className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:text-red-500 hover:bg-red-500/10 border border-white/10 smooth-transition"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       )}
                       
                       <button 
                          onClick={(e) => handleToggleSave(e, place.id)}
                          className={`p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 smooth-transition 
                            ${isPlaceSaved(currentUser?.id || '', place.id) ? 'text-accent border-accent/20 bg-accent/5' : 'text-white hover:text-accent'}
                          `}
                       >
                          <Bookmark className={`w-3.5 h-3.5 ${isPlaceSaved(currentUser?.id || '', place.id) ? 'fill-current' : ''}`} />
                       </button>
                    </div>

                    {/* Image Gallery Preview */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                      <img
                        src={place.image_urls?.[0] || '/placeholder-gem.jpg'}
                        alt={place.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                          {place.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors leading-tight">
                            {place.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa]">
                          <MapPin className="w-3 h-3" />
                          {place.city}
                        </div>
                      </div>

                      <p className="text-sm text-[#a1a1aa] line-clamp-2 leading-relaxed">
                        {place.description}
                      </p>

                      <div className="mt-auto pt-4 border-t border-[#27272a] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-bold text-white">{place.upvotes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ArrowUpRight className="w-4 h-4 text-red-500 rotate-90" />
                            <span className="text-xs font-bold text-white">{place.downvotes || 0}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-accent uppercase tracking-widest group-hover:translate-x-1 smooth-transition">
                          Explore Gem →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
