export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  coinReward: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface AchievementStats {
  totalWins: number;
  totalGames: number;
  winStreak: number;
  bestWinStreak: number;
  easyWins: number;
  mediumWins: number;
  hardWins: number;
  coinsEarned: number;
  avatarsUsed: string[];
  perfectGames: number;
  themesSwitched: number;
}

class AchievementService {
  private static instance: AchievementService;
  private achievements: Map<string, Achievement> = new Map();
  private stats: AchievementStats;
  private listeners: Array<(achievements: Achievement[]) => void> = [];

  private constructor() {
    this.initializeAchievements();
    this.stats = this.loadStats();
    this.updateAchievementProgress();
  }

  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  private initializeAchievements() {
    const achievementList: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
      {
        id: 'first_win',
        title: 'First Victory',
        description: 'Win your first game of Tic Tac Toe',
        icon: '🏆',
        coinReward: 10,
        maxProgress: 1
      },
      {
        id: 'win_streak',
        title: 'Hot Streak',
        description: 'Win 3 games in a row',
        icon: '🔥',
        coinReward: 25,
        maxProgress: 3
      },
      {
        id: 'beat_easy',
        title: 'Bear Tamer',
        description: 'Defeat the Easy AI 5 times',
        icon: '🐻',
        coinReward: 20,
        maxProgress: 5
      },
      {
        id: 'beat_medium',
        title: 'Fox Hunter',
        description: 'Defeat the Medium AI 3 times',
        icon: '🦊',
        coinReward: 30,
        maxProgress: 3
      },
      {
        id: 'beat_hard',
        title: 'Owl Whisperer',
        description: 'Defeat the Hard AI once',
        icon: '🦉',
        coinReward: 50,
        maxProgress: 1
      },
      {
        id: 'perfect_game',
        title: 'Perfect Victory',
        description: 'Win a game in just 3 moves',
        icon: '⚡',
        coinReward: 35,
        maxProgress: 1
      },
      {
        id: 'coin_collector',
        title: 'Coin Collector',
        description: 'Earn 100 coins total',
        icon: '🪙',
        coinReward: 25,
        maxProgress: 100
      },
      {
        id: 'veteran_player',
        title: 'Veteran Player',
        description: 'Play 25 total games',
        icon: '🎮',
        coinReward: 40,
        maxProgress: 25
      },
      {
        id: 'avatar_explorer',
        title: 'Avatar Explorer',
        description: 'Try 4 different avatars',
        icon: '🎭',
        coinReward: 30,
        maxProgress: 4
      },
      {
        id: 'champion',
        title: 'Champion',
        description: 'Win 20 total games',
        icon: '👑',
        coinReward: 60,
        maxProgress: 20
      }
    ];

    achievementList.forEach(achievement => {
      this.achievements.set(achievement.id, {
        ...achievement,
        progress: 0,
        unlocked: false
      });
    });

