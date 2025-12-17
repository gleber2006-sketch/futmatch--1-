import React, { useState } from 'react';

interface TeamLogoProps {
    logoUrl: string | null;
    teamName: string;
    size?: 'small' | 'default' | 'large';
    className?: string;
}

const TeamLogo: React.FC<TeamLogoProps> = ({ logoUrl, teamName, size = 'default', className = '' }) => {
    const [imageError, setImageError] = useState(false);

    // Get team initials (first 2-3 letters)
    const getTeamInitials = (name: string): string => {
        const words = name.trim().split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Size classes
    const sizeClasses = {
        small: 'h-8 w-8 text-xs',
        default: 'h-12 w-12 text-sm',
        large: 'h-16 w-16 text-base'
    };

    const sizeClass = sizeClasses[size];

    // If no logo or image failed to load, show fallback
    if (!logoUrl || imageError) {
        return (
            <div
                className={`${sizeClass} rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white font-bold ring-2 ring-gray-800 flex-shrink-0 ${className}`}
                title={teamName}
            >
                {getTeamInitials(teamName)}
            </div>
        );
    }

    // Show team logo
    return (
        <div className={`${sizeClass} rounded-full overflow-hidden ring-2 ring-gray-800 flex-shrink-0 ${className}`}>
            <img
                src={logoUrl}
                alt={teamName}
                title={teamName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
            />
        </div>
    );
};

export default TeamLogo;
