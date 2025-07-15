import React from 'react';
import { Button } from './ui/button';

interface GameCellProps {
  value: 'X' | 'O' | null;
  onClick: () => void;
  isWinning: boolean;
  disabled: boolean;
}

export function GameCell({ value, onClick, isWinning, disabled }: GameCellProps) {
  return (
    <Button
      variant="outline"
      className={`
        aspect-square h-full w-full p-0 text-2xl sm:text-4xl font-black border-2
        transition-all duration-300 hover:scale-[1.02] active:scale-95
        bg-gradient-to-br from-card via-card to-primary/5
        border-primary/20 hover:border-primary/40
        ${isWinning ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-primary shadow-lg ring-4 ring-primary/30' : ''}
        ${value ? 'cursor-default' : 'hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5'}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        rounded-xl shadow-sm hover:shadow-md
        min-h-[60px] sm:min-h-[80px] touch-manipulation
      `}
      onClick={onClick}
      disabled={disabled || !!value}
    >
      {value && (
        <span 
          className={`
            animate-in zoom-in-50 duration-300
            ${value === 'X' ? 'text-red-500 drop-shadow-lg' : 'text-blue-500 drop-shadow-lg'}
            ${isWinning ? 'animate-pulse scale-110' : ''}
          `}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}
        >
          {value}
        </span>
      )}
    </Button>
  );
}