import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ArrowLeft, Trophy, CheckCircle, Circle } from 'lucide-react';
import { achievementService, Achievement } from './AchievementService';

interface AchievementsProps {
  onBack: () => void;
}

export function Achievements({ onBack }: AchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState({ total: 0, unlocked: 0, percentage: 0 });

  useEffect(() => {
    const loadAchievements = () => {
      setAchievements(achievementService.getAllAchievements());
      setProgress(achievementService.getProgress());
    };

    loadAchievements();
    achievementService.addListener(loadAchievements);

    return () => {
      achievementService.removeListener(loadAchievements);
    };
  }, []);

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
              <div className="text-center">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                  Achievements
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {progress.unlocked} of {progress.total} completed ({progress.percentage}%)
                </p>
              </div>
              <div className="w-8 sm:w-10" />
            </div>
            
            {/* Overall Progress */}
            <div className="mt-4">
              <Progress value={progress.percentage} className="h-2 sm:h-3" />
            </div>
          </CardHeader>
        </Card>

        {/* Achievement List */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {achievements.map((achievement) => {
              const progressPercentage = achievement.maxProgress > 1 
                ? Math.round((achievement.progress / achievement.maxProgress) * 100)
                : achievement.unlocked ? 100 : 0;

              return (
                <div 
                  key={achievement.id} 
                  className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
                    achievement.unlocked 
                      ? 'bg-primary/5 border-primary/30' 
                      : 'bg-muted/30 border-border/30'
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon & Status */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <div className={`text-2xl sm:text-3xl ${achievement.unlocked ? '' : 'opacity-50'}`}>
                        {achievement.icon}
                      </div>
                      {achievement.unlocked ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm sm:text-base font-medium ${
                          achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {achievement.title}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs">🪙</span>
                          <span className="text-xs sm:text-sm font-medium text-primary">
                            {achievement.coinReward}
                          </span>
                        </div>
                      </div>

                      <p className={`text-xs sm:text-sm leading-relaxed mb-2 ${
                        achievement.unlocked ? 'text-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {achievement.description}
                      </p>

                      {/* Progress */}
                      {achievement.maxProgress > 1 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Progress</span>
                            <span className="text-xs font-medium">
                              {achievement.progress}/{achievement.maxProgress}
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
                        </div>
                      )}

                      {/* Unlock Date */}
                      {achievement.unlocked && achievement.unlockedAt && (
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            Completed
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}