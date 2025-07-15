import React from 'react';
import { Button } from './ui/button';
import { Avatar } from '../App';

interface AvatarSelectorProps {
  selectedAvatar: Avatar;
  onSelectAvatar: (avatar: Avatar) => void;
  size?: 'sm' | 'md' | 'lg';
}

const avatarEmojis: Record<Avatar, string> = {
  bear: '🐻',
  fox: '🦊',
  owl: '🦉',
  rabbit: '🐰',
  squirrel: '🐿️',
  deer: '🦌',
  cat: '🐱',
  dog: '🐶'
};

const avatarNames: Record<Avatar, string> = {
  bear: 'Bear',
  fox: 'Fox',
  owl: 'Owl',
  rabbit: 'Rabbit',
  squirrel: 'Squirrel',
  deer: 'Deer',
  cat: 'Cat',
  dog: 'Dog'
};

export function AvatarSelector({ selectedAvatar, onSelectAvatar, size = 'md' }: AvatarSelectorProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl'
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">Choose your avatar</p>
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(avatarEmojis) as Avatar[]).map((avatar) => (
          <Button
            key={avatar}
            variant={selectedAvatar === avatar ? 'default' : 'outline'}
            className={`
              ${sizeClasses[size]} p-0 hover:scale-105 transition-all duration-200
              ${selectedAvatar === avatar 
                ? 'bg-primary shadow-lg ring-2 ring-primary/50' 
                : 'hover:bg-primary/10 border-primary/20'
              }
            `}
            onClick={() => onSelectAvatar(avatar)}
            title={avatarNames[avatar]}
          >
            <span className="filter hover:brightness-110">
              {avatarEmojis[avatar]}
            </span>
          </Button>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Playing as {avatarNames[selectedAvatar]} {avatarEmojis[selectedAvatar]}
      </p>
    </div>
  );
}

export function AvatarDisplay({ avatar, size = 'md' }: { avatar: Avatar; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl'
  };

  return (
    <div className={`
      ${sizeClasses[size]} 
      bg-primary/10 rounded-full flex items-center justify-center
      border-2 border-primary/20
    `}>
      <span>{avatarEmojis[avatar]}</span>
    </div>
  );
}