    this.loadAchievements();
  }

  private loadStats(): AchievementStats {
    const defaultStats: AchievementStats = {
      totalWins: 0,
      totalGames: 0,
      winStreak: 0,
      bestWinStreak: 0,
      easyWins: 0,
      mediumWins: 0,
      hardWins: 0,
      coinsEarned: 0,
      avatarsUsed: [],
      perfectGames: 0,
      themesSwitched: 0
    };

    const saved = localStorage.getItem('tictactoe-achievement-stats');
    return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
  }

  private saveStats() {
    localStorage.setItem('tictactoe-achievement-stats', JSON.stringify(this.stats));
  }

  private loadAchievements() {
    const saved = localStorage.getItem('tictactoe-achievements');
    if (saved) {
      const savedAchievements = JSON.parse(saved);
      this.achievements.forEach((achievement, id) => {
        if (savedAchievements[id]) {
          this.achievements.set(id, {
            ...achievement,
            progress: savedAchievements[id].progress || 0,
            unlocked: savedAchievements[id].unlocked || false,
            unlockedAt: savedAchievements[id].unlockedAt ? new Date(savedAchievements[id].unlockedAt) : undefined
          });
        }
      });
    }
  }

  private saveAchievements() {
    const achievementsData: Record<string, any> = {};
    this.achievements.forEach((achievement, id) => {
      achievementsData[id] = {
        progress: achievement.progress,
        unlocked: achievement.unlocked,
        unlockedAt: achievement.unlockedAt?.toISOString()
      };
    });
    localStorage.setItem('tictactoe-achievements', JSON.stringify(achievementsData));
  }

  private updateAchievementProgress() {
    this.updateAchievement('first_win', Math.min(this.stats.totalWins, 1));
    this.updateAchievement('win_streak', Math.min(this.stats.bestWinStreak, 3));
    this.updateAchievement('beat_easy', this.stats.easyWins);
    this.updateAchievement('beat_medium', this.stats.mediumWins);
    this.updateAchievement('beat_hard', this.stats.hardWins);
    this.updateAchievement('perfect_game', this.stats.perfectGames);
    this.updateAchievement('coin_collector', this.stats.coinsEarned);
    this.updateAchievement('veteran_player', this.stats.totalGames);
    this.updateAchievement('avatar_explorer', this.stats.avatarsUsed.length);
    this.updateAchievement('champion', this.stats.totalWins);
  }

  private updateAchievement(id: string, newProgress: number) {
    const achievement = this.achievements.get(id);
    if (!achievement) return;

    const oldProgress = achievement.progress;
    achievement.progress = Math.min(newProgress, achievement.maxProgress);

    if (!achievement.unlocked && achievement.progress >= achievement.maxProgress) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      
      // Award coins through event system
      if (achievement.coinReward > 0) {
        window.dispatchEvent(new CustomEvent('achievementUnlocked', {
          detail: { achievement, coins: achievement.coinReward }
        }));
      }

      this.notifyListeners();
    }

    if (oldProgress !== achievement.progress) {
      this.saveAchievements();
    }
  }

  // Public methods for tracking stats
  public recordGameStart(gameMode: string, firstMove: string, avatar: string) {
    this.stats.totalGames++;
    
    if (!this.stats.avatarsUsed.includes(avatar)) {
      this.stats.avatarsUsed.push(avatar);
    }

    this.saveStats();
    this.updateAchievementProgress();
  }

  public recordGameEnd(result: string, gameMode: string, difficulty?: string, moveCount?: number) {
    if (result === 'win') {
      this.stats.totalWins++;
      this.stats.winStreak++;
      this.stats.bestWinStreak = Math.max(this.stats.bestWinStreak, this.stats.winStreak);

      if (gameMode === 'single') {
        if (difficulty === 'easy') this.stats.easyWins++;
        else if (difficulty === 'medium') this.stats.mediumWins++;
        else if (difficulty === 'hard') this.stats.hardWins++;
      }

      // Check for perfect game (3 moves total, so player made 2 moves to win on turn 2)
      if (moveCount && moveCount <= 5) {
        this.stats.perfectGames++;
      }
    } else {
      this.stats.winStreak = 0;
    }

    this.saveStats();
    this.updateAchievementProgress();
  }

  public recordCoinEarned(totalCoins: number) {
    this.stats.coinsEarned = totalCoins;
    this.saveStats();
    this.updateAchievementProgress();
  }

  public recordThemeSwitch() {
    this.stats.themesSwitched++;
    this.saveStats();
    this.updateAchievementProgress();
  }

  // Getters
  public getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return 0;
    });
  }

  public getProgress(): { total: number; unlocked: number; percentage: number } {
    const achievements = this.getAllAchievements();
    const total = achievements.length;
    const unlocked = achievements.filter(a => a.unlocked).length;
    return { total, unlocked, percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0 };
  }

  public addListener(callback: (achievements: Achievement[]) => void) {
    this.listeners.push(callback);
  }

  public removeListener(callback: (achievements: Achievement[]) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) this.listeners.splice(index, 1);
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.getAllAchievements()));
  }

  public resetAllAchievements() {
    this.achievements.forEach(achievement => {
      achievement.progress = 0;
      achievement.unlocked = false;
      achievement.unlockedAt = undefined;
    });
    this.saveAchievements();
    this.notifyListeners();
  }

  public resetStats() {
    this.stats = {
      totalWins: 0,
      totalGames: 0,
      winStreak: 0,
      bestWinStreak: 0,
      easyWins: 0,
      mediumWins: 0,
      hardWins: 0,
      coinsEarned: 0,
      avatarsUsed: [],
      perfectGames: 0,
      themesSwitched: 0
    };
    this.saveStats();
    this.updateAchievementProgress();
  }
}

export const achievementService = AchievementService.getInstance();