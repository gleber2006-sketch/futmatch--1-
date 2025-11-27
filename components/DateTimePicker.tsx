import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';

interface DateTimePickerProps {
    selectedDate: Date | null;
    onDateChange: (date: Date) => void;
    selectedTime: string;
    onTimeChange: (time: string) => void;
}

const COMMON_TIMES = [
    '08:00', '09:00', '10:00', '14:00',
    '16:00', '18:00', '19:00', '19:30',
    '20:00', '20:30', '21:00', '22:00'
];

const DateTimePicker: React.FC<DateTimePickerProps> = ({
    selectedDate,
    onDateChange,
    selectedTime,
    onTimeChange,
}) => {
    const [showCustomTime, setShowCustomTime] = useState(false);

    const handleTimeClick = (time: string) => {
        onTimeChange(time);
        setShowCustomTime(false);
    };

    // Helper to safely format date for input value (YYYY-MM-DD)
    const inputValue = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            // Create date at noon to avoid timezone issues with simple date picking
            const newDate = parseISO(e.target.value);
            onDateChange(newDate);
        }
    };

    return (
        <div className="space-y-4">
            {/* Date Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Data</label>

                <div className="relative">
                    <input
                        type="date"
                        value={inputValue}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                    <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                        📅
                    </div>
                </div>
            </div>

            {/* Time Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Horário</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                    {COMMON_TIMES.map((time) => (
                        <button
                            key={time}
                            type="button"
                            onClick={() => handleTimeClick(time)}
                            className={`
                py-2 rounded-lg text-sm font-medium transition-all
                ${selectedTime === time
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }
              `}
                        >
                            {time}
                        </button>
                    ))}
                </div>

                {/* Custom Time Toggle/Input */}
                {!showCustomTime ? (
                    <button
                        type="button"
                        onClick={() => setShowCustomTime(true)}
                        className="text-sm text-green-400 hover:text-green-300 underline"
                    >
                        Outro horário...
                    </button>
                ) : (
                    <div className="flex items-center gap-2 animate-fade-in">
                        <input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => onTimeChange(e.target.value)}
                            className="bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DateTimePicker;
