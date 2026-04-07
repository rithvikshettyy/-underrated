'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  MapPin, 
  Search, 
  Filter,
  Eye,
  LayoutDashboard,
  ShieldHalf,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { getAllPlaces, updatePlace, deletePlace, getCurrentUser } from '@/lib/storage';
import { Header } from '@/components/header';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'published'>('pending');
  const [stats, setStats] = useState({ total: 0, pending: 0, published: 0 });

  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const currentUser = await getCurrentUser();
      
      // Simple hardcoded check or check for admin metadata
      // For this demo, let's allow access if the user is logged in
      // In production, we'd check for user.user_metadata?.role === 'admin'
      if (!currentUser) {
        router.push('/auth/login?next=/admin');
        return;
      }

      setUser(currentUser);
      refreshPlaces();
    };

    checkAdmin();
  }, []);

  const refreshPlaces = () => {
    const all = getAllPlaces(true);
    setPlaces(all);
    setStats({
      total: all.length,
      pending: all.filter(p => p.status === 'pending').length,
      published: all.filter(p => p.status === 'published').length
    });
    setLoading(false);
  };

  const handleApprove = (id: string) => {
    updatePlace(id, { status: 'published' });
    refreshPlaces();
  };

  const handleReject = (id: string) => {
    // For now, rejecting moves back to pending or we can delete
    // Let's just update a mock rejected status or just delete for content moderation
    if (confirm('Are you sure you want to delete this content?')) {
      deletePlace(id);
      refreshPlaces();
    }
  };

  const filteredPlaces = places.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
           <p className="text-foreground/40 text-sm font-medium tracking-widest uppercase">Initializing Secure View</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-foreground">
      <Header user={user} variant="page" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-accent text-xs font-bold tracking-widest uppercase mb-1">
              <ShieldHalf className="w-3 h-3" />
              Content Management Console
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-foreground/50">Oversee community submissions and maintain content quality.</p>
          </div>
          
          <div className="flex gap-3">
             <div className="px-5 py-3 bg-secondary/20 border border-white/5 rounded-xl text-center min-w-[100px]">
                <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mb-1">Pending</p>
                <p className="text-xl font-bold text-amber-500">{stats.pending}</p>
             </div>
             <div className="px-5 py-3 bg-secondary/20 border border-white/5 rounded-xl text-center min-w-[100px]">
                <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mb-1">Active</p>
                <p className="text-xl font-bold text-green-500">{stats.published}</p>
             </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
           <div className="relative flex-1 group">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-accent transition-colors" />
             <input 
               type="text" 
               placeholder="Search places or cities..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-secondary/20 border border-white/5 hover:border-white/10 focus:border-accent/40 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
             />
           </div>
           
           <div className="flex bg-secondary/20 border border-white/5 p-1 rounded-xl">
             {[
               { id: 'pending', label: 'Pending Review' },
               { id: 'published', label: 'Published' },
               { id: 'all', label: 'All' }
             ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFilterStatus(opt.id as any)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${filterStatus === opt.id ? 'bg-white text-black' : 'text-foreground/40 hover:text-foreground'}`}
                >
                  {opt.label}
                </button>
             ))}
           </div>
        </div>

        {/* Content Table */}
        <div className="bg-secondary/10 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          {filteredPlaces.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
               <LayoutDashboard className="w-10 h-10 text-foreground/10" />
               <p className="text-foreground/30 font-medium italic">No places found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground/40">Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground/40">Submitter</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground/40">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground/40">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground/40 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPlaces.map((place) => (
                    <tr key={place.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-4">
                            {place.image_urls?.[0] ? (
                               <img src={place.image_urls[0]} className="w-12 h-12 rounded-lg object-cover border border-white/10" alt="" />
                            ) : (
                               <div className="w-12 h-12 rounded-lg bg-secondary/30 border border-white/5 flex items-center justify-center">
                                  <MapPin className="w-4 h-4 text-foreground/20" />
                               </div>
                            )}
                            <div>
                               <p className="font-bold text-sm tracking-tight group-hover:text-accent transition-colors">{place.title}</p>
                               <p className="text-xs text-foreground/40 flex items-center gap-1 mt-0.5 capitalize">
                                  {place.city} · <span className="opacity-60">{place.category}</span>
                               </p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <p className="text-sm font-medium">{place.username}</p>
                         <p className="text-[10px] text-foreground/30 font-mono lower">{place.user_id}</p>
                      </td>
                      <td className="px-6 py-5">
                         {place.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20 rounded-md">
                               <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                               In Review
                            </span>
                         ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20 rounded-md">
                               <CheckCircle2 className="w-3 h-3" />
                               Active
                            </span>
                         )}
                      </td>
                      <td className="px-6 py-5 text-sm text-foreground/40 font-medium">
                         {new Date(place.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                         <div className="flex items-center justify-end gap-2">
                            <Link href={`/places/${place.id}`}>
                               <button className="p-2 bg-secondary/20 hover:bg-secondary/40 text-foreground/60 hover:text-foreground rounded-lg transition-all border border-white/5">
                                  <Eye className="w-4 h-4" />
                               </button>
                            </Link>
                            
                            {place.status === 'pending' && (
                               <button 
                                 onClick={() => handleApprove(place.id)}
                                 className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-all border border-green-500/10"
                                 title="Approve Submission"
                               >
                                  <CheckCircle2 className="w-4 h-4" />
                               </button>
                            )}
                            
                            <button 
                              onClick={() => handleReject(place.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all border border-red-500/10 group/del"
                              title="Delete Submission"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Verification Info */}
        <div className="mt-8 p-5 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-4">
           <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
           <div>
              <p className="text-sm font-bold text-accent mb-1 uppercase tracking-widest">Moderator Note</p>
              <p className="text-xs text-foreground/60 leading-relaxed max-w-2xl">
                 Published content is immediately visible to the public. Rejection should be used for spam, inaccurate locations, or content that doesn't meet the "Underrated" criteria. Use the eye icon to view full details including word counts and underrated explanations before approving.
              </p>
           </div>
        </div>
      </main>
    </div>
  );
}
