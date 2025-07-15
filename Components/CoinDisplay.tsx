import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Coins, TrendingUp, Award, Star } from 'lucide-react';
import { coinService } from './CoinService';

interface CoinDisplayProps {
  variant?: 'badge' | 'full' | 'header';
  showRecentReward?: boolean;
  className?: string;
}

export function CoinDisplay({ 
  variant = 'badge', 
  showRecentReward = false,
  className = '' 
}: CoinDisplayProps) {
  const [coins, setCoins] = useState(coinService.getCoins());
  const [recentReward, setRecentReward] = useState<number | null>(null);
  const [animateIncrease, setAnimateIncrease] = useState(false);

  useEffect(() => {
    const handleCoinChange = (stats: any) => {
      const newCoins = stats.totalCoins;
      const oldCoins = coins;
      
      if (newCoins > oldCoins && showRecentReward) {
        const diff = newCoins - oldCoins;
        setRecentReward(diff);
        setAnimateIncrease(true);
        
        // Clear the reward display after animation
        setTimeout(() => {
          setRecentReward(null);
          setAnimateIncrease(false);
        }, 2000);
      }
      
      setCoins(newCoins);
    };

    coinService.addListener(handleCoinChange);
    return () => coinService.removeListener(handleCoinChange);
  }, [coins, showRecentReward]);

  if (variant === 'badge') {
    return (
      <div className={`relative ${className}`}>
        <Badge 
          variant="secondary" 
          className={`flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 transition-all duration-300 text-xs ${
            animateIncrease ? 'scale-110 shadow-lg' : ''
          }`}
        >
          <Coins className="h-3 sm:h-4 w-3 sm:w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="font-medium">{coins.toLocaleString()}</span>
        </Badge>
        
        {/* Recent reward animation */}
        {recentReward && (
          <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="animate-in slide-in-from-bottom-2 fade-in-0 duration-500 animate-out fade-out-0 slide-out-to-top-2 delay-1000">
              <Badge className="bg-green-500 text-white border-green-600 shadow-lg text-xs">
                +{recentReward} 🪙
              </Badge>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-1 sm:gap-2 ${className}`}>
        <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-800/30 border border-yellow-300 dark:border-yellow-700">
          <Coins className="h-3 sm:h-4 w-3 sm:w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="font-medium text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm">
            {coins.toLocaleString()}
          </span>
        </div>
        
        {recentReward && (
          <div className="animate-in slide-in-from-left-2 fade-in-0 duration-500 animate-out fade-out-0 slide-out-to-right-2 delay-1500">
            <Badge className="bg-green-500 text-white border-green-600 shadow-lg text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{recentReward}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  const stats = coinService.getStats();
  const milestones = coinService.getMilestones();
  const achievedMilestones = milestones.filter(m => m.achieved);

  return (
    <Card className={`border-yellow-200 dark:border-yellow-800 ${className}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {/* Coin Balance */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-800/30">
                <Coins className="h-5 sm:h-6 w-5 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-yellow-800 dark:text-yellow-200">
              {coins.toLocaleString()} Coins
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Total earned from {stats.totalWins} victories
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="font-medium text-sm sm:text-base">{stats.totalWins}</div>
              <div className="text-muted-foreground text-xs">Total Wins</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="font-medium text-sm sm:text-base">{achievedMilestones.length}/{milestones.length}</div>
              <div className="text-muted-foreground text-xs">Achievements</div>
            </div>
          </div>

          {/* Recent Achievements */}
          {achievedMilestones.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs sm:text-sm font-medium">
                <Award className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                Recent Achievements
              </div>
              <div className="space-y-1">
                {achievedMilestones.slice(0, 3).map((milestone, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs p-2 bg-primary/10 rounded-lg">
                    <Star className="h-3 w-3 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{milestone.title}</div>
                      <div className="text-muted-foreground truncate">{milestone.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent reward animation for full variant */}
          {recentReward && (
            <div className="text-center">
              <div className="animate-in zoom-in-50 fade-in-0 duration-500 animate-out fade-out-0 zoom-out-50 delay-1500">
                <Badge className="bg-green-500 text-white border-green-600 shadow-lg px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                  <Coins className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                  +{recentReward} coins earned!
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}