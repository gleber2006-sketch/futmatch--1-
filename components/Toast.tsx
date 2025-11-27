import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, duration = 2000 }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none">
            <div className="bg-gray-800/90 text-white px-6 py-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 animate-bounce-slight">
                <span className="text-sm font-medium">{message}</span>
            </div>
        </div>
    );
};

export default Toast;
