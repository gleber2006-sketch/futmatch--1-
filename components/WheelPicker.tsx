import React, { useRef, useEffect, useState } from 'react';

interface WheelPickerProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
}

const WheelPicker: React.FC<WheelPickerProps> = ({ options, value, onChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(options.indexOf(value));

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            const handleScroll = () => {
                const itemHeight = 50;
                const index = Math.round(container.scrollTop / itemHeight);
                if (index >= 0 && index < options.length && index !== selectedIndex) {
                    setSelectedIndex(index);
                    onChange(options[index]);
                }
            };

            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [options, onChange, selectedIndex]);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            const index = options.indexOf(value);
            if (index !== -1) {
                container.scrollTop = index * 50;
                setSelectedIndex(index);
            }
        }
    }, [value, options]);

    return (
        <div className="relative w-full h-[150px]">
            <div className="ios-picker-selection-overlay" />
            <div
                ref={containerRef}
                className="ios-picker-container scrollbar-hide"
            >
                {/* Espaçadores para permitir scroll do primeiro e último item para o centro */}
                <div className="h-[50px] shrink-0" />
                {options.map((option, idx) => (
                    <div
                        key={idx}
                        className={`ios-picker-item ${idx === selectedIndex ? 'selected' : ''}`}
                    >
                        {option}
                    </div>
                ))}
                <div className="h-[50px] shrink-0" />
            </div>
        </div>
    );
};

export default WheelPicker;
