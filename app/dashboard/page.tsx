'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2, LogOut, AlertCircle, PenLine, ThumbsUp, ThumbsDown, Plus } from 'lucide-react';
import { getCurrentUser, setCurrentUser, getUserPlaces, deletePlace } from '@/lib/storage';

import { Header } from '@/components/header';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      let currentUser = await getCurrentUser();

      // If missing from legacy localStorage, try to sync from Supabase session
      if (!currentUser) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          currentUser = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Explorer',
          };
          setCurrentUser(currentUser);
        }
      }

      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);
      setPlaces(await getUserPlaces(currentUser.id));
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleDeletePlace = async (placeId: string) => {
    if (!confirm('Are you sure you want to delete this place?')) return;

    setDeleting(placeId);
    try {
      const success = deletePlace(placeId);
      if (!success) throw new Error('Delete failed');

      setPlaces(places.filter((p) => p.id !== placeId));
    } catch (error) {
      console.error('Error deleting place:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} variant="page" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Dashboard</h1>
              <p className="text-foreground/60">
                Manage your shared places and view your contributions
              </p>
            </div>
            <Link href="/submit">
              <Button className="gap-2 bg-white text-black hover:bg-white/90 font-bold px-6 h-11 rounded-xl shadow-xl shadow-white/5 smooth-transition">
                <Plus className="w-4 h-4" />
                Propose New Gem
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-card border border-border rounded-lg">
              <p className="text-sm text-foreground/60 mb-2">Total Places</p>
              <p className="text-3xl font-bold">{places.length}</p>
            </div>
            <div className="p-6 bg-card border border-border rounded-lg">
              <p className="text-sm text-foreground/60 mb-2">Total Net Score</p>
              <p className="text-3xl font-bold">
                {places.reduce((sum, p) => sum + ((p.upvotes || 0) - (p.downvotes || 0)), 0)}
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-lg">
              <p className="text-sm text-foreground/60 mb-2">Member Since</p>
              <p className="text-sm font-medium">
                {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Places List */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Places</h2>
            {places.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <p className="text-foreground/60 mb-4">You haven&apos;t shared any places yet.</p>
                <Link href="/submit">
                  <Button>Share Your First Gem</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {places.map((place) => (
                  <Link key={place.id} href={`/places/${place.id}`}>
                    <div className="p-6 bg-card border border-border rounded-lg hover:border-accent/50 transition group cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold group-hover:text-accent transition">
                            {place.title}
                          </h3>
                          <p className="text-sm text-foreground/60 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {place.city}
                          </p>
                          <p className="text-sm text-foreground/70 mt-2 line-clamp-2">
                            {place.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                             <span className="inline-block px-2 py-1 bg-secondary text-[11px] rounded capitalize font-bold tracking-tight">
                               {place.category}
                             </span>
                             {place.status === 'pending' ? (
                               <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-500 text-[11px] rounded font-bold uppercase tracking-widest border border-amber-500/20">
                                 <AlertCircle className="w-3 h-3" />
                                 Pending Review
                               </span>
                             ) : (
                               <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-[11px] rounded font-bold uppercase tracking-widest border border-green-500/20">
                                 Published
                               </span>
                             )}
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-green-500 font-bold text-[11px]">
                                <ThumbsUp className="w-3.5 h-3.5" />
                                {place.upvotes || 0}
                              </span>
                              <span className="flex items-center gap-1 text-red-500 font-bold text-[11px]">
                                <ThumbsDown className="w-3.5 h-3.5" />
                                {place.downvotes || 0}
                              </span>
                            </div>
                            <span className="text-[11px] text-foreground/40 font-medium">
                              {new Date(place.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/places/${place.id}/edit`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-3 h-9 bg-secondary hover:bg-secondary/80 text-foreground/70 rounded-lg smooth-transition text-xs font-semibold"
                          >
                            <PenLine className="w-3.5 h-3.5" />
                            Edit
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deleting === place.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeletePlace(place.id);
                            }}
                            className="gap-2 h-9 border-red-500/20 text-red-500 hover:bg-red-500/5 hover:border-red-500/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deleting === place.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
