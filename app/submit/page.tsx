'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, AlertCircle, Info, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUser, setCurrentUser, addPlace, initializeSampleData } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';

const CATEGORIES = [
  { value: 'eat', label: 'Eat - Restaurants, Cafes, Food' },
  { value: 'chill', label: 'Chill - Quiet spots, Parks, Reading' },
  { value: 'hangout', label: 'Hangout - Bars, Clubs, Social' },
];

export default function SubmitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    underrated_reason: '',
    category: 'eat' as string,
    city: '',
  });

  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    initializeSampleData();
    setUser(getCurrentUser());

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const localUser = {
           id: session.user.id,
           email: session.user.email || '',
           username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Explorer',
        };
        setUser(localUser);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

    // Word count validation
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

    if (imagePreviews.length > 5) {
      setError('You can only upload a maximum of 5 photos.');
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const res = addPlace({
        title: formData.title,
        description: formData.description,
        underrated_reason: formData.underrated_reason,
        category: formData.category as 'eat' | 'chill' | 'hangout',
        city: formData.city,
        image_urls: imagePreviews,
        user_id: user.id,
        username: user.username,
        upvote_count: 0,
      });

      if (res.status === 'pending') {
        alert('Thank you! Since this is one of your first posts, it has been sent to our community verification queue. It will appear on the site once approved!');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to submit place');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} variant="page" />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground smooth-transition mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Discover
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">Share a Hidden Gem</h1>
            <p className="text-foreground/50 leading-relaxed">
              We only accept high-quality, thoughtful contributions. Help your fellow explorers find the best of the best.
            </p>
          </div>

          {/* Guidelines info */}
          <div className="p-4 bg-secondary/30 rounded-xl border border-border/60 flex gap-3 text-sm text-foreground/60 leading-relaxed">
            <Info className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-foreground/80">Submission Guidelines</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Description must be 50–1000 words.</li>
                <li>Explain specifically why this place is underrated.</li>
                <li>First 3 posts require community verification.</li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* Place Title */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold tracking-tight text-foreground/80">Place Name *</label>
              <Input
                type="text"
                placeholder="e.g., The Secret Rooftop, Old Mumbai Chai Stall"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-card border-white/10 hover:border-white/20 focus-visible:border-accent/50 focus-visible:ring-accent/20 h-11 px-4 placeholder:text-foreground/30 transition-all duration-200"
              />
            </div>

            {/* City */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold tracking-tight text-foreground/80">City *</label>
              <Input
                type="text"
                placeholder="e.g., Bengaluru, Goa, Pune"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                className="bg-card border-white/10 hover:border-white/20 focus-visible:border-accent/50 focus-visible:ring-accent/20 h-11 px-4 placeholder:text-foreground/30 transition-all duration-200"
              />
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold tracking-tight text-foreground/80">Vibe *</label>
              <div className="grid grid-cols-1 gap-2">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.value}
                    className={`flex items-center p-4 border rounded-xl cursor-pointer smooth-transition ${formData.category === cat.value
                        ? 'border-accent bg-accent/5 ring-1 ring-accent'
                        : 'border-border/60 hover:border-foreground/30 hover:bg-secondary/20'
                      }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={formData.category === cat.value}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-4 h-4 text-accent border-border"
                    />
                    <span className="ml-3 font-medium text-sm text-foreground/80">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold tracking-tight text-foreground/80">
                  Full Description *
                </label>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${wordCount >= 30 && wordCount <= 1000 ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-foreground/40'}`}>
                  {wordCount} words
                </span>
              </div>
              <textarea
                placeholder="Why is this place special? Describe the ambiance, the food or vibes, and any hidden details only a local would know. Lazy spam will not clear our minimum word count."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                rows={8}
                className="w-full px-4 py-3 bg-card border border-white/10 hover:border-white/20 rounded-xl text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition resize-none min-h-[160px] placeholder:text-foreground/20"
              />
              <p className="text-[11px] text-foreground/40 font-medium">Minimum 30 words required. Detailed posts help the community.</p>
            </div>

            {/* What makes it underrated */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold tracking-tight text-foreground/80 lowercase">
                What makes this underrated? *
              </label>
              <textarea
                placeholder="Explain why this place isn't mainstream. Is it the location? The zero marketing? The unassuming facade?"
                value={formData.underrated_reason}
                onChange={(e) =>
                  setFormData({ ...formData, underrated_reason: e.target.value })
                }
                required
                rows={3}
                className="w-full px-4 py-3 bg-card border border-white/10 hover:border-white/20 rounded-xl text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition resize-none placeholder:text-foreground/20"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold tracking-tight text-foreground/80 lowercase">
                Visual Proof (2-5 photos required) *
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-border/40">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {imagePreviews.length < 5 && (
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border/40 rounded-xl cursor-pointer hover:border-accent group bg-secondary/10 smooth-transition overflow-hidden">
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mb-1 group-hover:scale-110 smooth-transition">
                        <svg className="w-4 h-4 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-medium text-foreground/60 leading-tight">Add photo</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-[11px] text-foreground/40 font-medium lowercase">Please upload between 2 and 5 clear photos of the place.</p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 disabled:opacity-50 smooth-transition active:scale-[0.98]"
              >
                {loading ? 'Submitting...' : 'Propose Gem'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 h-12 border border-border text-sm font-semibold rounded-xl hover:bg-secondary/40 smooth-transition text-foreground/60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
