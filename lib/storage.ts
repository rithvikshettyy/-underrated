// Types
export interface Place {
  id: string;
  title: string;
  description: string;
  underrated_reason: string;
  city: string;
  category: 'eat' | 'chill' | 'hangout';
  image_urls: string[];
  user_id: string;
  username: string;
  upvotes: number;
  downvotes: number;
  status: 'published' | 'pending';
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  avatar_url?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    bio?: string;
    socials?: {
      instagram?: string;
      twitter?: string;
      youtube?: string;
      tiktok?: string;
      linkedin?: string;
      website?: string;
    }
  }
}

// Storage key constants
const PLACES_KEY = 'hidden_gems_places';
const CURRENT_USER_KEY = 'hidden_gems_current_user';
const UPVOTES_KEY = 'hidden_gems_upvotes';
const SAVED_PLACES_KEY = 'hidden_gems_saved';

// User management
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function createUser(email: string, username: string): User {
  const user: User = {
    id: Math.random().toString(36).substring(2, 11),
    email,
    username,
    created_at: new Date().toISOString(),
  };
  setCurrentUser(user);
  return user;
}

export function signIn(email: string, username: string): User {
  return createUser(email, username);
}

export function signOut(): void {
  setCurrentUser(null);
}

// Place management
export function getAllPlaces(includePending = false): Place[] {
  if (typeof window === 'undefined') return [];
  const placesStr = localStorage.getItem(PLACES_KEY);
  const places: Place[] = placesStr ? JSON.parse(placesStr) : [];
  
  if (includePending) return places;
  return places.filter(p => p.status === 'published');
}

export function getPlaceById(id: string): Place | null {
  const places = getAllPlaces(true);
  return places.find(p => p.id === id) || null;
}

export function addPlace(place: Omit<Place, 'id' | 'created_at' | 'status'>): Place {
  const places = getAllPlaces(true);
  const userPostsCount = places.filter(p => p.user_id === place.user_id).length;
  
  // First 3 posts from a new account go into a pending queue
  const status = userPostsCount < 3 ? 'pending' : 'published';

  const newPlace: Place = {
    ...place,
    id: Math.random().toString(36).substring(2, 11),
    status,
    upvotes: 0,
    downvotes: 0,
    created_at: new Date().toISOString(),
  };

  places.push(newPlace);
  if (typeof window !== 'undefined') {
    localStorage.setItem(PLACES_KEY, JSON.stringify(places));
  }
  return newPlace;
}

export function updatePlace(id: string, updates: Partial<Place>): Place | null {
  const places = getAllPlaces(true);
  const index = places.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  places[index] = { ...places[index], ...updates };
  if (typeof window !== 'undefined') {
    localStorage.setItem(PLACES_KEY, JSON.stringify(places));
  }
  return places[index];
}

export function deletePlace(id: string): boolean {
  const places = getAllPlaces(true);
  const filtered = places.filter(p => p.id !== id);
  if (filtered.length === places.length) return false;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(PLACES_KEY, JSON.stringify(filtered));
  }
  return true;
}

export function getUserPlaces(userId: string): Place[] {
  return getAllPlaces(true)
    .filter(p => p.user_id === userId)
    .sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)));
}

export function getFilteredPlaces(filters: {
  search?: string;
  category?: string;
  city?: string;
}): Place[] {
  let places = getAllPlaces();
  
  if (filters.search) {
    const query = filters.search.toLowerCase();
    places = places.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }
  
  if (filters.category) {
    places = places.filter(p => p.category === filters.category);
  }
  
  if (filters.city) {
    places = places.filter(p => p.city === filters.city);
  }
  
  return places;
}

export function getAllCities(): string[] {
  const places = getAllPlaces();
  const cities = [...new Set(places.map(p => p.city))];
  return cities.sort();
}

// Upvote management
export function getVoteType(placeId: string, userId: string): number {
  if (typeof window === 'undefined') return 0;
  const votes = localStorage.getItem(UPVOTES_KEY);
  if (!votes) return 0;
  
  const voteMap = JSON.parse(votes);
  return voteMap[`${placeId}_${userId}`] || 0;
}

export function handleVote(placeId: string, userId: string, voteType: number): number {
  if (typeof window === 'undefined') return 0;
  
  const votesStr = localStorage.getItem(UPVOTES_KEY);
  const voteMap = votesStr ? JSON.parse(votesStr) : {};
  const key = `${placeId}_${userId}`;
  
  const oldVote = voteMap[key] || 0;
  const normalizedOldVote = oldVote === true ? 1 : oldVote;
  const newVote = normalizedOldVote === voteType ? 0 : voteType;
  
  if (newVote === 0) {
    delete voteMap[key];
  } else {
    voteMap[key] = newVote;
  }
  
  localStorage.setItem(UPVOTES_KEY, JSON.stringify(voteMap));
  
  const place = getPlaceById(placeId);
  if (place) {
    let newUp = place.upvotes || 0;
    let newDown = place.downvotes || 0;

    // Remove old effect
    if (normalizedOldVote === 1) newUp--;
    if (normalizedOldVote === -1) newDown--;
    
    // Add new effect
    if (newVote === 1) newUp++;
    if (newVote === -1) newDown++;

    updatePlace(placeId, { upvotes: newUp, downvotes: newDown });
  }
  
  return newVote;
}

// Saved places management
export function isPlaceSaved(userId: string, placeId: string): boolean {
  if (typeof window === 'undefined') return false;
  const savedStr = localStorage.getItem(SAVED_PLACES_KEY);
  if (!savedStr) return false;
  const savedMap = JSON.parse(savedStr);
  return !!savedMap[`${userId}_${placeId}`];
}

export function toggleSavePlace(userId: string, placeId: string): boolean {
  if (typeof window === 'undefined') return false;
  const savedStr = localStorage.getItem(SAVED_PLACES_KEY);
  const savedMap = savedStr ? JSON.parse(savedStr) : {};
  const key = `${userId}_${placeId}`;
  
  const newValue = !savedMap[key];
  if (newValue) {
    savedMap[key] = true;
  } else {
    delete savedMap[key];
  }
  
  localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(savedMap));
  return newValue;
}

export function getSavedPlaces(userId: string): Place[] {
  if (typeof window === 'undefined') return [];
  const savedStr = localStorage.getItem(SAVED_PLACES_KEY);
  if (!savedStr) return [];
  
  const savedMap = JSON.parse(savedStr);
  const allPlaces = getAllPlaces();
  
  return allPlaces.filter(place => savedMap[`${userId}_${place.id}`]);
}

// Initialize with sample data
export function initializeSampleData(): void {
  if (typeof window === 'undefined') return;
  
  const existingPlacesStr = localStorage.getItem(PLACES_KEY);
  if (existingPlacesStr) {
    const existing = JSON.parse(existingPlacesStr);
    const filtered = existing.filter((p: any) => p.id !== '1' && p.id !== '2');
    if (filtered.length !== existing.length) {
      localStorage.setItem(PLACES_KEY, JSON.stringify(filtered));
    }
    return;
  }
  
  const samplePlaces: Place[] = [];
  
  localStorage.setItem(PLACES_KEY, JSON.stringify(samplePlaces));
}
