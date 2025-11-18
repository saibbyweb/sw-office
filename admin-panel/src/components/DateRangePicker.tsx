import { useState, useRef, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { FiCalendar, FiX } from 'react-icons/fi';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export default function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDateRange = () => {
    if (!value?.from) return 'Select date range';
    if (!value.to) return format(value.from, 'MMM d, yyyy');
    return `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d, yyyy')}`;
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-700 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/60 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        <FiCalendar className="w-4 h-4 text-violet-600" />
        <span className="whitespace-nowrap">{formatDateRange()}</span>
        {value?.from && (
          <button
            onClick={handleClear}
            className="ml-1 p-0.5 hover:bg-white/60 rounded transition-colors"
            title="Clear selection"
          >
            <FiX className="w-3.5 h-3.5 text-gray-500" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-white/95 backdrop-blur-md rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/40 p-4">
          <style>{`
            .rdp {
              --rdp-cell-size: 36px;
              --rdp-accent-color: rgb(124 58 237);
              --rdp-background-color: rgba(124, 58, 237, 0.1);
              --rdp-accent-color-dark: rgb(109 40 217);
              --rdp-background-color-dark: rgba(109, 40, 217, 0.15);
              --rdp-outline: 2px solid var(--rdp-accent-color);
              --rdp-outline-selected: 2px solid var(--rdp-accent-color);
              margin: 0;
            }

            .rdp-months {
              justify-content: center;
            }

            .rdp-month {
              margin: 0;
            }

            .rdp-caption {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 0.5rem 0;
              margin-bottom: 0.5rem;
            }

            .rdp-caption_label {
              font-size: 0.95rem;
              font-weight: 600;
              color: rgb(55 65 81);
            }

            .rdp-nav {
              position: absolute;
              top: 0.5rem;
              display: flex;
              gap: 0.25rem;
            }

            .rdp-nav_button {
              width: 28px;
              height: 28px;
              border-radius: 6px;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .rdp-nav_button:hover {
              background-color: rgba(124, 58, 237, 0.1);
            }

            .rdp-nav_button_previous {
              left: 0.5rem;
            }

            .rdp-nav_button_next {
              right: 0.5rem;
            }

            .rdp-head_cell {
              font-size: 0.8rem;
              font-weight: 600;
              color: rgb(107 114 128);
              padding: 0.25rem;
            }

            .rdp-cell {
              padding: 1px;
            }

            .rdp-day {
              border-radius: 6px;
              font-size: 0.875rem;
              transition: all 0.15s;
              border: none;
            }

            .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_disabled) {
              background-color: rgba(124, 58, 237, 0.08);
              color: rgb(109 40 217);
            }

            .rdp-day_selected {
              background-color: rgb(124 58 237);
              color: white;
              font-weight: 500;
            }

            .rdp-day_selected:hover {
              background-color: rgb(109 40 217);
            }

            .rdp-day_range_middle {
              background-color: rgba(124, 58, 237, 0.12);
              color: rgb(55 65 81);
              border-radius: 0;
            }

            .rdp-day_range_start,
            .rdp-day_range_end {
              background-color: rgb(124 58 237);
              color: white;
            }

            .rdp-day_disabled {
              opacity: 0.3;
              cursor: not-allowed;
            }

            .rdp-day_today {
              font-weight: 600;
              color: rgb(124 58 237);
            }

            .rdp-day_today:not(.rdp-day_selected) {
              background-color: transparent;
            }
          `}</style>
          <DayPicker
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={1}
            disabled={{ after: new Date() }}
          />
        </div>
      )}
    </div>
  );
}
