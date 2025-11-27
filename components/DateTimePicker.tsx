import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, startOfToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    const [dates, setDates] = useState<Date[]>([]);
    const [showCustomTime, setShowCustomTime] = useState(false);

    useEffect(() => {
        const today = startOfToday();
        const nextDays = Array.from({ length: 14 }, (_, i) => addDays(today, i));
        setDates(nextDays);
    }, []);

    const handleDateClick = (date: Date) => {
        onDateChange(date);
    };

    const handleTimeClick = (time: string) => {
        onTimeChange(time);
        setShowCustomTime(false);
    };

    return (
        <div className="space-y-4">
            {/* Date Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Data</label>
                <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
                    {dates.map((date) => {
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());

                        return (
                            <button
                                key={date.toISOString()}
                                type="button"
                                onClick={() => handleDateClick(date)}
                                className={`
                  flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border transition-all
                  ${isSelected
                                        ? 'bg-green-600 border-green-500 text-white shadow-lg scale-105'
                                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                    }
                `}
                            >
                                <span className="text-xs font-medium uppercase">
                                    {isToday ? 'Hoje' : format(date, 'EEE', { locale: ptBR })}
                                </span>
                                <span className="text-xl font-bold">
                                    {format(date, 'd')}
                                </span>
                                <span className="text-xs opacity-75">
                                    {format(date, 'MMM', { locale: ptBR })}
                                </span>
                            </button>
                        );
                    })}
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
