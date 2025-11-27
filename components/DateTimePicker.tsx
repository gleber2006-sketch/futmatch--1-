import React from 'react';
import { format, parseISO } from 'date-fns';

interface DateTimePickerProps {
    selectedDate: Date | null;
    onDateChange: (date: Date) => void;
    selectedTime: string;
    onTimeChange: (time: string) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
    selectedDate,
    onDateChange,
    selectedTime,
    onTimeChange,
}) => {
    const inputValue = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            const newDate = parseISO(e.target.value);
            onDateChange(newDate);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Data</label>
                <input
                    type="date"
                    value={inputValue}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Horário</label>
                <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    required
                />
            </div>
        </div>
    );
};

export default DateTimePicker;
