import React, { useState, useEffect } from 'react';

interface ProfileImageProps {
  imageUrl?: string | null;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onImageError?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base'
};

export function ProfileImage({ 
  imageUrl, 
  firstName, 
  lastName, 
  size = 'md', 
  className = '',
  onImageError
}: ProfileImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    
    if (imageUrl) {
      // Construct full URL if it's a relative path
      const fullUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `http://localhost:5000${imageUrl}?v=${Date.now()}`;
      
      console.log('ProfileImage: Loading image for', firstName, lastName, 'URL:', fullUrl);
      setImageSrc(fullUrl);
      
      // Preload image to check if it exists
      const img = new Image();
      img.onload = () => {
        console.log('ProfileImage: Successfully loaded image for', firstName, lastName);
        setImageLoaded(true);
        setImageError(false);
      };
      img.onerror = (error) => {
        console.error('ProfileImage: Failed to load image for', firstName, lastName, 'Error:', error);
        setImageError(true);
        setImageLoaded(false);
        onImageError?.();
      };
      img.src = fullUrl;
    } else {
      console.log('ProfileImage: No image URL for', firstName, lastName);
      setImageSrc(null);
    }
  }, [imageUrl, onImageError, firstName, lastName]);

  const initials = `${firstName[0] || ''}${lastName[0] || ''}`;

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium relative overflow-hidden ${className}`}>
      {imageSrc && !imageError && (
        <img
          src={imageSrc}
          alt={`${firstName} ${lastName}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
            onImageError?.();
          }}
        />
      )}
      <span className={`${imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        {initials}
      </span>
    </div>
  );
}