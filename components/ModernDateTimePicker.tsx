import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModernDateTimePickerProps {
    selectedDate: Date | null;
    onDateChange: (date: Date) => void;
    selectedTime: string;
    onTimeChange: (time: string) => void;
}

const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00',
    '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
];

const ModernDateTimePicker: React.FC<ModernDateTimePickerProps> = ({
    selectedDate,
    onDateChange,
    selectedTime,
    onTimeChange,
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const today = startOfDay(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: ptBR });
        const endDate = endOfWeek(monthEnd, { locale: ptBR });

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const currentDay = day;
                const isDisabled = isBefore(currentDay, today);
                const isSelected = selectedDate && isSameDay(currentDay, selectedDate);
                const isCurrentMonth = isSameMonth(currentDay, monthStart);
                const isTodayDate = isToday(currentDay);

                days.push(
                    <button
                        key={day.toString()}
                        type="button"
                        onClick={() => !isDisabled && onDateChange(currentDay)}
                        disabled={isDisabled}
                        className={`
              aspect-square p-2 rounded-lg text-sm font-medium transition-all
              ${isDisabled ? 'text-gray-600 cursor-not-allowed opacity-40' : 'cursor-pointer'}
              ${!isCurrentMonth && !isDisabled ? 'text-gray-500' : ''}
              ${isSelected ? 'bg-green-600 text-white shadow-lg scale-105' : ''}
              ${!isSelected && !isDisabled && isCurrentMonth ? 'hover:bg-gray-700 text-white' : ''}
              ${isTodayDate && !isSelected ? 'ring-2 ring-green-500 ring-opacity-50' : ''}
            `}
                    >
                        {format(currentDay, 'd')}
                    </button>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day.toString()} className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            );
            days = [];
        }

        return <div className="space-y-1">{rows}</div>;
    };

    return (
        <div className="space-y-6">
            {/* Calendar Section */}
            <div className="bg-gray-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <span className="text-xl text-white">←</span>
                    </button>
                    <h3 className="text-lg font-bold text-white capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h3>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <span className="text-xl text-white">→</span>
                    </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-400 p-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                {renderCalendar()}
            </div>

            {/* Time Selection Section */}
            {selectedDate && (
                <div className="bg-gray-800 rounded-2xl p-4 shadow-xl animate-fade-in">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">
                        Escolha o horário para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map(time => (
                            <button
                                key={time}
                                type="button"
                                onClick={() => onTimeChange(time)}
                                className={`
                  py-3 px-4 rounded-xl text-base font-bold transition-all
                  ${selectedTime === time
                                        ? 'bg-green-600 text-white shadow-lg scale-105'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-102'
                                    }
                `}
                            >
                                {time}
                            </button>
                        ))}
                    </div>

                    {/* Custom time option */}
                    <div className="mt-3 pt-3 border-t border-gray-700">
                        <label className="block text-xs text-gray-400 mb-2">Ou escolha outro horário:</label>
                        <input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => onTimeChange(e.target.value)}
                            className="w-full bg-gray-700 text-white p-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Selection Summary */}
            {selectedDate && selectedTime && (
                <div className="bg-green-600/20 border border-green-600/50 rounded-xl p-4 animate-fade-in">
                    <div className="flex items-center gap-2 text-green-400">
                        <span className="text-2xl">✓</span>
                        <div>
                            <p className="font-semibold">Agendamento confirmado</p>
                            <p className="text-sm">
                                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModernDateTimePicker;
