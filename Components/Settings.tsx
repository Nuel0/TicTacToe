import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ArrowLeft, Moon, Sun, Volume2, VolumeX, Trophy, RotateCcw, Trash2, Award, TrendingUp } from 'lucide-react';
import { coinService } from './CoinService';
import { achievementService } from './AchievementService';

interface SettingsProps {
  isDarkMode: boolean;
  soundEnabled: boolean;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onBack: () => void;
  onViewAchievements?: () => void;
}

export function Settings({ 
  isDarkMode, 
  soundEnabled, 
  onToggleTheme, 
  onToggleSound, 
  onBack,
  onViewAchievements 
}: SettingsProps) {
  const [stats, setStats] = useState(coinService.getStats());
  const [achievementProgress, setAchievementProgress] = useState({ total: 0, unlocked: 0, percentage: 0 });
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);

  useEffect(() => {
    // Load achievement progress
    setAchievementProgress(achievementService.getProgress());
    
    // Get recent achievements (last 3 unlocked)
    const allAchievements = achievementService.getAllAchievements()
      .filter(a => a.unlocked)
      .sort((a, b) => {
        if (!a.unlockedAt || !b.unlockedAt) return 0;
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      })
      .slice(0, 3);
    
    setRecentAchievements(allAchievements);

    // Listen for updates
    const handleStatsUpdate = (newStats: any) => {
      setStats(newStats);
    };

    const handleAchievementUpdate = () => {
      setAchievementProgress(achievementService.getProgress());
      const recentAchievements = achievementService.getAllAchievements()
        .filter(a => a.unlocked)
        .sort((a, b) => {
          if (!a.unlockedAt || !b.unlockedAt) return 0;
          return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
        })
        .slice(0, 3);
      setRecentAchievements(recentAchievements);
    };

    coinService.addListener(handleStatsUpdate);
    achievementService.addListener(handleAchievementUpdate);

    return () => {
      coinService.removeListener(handleStatsUpdate);
      achievementService.removeListener(handleAchievementUpdate);
    };
  }, []);

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all game data? This cannot be undone.')) {
      coinService.resetStats();
      achievementService.resetStats();
      achievementService.resetAllAchievements();
      setStats(coinService.getStats());
      setAchievementProgress(achievementService.getProgress());
      setRecentAchievements([]);
    }
  };

  const resetAchievements = () => {
    if (window.confirm('Are you sure you want to reset all achievements? This cannot be undone.')) {
      achievementService.resetAllAchievements();
      setAchievementProgress(achievementService.getProgress());
      setRecentAchievements([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-20 sm:w-32 h-20 sm:h-32 bg-primary/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 sm:bottom-20 left-10 sm:left-20 w-24 sm:w-40 h-24 sm:h-40 bg-accent/30 rounded-full blur-xl"></div>
      </div>

      <div className="w-full max-w-md space-y-4 sm:space-y-6 relative z-10">
        {/* Header */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-primary/10 w-8 h-8 sm:w-10 sm:h-10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base sm:text-lg">Settings</CardTitle>
              <div className="w-8 sm:w-10" />
            </div>
          </CardHeader>
        </Card>

        {/* Settings */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Theme Setting */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
                <div>
                  <h3 className="text-sm sm:text-base font-medium">Dark Mode</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={onToggleTheme}
              />
            </div>

            {/* Sound Setting */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-primary" />
                ) : (
                  <VolumeX className="h-5 w-5 text-primary" />
                )}
                <div>
                  <h3 className="text-sm sm:text-base font-medium">Sound Effects</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Enable or disable game sounds
                  </p>
                </div>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={onToggleSound}
              />
            </div>
          </CardContent>
        </Card>

        {/* Achievement Summary */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Achievements
              </CardTitle>
              {onViewAchievements && (
                <Button variant="outline" size="sm" onClick={onViewAchievements}>
                  View All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Overview */}
            <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <Badge variant="secondary" className="text-xs">
                  {achievementProgress.unlocked}/{achievementProgress.total}
                </Badge>
              </div>
              <Progress value={achievementProgress.percentage} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">
                {achievementProgress.percentage}% completed
              </p>
            </div>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Recent Unlocks
                </h4>
                <div className="space-y-2">
                  {recentAchievements.map(achievement => (
                    <div key={achievement.id} className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg">
                      <span className="text-lg">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">
                          +{achievement.coinReward} coins
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game Statistics */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Game Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-primary">{stats.totalGames}</div>
                <div className="text-xs text-muted-foreground">Games Played</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-primary">{stats.totalWins}</div>
                <div className="text-xs text-muted-foreground">Won</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-primary">{stats.totalCoins}</div>
                <div className="text-xs text-muted-foreground">Total Coins</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {stats.totalGames > 0 ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-2 border-destructive/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-destructive">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={resetAchievements}
              className="w-full justify-start border-destructive/20 hover:bg-destructive/10 text-destructive hover:text-destructive"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Achievements
            </Button>
            <Button
              variant="outline"
              onClick={resetAllData}
              className="w-full justify-start border-destructive/20 hover:bg-destructive/10 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset All Data
            </Button>
            <p className="text-xs text-muted-foreground">
              ⚠️ These actions cannot be undone. Use with caution.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}