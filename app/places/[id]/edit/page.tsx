'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, AlertCircle, Info, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUser, getPlaceById, updatePlace } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';

const CATEGORIES = [
  { value: 'eat', label: 'Eat - Restaurants, Cafes, Food' },
  { value: 'chill', label: 'Chill - Quiet spots, Parks, Reading' },
  { value: 'hangout', label: 'Hangout - Bars, Clubs, Social' },
];

export default function EditPlacePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [wordCount, setWordCount] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    underrated_reason: '',
    category: 'eat' as string,
    city: '',
  });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);

      const place = getPlaceById(id);
      if (!place) {
        setError('Place not found');
        setLoading(false);
        return;
      }

      // Check if user is the owner
      if (!currentUser || (place.user_id !== currentUser.id)) {
        // In a real app we'd strictly enforce this. 
        // For this demo, we'll allow it if they are the author.
        if (place.user_id !== currentUser?.id) {
           router.push(`/places/${id}`);
           return;
        }
      }

      setFormData({
        title: place.title,
        description: place.description,
        underrated_reason: place.underrated_reason,
        category: place.category,
        city: place.city,
      });
      setImagePreviews(place.image_urls || []);
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [id, router]);

  useEffect(() => {
    const words = formData.description.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
  }, [formData.description]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (imagePreviews.length + files.length > 5) {
      setError('You can only upload up to 5 photos.');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (wordCount < 30 || wordCount > 1000) {
      setError(`Description must be between 30 and 1000 words. You currently have ${wordCount}.`);
      return;
    }

    if (!formData.underrated_reason.trim()) {
      setError('Please tell us what makes this place underrated.');
      return;
    }

    if (imagePreviews.length < 2) {
      setError('Please upload at least 2 photos of the place.');
      return;
    }

    setSaving(true);
    try {
      updatePlace(id, {
        title: formData.title,
        description: formData.description,
        underrated_reason: formData.underrated_reason,
        category: formData.category as any,
        city: formData.city,
        image_urls: imagePreviews,
      });

      router.push(`/places/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update place');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} variant="page" />

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <Link href={`/places/${id}`} className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground smooth-transition mb-4 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Cancel Editing
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">Edit Your Gem</h1>
            <p className="text-foreground/50 leading-relaxed">Modify your submission to keep the community updated.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <div className="space-y-3">
              <label className="block text-sm font-semibold tracking-tight text-foreground/80">Place Name *</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-card border-white/10 hover:border-white/20 px-4 h-11"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold tracking-tight text-foreground/80">City *</label>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                className="bg-card border-white/10 hover:border-white/20 px-4 h-11"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold tracking-tight text-foreground/80">Vibe *</label>
              <div className="grid grid-cols-1 gap-2">
                {CATEGORIES.map((cat) => (
                  <label key={cat.value} className={`flex items-center p-4 border rounded-xl cursor-pointer smooth-transition ${formData.category === cat.value ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border/60 hover:border-foreground/30'}`}>
                    <input type="radio" name="category" value={cat.value} checked={formData.category === cat.value} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-4 h-4 text-accent" />
                    <span className="ml-3 font-medium text-sm text-foreground/80">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold tracking-tight text-foreground/80">Full Description *</label>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${wordCount >= 30 && wordCount <= 1000 ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-foreground/40'}`}>
                  {wordCount} words
                </span>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={8}
                className="w-full px-4 py-3 bg-card border border-white/10 rounded-xl text-sm focus:outline-none focus:border-accent/50 min-h-[160px]"
              />
              <p className="text-[11px] text-foreground/40 font-medium">Minimum 30 words required.</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold tracking-tight text-foreground/80 lowercase">What makes this underrated? *</label>
              <textarea
                value={formData.underrated_reason}
                onChange={(e) => setFormData({ ...formData, underrated_reason: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-3 bg-card border border-white/10 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold tracking-tight text-foreground/80 lowercase">Visual Proof (2-5 photos) *</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-border/40">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 5 && (
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border/40 rounded-xl cursor-pointer hover:border-accent group bg-secondary/10">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mb-1 group-hover:scale-110 smooth-transition">
                      <svg className="w-4 h-4 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3"><AlertCircle className="w-4 h-4" />{error}</div>}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button type="submit" disabled={saving} className="flex-1 h-12 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => router.back()} className="px-8 h-12 border border-border text-sm font-semibold rounded-xl hover:bg-secondary/40 text-foreground/60">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
