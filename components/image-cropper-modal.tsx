'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, Minus, Plus } from 'lucide-react';

interface ImageCropperModalProps {
  image: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onClose: () => void;
}

export function ImageCropperModal({ image, onCropComplete, onClose }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: any) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      // Only set crossOrigin if it's not a local blob or data URL
      if (!url.startsWith('blob:') && !url.startsWith('data:')) {
        image.setAttribute('crossOrigin', 'anonymous');
      }
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // Set a max dimension for the profile picture to keep Base64 size reasonable for localStorage
    const MAX_DIMENSION = 300;
    let width = pixelCrop.width;
    let height = pixelCrop.height;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height);
      width *= scale;
      height *= scale;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      width,
      height
    );

    // Using slightly lower quality (0.7) to ensure it fits in localStorage
    return canvas.toDataURL('image/jpeg', 0.7);
  };

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background border border-border shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-border/40 flex items-center justify-between bg-secondary/50">
          <h3 className="font-bold text-lg text-foreground">Crop Profile Picture</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="relative h-80 bg-background/5">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="p-6 space-y-6 bg-secondary/30">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input 
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary h-1 bg-muted rounded-full appearance-none cursor-pointer"
              />
              <button 
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-muted-foreground border border-border/40 rounded-xl hover:bg-secondary transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-3 text-sm font-bold bg-foreground text-background rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
