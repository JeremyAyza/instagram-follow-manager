import React from 'react';
import { Instagram, ChevronLeft, ChevronRight } from 'lucide-react';

interface FloatingWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({ isOpen, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`fixed top-24 right-0 z-[999998] flex items-center gap-2 py-2.5 px-3 rounded-l-2xl shadow-2xl transition-all duration-300 border border-r-0 cursor-pointer ${
        isOpen
          ? 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
          : 'bg-gradient-to-r from-pink-600 to-purple-600 border-pink-400/30 text-white hover:scale-105 shadow-pink-500/30'
      }`}
      title={isOpen ? 'Ocultar Panel' : 'Abrir Instagram Follow Manager'}
    >
      <div className="relative">
        <Instagram size={18} />
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-300"></span>
          </span>
        )}
      </div>

      <span className="text-xs font-bold hidden sm:inline">
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </span>
    </button>
  );
};
