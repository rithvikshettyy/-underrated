'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MapPin, Search, X, Sparkles } from 'lucide-react';
import { getAllPlaces, getAllCities, getFilteredPlaces, initializeSampleData, getCurrentUser } from '@/lib/storage';
import { VoteControl } from '@/components/vote-control';
import { Header } from '@/components/header';

const CATEGORIES = ['eat', 'chill', 'hangout'];

export default function DiscoverPage() {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    initializeSampleData();
    setCities(getAllCities());
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    setLoading(true);
    const filtered = getFilteredPlaces({
      search: searchQuery,
      category: selectedCategory || undefined,
      city: selectedCity || undefined,
    }).sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)));
    setPlaces(filtered);
    setLoading(false);
  }, [selectedCategory, selectedCity, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} variant="page" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Explore underrated Gems</h1>
            <p className="text-foreground/60">
              Browse underrated places in your area
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <Input
                type="text"
                placeholder="Search places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setSelectedCategory(selectedCategory === cat ? null : cat)
                    }
                    className="capitalize"
                  >
                    {cat}
                  </Button>
                ))}
              </div>

              <div className="relative flex-1 sm:flex-none">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategory || selectedCity || searchQuery) && (
              <div className="flex flex-wrap gap-2">
                {selectedCategory && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/30 rounded-full text-sm">
                    <span className="capitalize">{selectedCategory}</span>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-foreground/60 hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {selectedCity && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/30 rounded-full text-sm">
                    <span>{selectedCity}</span>
                    <button
                      onClick={() => setSelectedCity('')}
                      className="text-foreground/60 hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {searchQuery && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/30 rounded-full text-sm">
                    <span>"{searchQuery}"</span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-foreground/60 hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-foreground/60">Loading places...</div>
              </div>
            ) : places.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-foreground/60 mb-4">No places found. Try adjusting your filters.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setSelectedCity('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {places.map((place) => (
                  <Link key={place.id} href={`/places/${place.id}`} className="group">
                    <div className="bg-card border border-border rounded-xl overflow-hidden card-hover h-full flex flex-col">
                      {place.image_urls && place.image_urls.length > 0 && (
                        <div className="w-full h-48 bg-secondary overflow-hidden">
                          <img
                            src={place.image_urls[0]}
                            alt={place.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                          />
                        </div>
                      )}
                      <div className="p-6 flex flex-col gap-3 flex-1">
                        <div>
                          <h3 className="text-lg font-semibold group-hover:text-accent smooth-transition line-clamp-2">
                            {place.title}
                          </h3>
                          <p className="text-sm text-foreground/60 flex items-center gap-1 mt-2">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {place.city}
                          </p>
                        </div>
                        <p className="text-sm text-foreground/70 flex-1 line-clamp-2">
                          {place.description}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <span className="inline-block px-3 py-1 bg-secondary/50 text-xs rounded-full text-foreground/70 capitalize font-medium">
                            {place.category}
                          </span>
                          <VoteControl 
                            placeId={place.id} 
                            userId={user?.id} 
                            initialUpvotes={place.upvotes || 0} 
                            initialDownvotes={place.downvotes || 0}
                          />
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
