'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { getVoteType, handleVote } from '@/lib/storage';

interface VoteControlProps {
  placeId: string;
  userId?: string;
  initialUpvotes: number;
  initialDownvotes: number;
  variant?: 'compact' | 'large';
}

export function VoteControl({ placeId, userId, initialUpvotes, initialDownvotes, variant = 'compact' }: VoteControlProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState(0);

  useEffect(() => {
    setUpvotes(initialUpvotes);
    setDownvotes(initialDownvotes);
  }, [initialUpvotes, initialDownvotes]);

  useEffect(() => {
    if (userId) {
      setUserVote(getVoteType(placeId, userId));
    }
  }, [placeId, userId]);

  const onVote = async (e: React.MouseEvent, type: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userId) {
      return;
    }

    const oldVote = userVote;
    const newVote = handleVote(placeId, userId, type);
    
    // Update local UI state
    let nextUp = upvotes;
    let nextDown = downvotes;

    // Remove old effect
    if (oldVote === 1) nextUp--;
    if (oldVote === -1) nextDown--;
    
    // Add new effect
    if (newVote === 1) nextUp++;
    if (newVote === -1) nextDown++;

    setUpvotes(nextUp);
    setDownvotes(nextDown);
    setUserVote(newVote);
  };

  if (variant === 'large') {
    return (
      <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-3 rounded-2xl backdrop-blur-md shadow-2xl">
        <button
          onClick={(e) => onVote(e, 1)}
          className={`flex flex-col items-center gap-1 group p-3 rounded-xl transition-all duration-300 ${
            userVote === 1 
              ? 'bg-green-500/20 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.15)] border border-green-500/20' 
              : 'hover:bg-white/5 text-foreground/30 hover:text-foreground/60 border border-transparent'
          }`}
        >
          <ThumbsUp className={`w-7 h-7 transition-transform group-hover:-translate-y-1 ${userVote === 1 ? 'scale-110' : ''}`} />
          <span className="text-sm font-bold">{upvotes}</span>
        </button>
        
        <div className="w-px h-12 bg-white/5" />
        
        <button
          onClick={(e) => onVote(e, -1)}
          className={`flex flex-col items-center gap-1 group p-3 rounded-xl transition-all duration-300 ${
            userVote === -1 
              ? 'bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] border border-red-500/20' 
              : 'hover:bg-white/5 text-foreground/30 hover:text-foreground/60 border border-transparent'
          }`}
        >
          <ThumbsDown className={`w-7 h-7 transition-transform group-hover:translate-y-1 ${userVote === -1 ? 'scale-110' : ''}`} />
          <span className="text-sm font-bold">{downvotes}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white/[0.04] border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-sm group/vote hover:border-white/10 transition-colors">
      <button
        onClick={(e) => onVote(e, 1)}
        className={`flex items-center gap-1.5 transition-all duration-200 ${
          userVote === 1 
            ? 'text-green-500 scale-105' 
            : 'text-foreground/20 hover:text-foreground/50'
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold tabular-nums">{upvotes}</span>
      </button>
      
      <div className="w-[1px] h-3 bg-white/10" />
      
      <button
        onClick={(e) => onVote(e, -1)}
        className={`flex items-center gap-1.5 transition-all duration-200 ${
          userVote === -1 
            ? 'text-red-500 scale-105' 
            : 'text-foreground/20 hover:text-foreground/50'
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold tabular-nums">{downvotes}</span>
      </button>
    </div>
  );
}
