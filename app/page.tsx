'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles, Utensils, Coffee, Users, Music, Compass } from 'lucide-react';
import { getAllPlaces, getCurrentUser, initializeSampleData } from '@/lib/storage';
import { VoteControl } from '@/components/vote-control';

const INDIAN_CITIES = [
  { name: 'Mumbai', emoji: '🌊', desc: 'City of Dreams' },
  { name: 'Bengaluru', emoji: '🌿', desc: 'Garden City' },
  { name: 'Delhi', emoji: '🏛️', desc: 'Heart of India' },
  { name: 'Goa', emoji: '🌴', desc: 'Sun & Shores' },
  { name: 'Pune', emoji: '🎓', desc: 'Oxford of the East' },
  { name: 'Hyderabad', emoji: '💎', desc: 'City of Pearls' },
  { name: 'Chennai', emoji: '🎵', desc: 'Gateway to the South' },
  { name: 'Jaipur', emoji: '🏰', desc: 'Pink City' },
];

const VIBES = [
  { key: 'eat', label: 'Eat', icon: Utensils, color: 'from-orange-500/20 to-amber-500/10 border-orange-500/20 text-orange-400' },
  { key: 'chill', label: 'Chill', icon: Coffee, color: 'from-sky-500/20 to-blue-500/10 border-sky-500/20 text-sky-400' },
  { key: 'hangout', label: 'Hangout', icon: Users, color: 'from-violet-500/20 to-purple-500/10 border-violet-500/20 text-violet-400' },
];

import { Header } from '@/components/header';

export default function Home() {
  const [places, setPlaces] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    initializeSampleData();
    const allPlaces = getAllPlaces()
      .sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)))
      .slice(0, 6);
    setPlaces(allPlaces);
    setUser(getCurrentUser());
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header user={user} />

      <main className="flex-1 pt-14">

        {/* Hero */}
        <section className="pt-20 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-secondary/80 border border-border/60 text-xs text-foreground/60 font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                India only · Crowd-sourced gems
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter leading-[1.05] text-balance mb-5">
                Discover places<br />worth visiting
              </h1>
              <p className="text-foreground/55 text-lg leading-relaxed max-w-lg mb-8 font-light">
                The best cafes, hidden parks, street food spots, and chillout corners across India — all added by locals who know.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-semibold rounded-lg hover:bg-foreground/90 smooth-transition"
                >
                  <Compass className="w-4 h-4" />
                  Start exploring
                </Link>
                {!user && (
                  <Link
                    href="/auth/sign-up"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-sm font-medium rounded-lg hover:bg-secondary/60 smooth-transition text-foreground/80"
                  >
                    Share a spot
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Browse by Vibe */}
        <section className="py-12 px-6 border-t border-border/40">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground/40">Browse by vibe</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {VIBES.map(({ key, label, icon: Icon, color }) => (
                <Link
                  key={key}
                  href={`/discover?category=${key}`}
                  className={`group flex items-center gap-4 p-5 rounded-xl border bg-gradient-to-br ${color} hover:scale-[1.02] smooth-transition`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      {key === 'eat' ? 'Local dhabas, cafes & more' : key === 'chill' ? 'Parks, rooftops & quiet spots' : 'Pubs, arcades & social spots'}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 smooth-transition" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Browse by City */}
        <section className="py-12 px-6 border-t border-border/40">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground/40">Browse by city</h2>
              <Link href="/discover" className="text-xs text-foreground/40 hover:text-foreground/70 smooth-transition flex items-center gap-1">
                All cities <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {INDIAN_CITIES.map((city) => (
                <Link
                  key={city.name}
                  href={`/discover?city=${city.name}`}
                  className="group p-4 rounded-xl border border-border/60 bg-card hover:border-foreground/20 hover:bg-secondary/40 smooth-transition"
                >
                  <div className="text-2xl mb-2">{city.emoji}</div>
                  <p className="font-semibold text-sm">{city.name}</p>
                  <p className="text-xs text-foreground/40 mt-0.5">{city.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Gems */}
        {places.length > 0 && (
          <section className="py-12 px-6 border-t border-border/40">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground/40">Trending this week</h2>
                <Link href="/discover" className="text-xs text-foreground/40 hover:text-foreground/70 smooth-transition flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {places.map((place: any) => (
                  <Link key={place.id} href={`/places/${place.id}`} className="group">
                    <div className="rounded-xl border border-border/60 bg-card overflow-hidden hover:border-foreground/20 smooth-transition h-full flex flex-col">
                      {place.image_urls && place.image_urls.length > 0 && (
                        <div className="w-full h-44 overflow-hidden bg-secondary">
                          <img
                            src={place.image_urls[0]}
                            alt={place.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        </div>
                      )}
                      <div className="p-4 flex flex-col gap-2 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm leading-snug group-hover:text-accent smooth-transition line-clamp-2">
                            {place.title}
                          </h3>
                          <div className="flex-shrink-0">
                            <VoteControl 
                              placeId={place.id} 
                              userId={user?.id} 
                              initialUpvotes={place.upvotes || 0} 
                              initialDownvotes={place.downvotes || 0}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-foreground/40 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {place.city}
                        </p>
                        <p className="text-xs text-foreground/55 line-clamp-2 flex-1">{place.description}</p>
                        <div className="pt-2 border-t border-border/40">
                          <span className="inline-block px-2 py-0.5 bg-secondary/70 text-xs rounded-full text-foreground/50 capitalize font-medium">
                            {place.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 px-6 border-t border-border/40">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-border/60 bg-secondary/30 px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Know a spot others don't?</h2>
                <p className="text-foreground/50 text-sm">Share it with the community. No sign-up friction.</p>
              </div>
              <Link
                href={user ? '/submit' : '/auth/sign-up'}
                className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-sm font-semibold rounded-lg hover:bg-foreground/90 smooth-transition"
              >
                Submit a gem
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-foreground/30">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground/40">underrated</span>
            <span>· © 2026</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground/60 transition">About</Link>
            <Link href="#" className="hover:text-foreground/60 transition">Privacy</Link>
            <Link href="#" className="hover:text-foreground/60 transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
