import React, { useState } from 'react';

interface ParticipantAvatarProps {
    photoUrl?: string | null;
    name: string;
    size?: 'small' | 'default';
    className?: string;
}

const ParticipantAvatar: React.FC<ParticipantAvatarProps> = ({
    photoUrl,
    name,
    size = 'default',
    className = ''
}) => {
    const [imageError, setImageError] = useState(false);

    // Get user initials (first 2 letters of first and last name)
    const getInitials = (fullName: string): string => {
        const words = fullName.trim().split(' ').filter(w => w.length > 0);
        if (words.length >= 2) {
            return (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }
        return fullName.substring(0, 2).toUpperCase();
    };

    // Size classes
    const sizeClasses = {
        small: 'h-6 w-6 text-[10px]',
        default: 'h-10 w-10 text-sm'
    };

    const sizeClass = sizeClasses[size];

    // If no photo or image failed to load, show fallback with initials
    if (!photoUrl || imageError) {
        return (
            <div
                className={`${sizeClass} rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold ring-2 ring-gray-800 flex-shrink-0 ${className}`}
                title={name}
            >
                {getInitials(name)}
            </div>
        );
    }

    // Show user photo
    return (
        <img
            src={photoUrl}
            alt={name}
            title={name}
            className={`${sizeClass} rounded-full ring-2 ring-gray-800 object-cover flex-shrink-0 ${className}`}
            onError={() => setImageError(true)}
            loading="lazy"
        />
    );
};

export default ParticipantAvatar;
