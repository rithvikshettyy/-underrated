'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, User, Heart, PenLine } from 'lucide-react';
import { VoteControl } from '@/components/vote-control';

import { getPlaceById, getCurrentUser, initializeSampleData } from '@/lib/storage';

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [place, setPlace] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeSampleData();
    const fetchData = () => {
      const p = getPlaceById(id);
      setPlace(p);
      setCurrentUser(getCurrentUser());
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/60">Loading...</div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-foreground/60 mb-4">Place not found</p>
        <Link href="/discover">
          <Button>Back to Discover</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 glass border-b border-border z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight smooth-transition hover:text-accent">
            Underrated
          </Link>
          <div className="flex items-center gap-4">
            {currentUser?.id === place.user_id && (
              <Link
                href={`/places/${id}/edit`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg smooth-transition font-medium text-sm"
              >
                <PenLine className="w-4 h-4" />
                Edit
              </Link>
            )}
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground smooth-transition font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Image Gallery */}
          {place.image_urls && place.image_urls.length > 0 && (
            <div className="space-y-4">
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
                {place.image_urls.map((url: string, index: number) => (
                  <div key={index} className="flex-none w-[85%] sm:w-[70%] h-96 rounded-xl overflow-hidden border border-border shadow-lg shadow-accent/10 snap-center">
                    <img
                      src={url}
                      alt={`${place.title} - Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-1.5">
                {place.image_urls.map((_: any, i: number) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-border" />
                ))}
              </div>
            </div>
          )}

          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <h1 className="text-4xl font-bold">{place.title}</h1>
                <div className="flex items-center gap-6 text-foreground/60 flex-wrap">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {place.city}
                    {place.address && ` · ${place.address}`}
                  </span>
                  <span className="inline-block px-3 py-1 bg-secondary text-xs rounded capitalize">
                    {place.category}
                  </span>
                </div>
              </div>

              <VoteControl 
                placeId={place.id} 
                userId={currentUser?.id} 
                initialUpvotes={place.upvotes || 0} 
                initialDownvotes={place.downvotes || 0}
                variant="large" 
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">About This Place</h2>
            <p className="text-foreground/70 text-lg leading-relaxed whitespace-pre-wrap">
              {place.description}
            </p>
          </div>

          {/* Author */}
          <div className="border-t border-border pt-8">
            <h3 className="text-sm font-semibold text-foreground/60 mb-4">
              Shared by
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-6 h-6 text-foreground/60" />
                </div>
                <div>
                  <p className="font-medium">
                    {place.username || 'Anonymous'}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {new Date(place.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Link
                href={`/users/${place.user_id}`}
                className="text-accent hover:text-accent/80 transition"
              >
                View Profile
              </Link>
            </div>
          </div>

          {/* More Info */}
          <div className="grid grid-cols-2 gap-4 p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm text-foreground/60 mb-1">Upvotes</p>
                <p className="text-2xl font-bold text-green-500">{place.upvotes || 0}</p>
              </div>
              <div className="w-px h-10 bg-white/5" />
              <div>
                <p className="text-sm text-foreground/60 mb-1">Downvotes</p>
                <p className="text-2xl font-bold text-red-500">{place.downvotes || 0}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-1">Category</p>
              <p className="text-2xl font-bold capitalize">{place.category}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
