import React from 'react';

interface ProfileImageProps {
  imageUrl?: string | null;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  imageUrl,
  firstName,
  lastName,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  
  // Construct the image URL
  const imageSource = imageUrl && imageUrl.startsWith('/uploads/') 
    ? `http://localhost:5000${imageUrl}`
    : imageUrl;

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium relative overflow-hidden ${className}`}>
      {imageSource ? (
        <img
          src={imageSource}
          alt={`${firstName} ${lastName}`}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Hide the image and show initials on error
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      <span className={`${imageSource ? 'absolute' : ''} font-medium text-gray-600`}>
        {initials}
      </span>
    </div>
  );
};