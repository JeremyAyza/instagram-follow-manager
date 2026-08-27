import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface BadgeProps {
  type: 'verified' | 'creator';
}

export const Badge: React.FC<BadgeProps> = ({ type }) => {
  if (type === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
        <CheckCircle2 size={12} className="text-blue-400" />
        Verificado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
      <Sparkles size={12} className="text-purple-300" />
      Creador
    </span>
  );
};
