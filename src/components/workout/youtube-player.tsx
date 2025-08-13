
"use client"

import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { Youtube } from 'lucide-react';

interface YouTubePlayerProps {
  url?: string;
}

function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function YouTubePlayer({ url }: YouTubePlayerProps) {
  if (!url) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg flex flex-col items-center justify-center text-muted-foreground">
        <Youtube className="h-16 w-16" />
        <p className="mt-4 font-semibold">Exercise Video</p>
        <p className="text-sm">Click the help icon for a form guide.</p>
      </div>
    );
  }
  
  const videoId = getYouTubeId(url);

  if (!videoId) {
      return (
        <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
            <p className="text-destructive">Invalid YouTube URL provided.</p>
        </div>
      )
  }

  return (
    <div className="w-full aspect-video">
      <iframe
        className="w-full h-full rounded-lg"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}
