'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Settings as SettingsIcon, 
  Instagram, 
  LogOut, 
  User, 
  Camera,
  AtSign,
  Youtube,
  Twitter,
  Music2,
  ChevronRight,
  Shield,
  CreditCard,
  Check,
  ArrowUp,
  Linkedin,
  Globe,
  Plus,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { getCurrentUser } from '@/lib/storage';
import { ImageCropperModal } from '@/components/image-cropper-modal';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';

// Helper to convert base64 to Blob
const base64ToBlob = (base64: string) => {
  const byteString = atob(base64.split(',')[1]);
  const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string>("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80");
  const [activeTab, setActiveTab] = useState<'account' | 'preferences'>('account');
  const [loading, setLoading] = useState(true);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: 'Rithvik',
    lastName: 'Shetty',
    username: 'rithvikshetty',
    bio: "Heyy! I'm an struggling engineer trying to cope up with llms",
    socials: {
      instagram: 'r1thv1k7',
      twitter: '',
      youtube: '',
      tiktok: '',
      linkedin: 'rithvikshetty',
      website: 'rithvikshetty.in'
    }
  });

  useEffect(() => {
    setMounted(true);
    const user = getCurrentUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setCurrentUser(user);
    if (user.avatar_url) {
      setProfileImage(user.avatar_url);
    }
    
    // Populate form data from user metadata
    const metadata = user.user_metadata;
    if (metadata) {
      setFormData(prev => ({
        ...prev,
        firstName: metadata.first_name || prev.firstName,
        lastName: metadata.last_name || prev.lastName,
        username: user.username || prev.username,
        bio: metadata.bio || prev.bio,
        socials: {
          ...prev.socials,
          ...metadata.socials
        }
      }));
    }
    
    setLoading(false);
  }, [router]);

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    const supabase = createClient();
    let finalAvatarUrl = profileImage;

    try {
      // 1. If it's a new cropped image (base64), upload it to Supabase Storage
      if (profileImage.startsWith('data:image')) {
        const blob = base64ToBlob(profileImage);
        const fileName = `avatars/${currentUser.id}-${Date.now()}.jpg`;
        
        // Ensure bucket exists or handle missing bucket gracefully (usually 'avatars' is created in dashboard)
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.warn('Storage upload failed, falling back to Base64 in metadata (check if avatars bucket exists):', uploadError);
          // If upload fails (e.g. no bucket), we stay with Base64 but try to update Auth Metadata
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
            
          finalAvatarUrl = publicUrl;
        }
      }

      // 2. Prepare the updated user object
      const updatedUser = {
        ...currentUser,
        username: formData.username,
        avatar_url: finalAvatarUrl,
        user_metadata: {
          ...currentUser?.user_metadata,
          first_name: formData.firstName,
          last_name: formData.lastName,
          bio: formData.bio,
          socials: formData.socials
        }
      };

      // 3. Save to Supabase Auth Metadata (The real database)
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          avatar_url: finalAvatarUrl,
          bio: formData.bio,
          socials: formData.socials
        }
      });

      if (updateError) throw updateError;

      // 4. Update local state and storage for instant UI updates
      const storageMod = await import('@/lib/storage');
      storageMod.setCurrentUser(updatedUser);
      setCurrentUser(updatedUser);
      setProfileImage(finalAvatarUrl);

      // Trigger a storage event to alert other components like Header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
      
      alert('Profile saved to database successfully!');
    } catch (error: any) {
      console.error('Failed to save to database:', error);
      alert(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse font-bold tracking-widest text-[10px] uppercase">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10 overflow-x-hidden transition-colors duration-500">
      <Header user={currentUser} variant="page" />
      
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Settings</h1>
          
          {/* Tabs */}
          <div className="flex gap-6 border-b border-border/40">
            <button 
              onClick={() => setActiveTab('account')}
              className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all relative ${
                activeTab === 'account' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Account
              {activeTab === 'account' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-foreground" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('preferences')}
              className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all relative ${
                activeTab === 'preferences' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Preferences
              {activeTab === 'preferences' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-foreground" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 items-start">
          <div className="space-y-8">
            {activeTab === 'account' && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">Your Profile</h2>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Manage your identity across the platform.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  {/* First Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">First Name</label>
                    <input 
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-secondary/50 border border-border/40 rounded-lg px-3.5 py-2.5 text-sm focus:border-primary/20 focus:outline-none transition-all text-foreground"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Name</label>
                    <input 
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-secondary/50 border border-border/40 rounded-lg px-3.5 py-2.5 text-sm focus:border-primary/20 focus:outline-none transition-all text-foreground"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Username</label>
                    <div className="flex w-full items-stretch overflow-hidden rounded-lg border border-border/40 bg-secondary/50 focus-within:border-primary/20 transition-all">
                      <div className="bg-secondary px-3.5 flex items-center text-sm text-muted-foreground font-medium border-r border-border/40">@</div>
                      <input 
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="w-full bg-transparent px-3.5 py-2.5 text-sm focus:outline-none text-foreground"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bio</label>
                    <textarea 
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      rows={2}
                      className="w-full bg-secondary/50 border border-border/40 rounded-lg px-3.5 py-2.5 text-sm focus:border-primary/20 focus:outline-none transition-all resize-none text-foreground"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Social Links</label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Instagram */}
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex w-full items-stretch overflow-hidden rounded-lg border border-border/40 bg-secondary/50 focus-within:border-primary/20 transition-all">
                          <div className="bg-secondary px-2.5 flex items-center text-[10px] text-muted-foreground/60 border-r border-border/40">instagram.com/</div>
                          <input 
                            type="text"
                            value={formData.socials.instagram}
                            onChange={(e) => setFormData({...formData, socials: {...formData.socials, instagram: e.target.value}})}
                            placeholder="username"
                            className="w-full bg-transparent px-2.5 py-2.5 text-sm focus:outline-none text-foreground"
                          />
                        </div>
                      </div>

                      {/* Twitter */}
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-muted-foreground">𝕏</span>
                        </div>
                        <div className="flex w-full items-stretch overflow-hidden rounded-lg border border-border/40 bg-secondary/50 focus-within:border-primary/20 transition-all">
                          <div className="bg-secondary px-2.5 flex items-center text-[10px] text-muted-foreground/60 border-r border-border/40">x.com/</div>
                          <input 
                            type="text"
                            value={formData.socials.twitter}
                            onChange={(e) => setFormData({...formData, socials: {...formData.socials, twitter: e.target.value}})}
                            placeholder="username"
                            className="w-full bg-transparent px-2.5 py-2.5 text-sm focus:outline-none text-foreground"
                          />
                        </div>
                      </div>

                      {/* YouTube */}
                      <div className="flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex w-full items-stretch overflow-hidden rounded-lg border border-border/40 bg-secondary/50 focus-within:border-primary/20 transition-all">
                          <div className="bg-secondary px-2.5 flex items-center text-[10px] text-muted-foreground/60 border-r border-border/40">youtube.com/@</div>
                          <input 
                            type="text"
                            value={formData.socials.youtube}
                            onChange={(e) => setFormData({...formData, socials: {...formData.socials, youtube: e.target.value}})}
                            placeholder="username"
                            className="w-full bg-transparent px-2.5 py-2.5 text-sm focus:outline-none text-foreground"
                          />
                        </div>
                      </div>

                      {/* TikTok */}
                      <div className="flex items-center gap-2">
                        <Music2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex w-full items-stretch overflow-hidden rounded-lg border border-border/40 bg-secondary/50 focus-within:border-primary/20 transition-all">
                          <div className="bg-secondary px-2.5 flex items-center text-[10px] text-muted-foreground/60 border-r border-border/40">tiktok.com/@</div>
                          <input 
                            type="text"
                            value={formData.socials.tiktok}
                            onChange={(e) => setFormData({...formData, socials: {...formData.socials, tiktok: e.target.value}})}
                            placeholder="username"
                            className="w-full bg-transparent px-2.5 py-2.5 text-sm focus:outline-none text-foreground"
                          />
                        </div>
                      </div>

                      {/* LinkedIn */}
                      <div className="flex items-center gap-2">
                        <Linkedin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex w-full items-stretch overflow-hidden rounded-lg border border-border/40 bg-secondary/50 focus-within:border-primary/20 transition-all">
                          <div className="bg-secondary px-2.5 flex items-center text-[10px] text-muted-foreground/60 border-r border-border/40">linkedin.com/in/</div>
                          <input 
                            type="text"
                            value={formData.socials.linkedin}
                            onChange={(e) => setFormData({...formData, socials: {...formData.socials, linkedin: e.target.value}})}
                            placeholder="username"
                            className="w-full bg-transparent px-2.5 py-2.5 text-sm focus:outline-none text-foreground"
                          />
                        </div>
                      </div>

                      {/* Website */}
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex w-full items-stretch overflow-hidden rounded-lg border border-border/40 bg-secondary/50 focus-within:border-primary/20 transition-all">
                          <input 
                            type="text"
                            value={formData.socials.website}
                            onChange={(e) => setFormData({...formData, socials: {...formData.socials, website: e.target.value}})}
                            placeholder="https://yoursite.com"
                            className="w-full bg-transparent px-3 py-2.5 text-sm focus:outline-none text-foreground"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Discrete Save Button */}
                    <div className="pt-4">
                      <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Section */}
                <div className="pt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Emails</h2>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-[10px] font-bold transition-all border border-border/40">
                      <Plus className="w-3 h-3" />
                      Add Email
                    </button>
                  </div>
                  <p className="text-xs text-[#a1a1aa] font-medium -mt-2">Control where you receive event invites.</p>
                  
                  <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 group flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm">rithvikshetty2004@gmail.com</span>
                        <span className="px-1.5 py-0.5 bg-[#27272a] text-[#a1a1aa] text-[9px] font-bold rounded uppercase tracking-widest">Primary</span>
                      </div>
                      <p className="text-[11px] text-[#71717a] font-medium transition-colors group-hover:text-amber-500/80">Used for registration and host communication.</p>
                    </div>
                    <button className="text-[#a1a1aa] hover:text-white p-1">
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-0.5 rounded-full bg-current" />
                        <div className="w-0.5 h-0.5 rounded-full bg-current" />
                        <div className="w-0.5 h-0.5 rounded-full bg-current" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Phone Number Section */}
                <div className="pt-8 space-y-4">
                  <h2 className="text-lg font-bold tracking-tight">Phone Number</h2>
                  <p className="text-xs text-[#a1a1aa] font-medium -mt-2">Used for sign-in and SMS updates.</p>

                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-1 bg-amber-500/10 rounded-md shrink-0">
                      <div className="w-3.5 h-3.5 border border-amber-500 rounded-full flex items-center justify-center text-[9px] font-black text-amber-500">!</div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-amber-500/90">Unsubscribed from messages.</p>
                      <p className="text-[11px] text-amber-500/60 leading-relaxed">
                         WhatsApp <span className="font-bold">START</span> to <span className="font-bold">+1 415 212 6297</span>.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm">
                        +91 98338 75297
                      </div>
                      <button className="px-4 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-lg text-xs font-bold transition-all">
                        Update
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete Account Section */}
                <div className="pt-16 pb-6 space-y-4">
                  <h2 className="text-lg font-bold tracking-tight">Delete Account</h2>
                  <p className="text-xs text-[#a1a1aa] font-medium -mt-2">Permanently remove your account and all data.</p>
                  <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Delete My Account
                  </button>
                </div>
              </section>
            )}

            {activeTab === 'preferences' && (
              <section className="space-y-12">
                {/* Display Section */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white">Display</h2>
                    <p className="text-xs text-[#a1a1aa] font-medium mt-0.5">Choose your desired underrated interface.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* System */}
                    <button 
                      onClick={() => setTheme('system')}
                      className={`text-left group/card transition-all ${theme === 'system' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <div className={`relative aspect-[16/9] rounded-xl border-2 overflow-hidden bg-[#1c1c1f] transition-all ${theme === 'system' ? 'border-white/40 shadow-xl' : 'border-white/10 group-hover/card:border-white/20'}`}>
                         <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 to-blue-500/20" />
                         <div className="absolute bottom-4 right-4 text-[8px] font-black uppercase tracking-tighter opacity-20">System</div>
                      </div>
                      <div className={`mt-3 flex items-center justify-between bg-secondary border rounded-xl p-3.5 transition-all ${theme === 'system' ? 'border-primary/20' : 'border-border/40'}`}>
                        <span className={`text-xs font-bold ${theme === 'system' ? 'text-foreground' : 'text-muted-foreground'}`}>System</span>
                        {theme === 'system' && (
                          <div className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center animate-in zoom-in-50 duration-300">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Light */}
                    <button 
                      onClick={() => setTheme('light')}
                      className={`text-left group/card transition-all ${theme === 'light' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <div className={`relative aspect-[16/9] rounded-xl border-2 overflow-hidden bg-[#f8fafc] transition-all ${theme === 'light' ? 'border-amber-500/40 shadow-xl shadow-amber-500/5' : 'border-white/10 group-hover/card:border-white/20'}`}>
                         <div className="absolute bottom-4 right-4 text-[8px] font-black uppercase tracking-tighter text-black/20">Light</div>
                      </div>
                      <div className={`mt-3 flex items-center justify-between bg-secondary border rounded-xl p-3.5 transition-all ${theme === 'light' ? 'border-primary/20' : 'border-border/40'}`}>
                        <span className={`text-xs font-bold ${theme === 'light' ? 'text-foreground' : 'text-muted-foreground'}`}>Light</span>
                        {theme === 'light' && (
                          <div className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center animate-in zoom-in-50 duration-300">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Dark */}
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`text-left group/card transition-all ${theme === 'dark' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <div className={`relative aspect-[16/9] rounded-xl border-2 overflow-hidden bg-black transition-all ${theme === 'dark' ? 'border-white/40 shadow-xl shadow-white/5' : 'border-white/10 group-hover/card:border-white/20'}`}>
                         <div className="absolute bottom-4 right-4 text-[8px] font-black uppercase tracking-tighter opacity-20">Dark</div>
                      </div>
                      <div className={`mt-3 flex items-center justify-between bg-secondary border rounded-xl p-3.5 transition-all ${theme === 'dark' ? 'border-primary/20' : 'border-border/40'}`}>
                        <span className={`text-xs font-bold ${theme === 'dark' ? 'text-foreground' : 'text-muted-foreground'}`}>Dark</span>
                        {theme === 'dark' && (
                          <div className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center animate-in zoom-in-50 duration-300">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Language Section */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold tracking-tight text-muted-foreground uppercase tracking-widest text-[10px]">Language</h2>
                  <div className="relative w-full max-w-xs group">
                    <select className="w-full bg-secondary border border-border/40 rounded-xl px-4 py-3 text-sm appearance-none focus:border-primary/20 focus:outline-none transition-all cursor-pointer text-foreground">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Profile Picture Sidebar */}
          <aside className="space-y-6 pt-6 lg:pt-0.5 lg:sticky lg:top-24 h-fit">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profile Picture</label>
              <div className="relative w-32 h-32 group/avatar">
                <input 
                   type="file" 
                   ref={fileInputRef}
                   className="hidden" 
                   accept="image/*"
                   onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       setTempImage(URL.createObjectURL(file));
                       setShowCropper(true);
                       e.target.value = '';
                     }
                   }}
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full rounded-full overflow-hidden border border-border/40 bg-secondary group cursor-pointer relative shadow-xl"
                >
                  <img 
                    src={profileImage} 
                    alt="Profile"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-black/10 dark:bg-black/40 group-hover:bg-black/0 transition-colors" />
                </div>
                {/* Crop Button Overlay */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempImage(profileImage);
                    setShowCropper(true);
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full z-10"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm bg-black/20 px-2 py-1 rounded-full border border-white/10">Crop</span>
                </button>
                {/* Upload Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 right-1 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 border-[3px] border-background z-20"
                >
                   <ArrowUp className="w-4 h-4 text-background" />
                </button>
              </div>
            </div>

            {/* Cropper Modal */}
            {showCropper && tempImage && (
              <ImageCropperModal 
                image={tempImage}
                onCropComplete={(croppedUrl) => setProfileImage(croppedUrl)}
                onClose={() => setShowCropper(false)}
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
