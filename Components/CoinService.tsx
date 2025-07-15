interface CoinReward {
  amount: number;
  reason: string;
  timestamp: number;
}

interface CoinStats {
  totalCoins: number;
  totalGames: number; // Added total games played
  totalWins: number;
  totalLosses: number; // Added total losses
  totalDraws: number; // Added total draws
  singlePlayerWins: number;
  twoPlayerWins: number;
  onlineWins: number;
  easyWins: number;
  mediumWins: number;
  hardWins: number;
  recentRewards: CoinReward[];
}

export type GameMode = 'single' | 'two-player' | 'online';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameResult = 'win' | 'loss' | 'draw';

class CoinService {
  private readonly STORAGE_KEY = 'tictactoe-coins';
  private readonly MAX_RECENT_REWARDS = 10;
  
  private stats: CoinStats = {
    totalCoins: 0,
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    singlePlayerWins: 0,
    twoPlayerWins: 0,
    onlineWins: 0,
    easyWins: 0,
    mediumWins: 0,
    hardWins: 0,
    recentRewards: []
  };

  private listeners: Array<(stats: CoinStats) => void> = [];

  constructor() {
    this.loadStats();
  }

  // Coin reward amounts based on game mode and difficulty
  private getRewardAmount(gameMode: GameMode, difficulty?: Difficulty, isDraw: boolean = false): number {
    if (isDraw) {
      return 1; // Small consolation prize for draws
    }

    switch (gameMode) {
      case 'single':
        switch (difficulty) {
          case 'easy': return 2;     // Easy AI victory: 2 coins
          case 'medium': return 5;   // Medium AI victory: 5 coins  
          case 'hard': return 10;    // Hard AI victory: 10 coins
          default: return 3;
        }
      case 'two-player':
        return 3; // Local multiplayer victory: 3 coins
      case 'online':
        return 8; // Online victory: 8 coins (worth more due to difficulty)
      default:
        return 1;
    }
  }

  // Record game result and award coins if applicable
  public recordGame(
    gameMode: GameMode,
    result: GameResult,
    difficulty: Difficulty = 'medium'
  ): CoinReward | null {
    // Always increment total games
    this.stats.totalGames++;

    // Update result counters
    switch (result) {
      case 'win':
        this.stats.totalWins++;
        // Track by game mode
        switch (gameMode) {
          case 'single':
            this.stats.singlePlayerWins++;
            // Track by difficulty
            switch (difficulty) {
              case 'easy': this.stats.easyWins++; break;
              case 'medium': this.stats.mediumWins++; break;
              case 'hard': this.stats.hardWins++; break;
            }
            break;
          case 'two-player':
            this.stats.twoPlayerWins++;
            break;
          case 'online':
            this.stats.onlineWins++;
            break;
        }
        break;
      case 'loss':
        this.stats.totalLosses++;
        break;
      case 'draw':
        this.stats.totalDraws++;
        break;
    }

    // Award coins for wins and draws
    if (result === 'win' || result === 'draw') {
      return this.awardCoins(gameMode, difficulty, result === 'win', result === 'draw');
    }

    // No coin reward for losses, but still save stats
    this.saveStats();
    this.notifyListeners();
    return null;
  }

  // Award coins for winning/drawing (used internally and for manual coin awards)
  public awardCoins(
    gameMode: GameMode, 
    difficulty: Difficulty = 'medium', 
    isWin: boolean = true, 
    isDraw: boolean = false
  ): CoinReward {
    const amount = this.getRewardAmount(gameMode, difficulty, isDraw);
    
    let reason: string;
    if (isDraw) {
      reason = "Draw bonus!";
    } else if (isWin) {
      switch (gameMode) {
        case 'single':
          reason = `Victory vs ${difficulty} AI!`;
          break;
        case 'two-player':
          reason = "Local multiplayer win!";
          break;
        case 'online':
          reason = "Online victory!";
          break;
        default:
          reason = "Victory!";
      }
    } else {
      // This should rarely be called since we only award coins for wins/draws
      reason = "Participation bonus!";
    }

    const reward: CoinReward = {
      amount,
      reason,
      timestamp: Date.now()
    };

    // Update coins
    this.stats.totalCoins += amount;

    // Add to recent rewards (keep only last 10)
    this.stats.recentRewards.unshift(reward);
    if (this.stats.recentRewards.length > this.MAX_RECENT_REWARDS) {
      this.stats.recentRewards = this.stats.recentRewards.slice(0, this.MAX_RECENT_REWARDS);
    }

    this.saveStats();
    this.notifyListeners();

    console.log(`🪙 Awarded ${amount} coins: ${reason}`);
    return reward;
  }

  // Add coins manually (for achievements, etc.)
  public addCoins(amount: number, reason: string): CoinReward {
    const reward: CoinReward = {
      amount,
      reason,
      timestamp: Date.now()
    };

    this.stats.totalCoins += amount;

    // Add to recent rewards
    this.stats.recentRewards.unshift(reward);
    if (this.stats.recentRewards.length > this.MAX_RECENT_REWARDS) {
      this.stats.recentRewards = this.stats.recentRewards.slice(0, this.MAX_RECENT_REWARDS);
    }

    this.saveStats();
    this.notifyListeners();

    console.log(`🪙 Added ${amount} coins: ${reason}`);
    return reward;
  }

  // Spend coins (for future features like avatars, themes, etc.)
  public spendCoins(amount: number, reason: string): boolean {
    if (this.stats.totalCoins >= amount) {
      this.stats.totalCoins -= amount;
      
      const expense: CoinReward = {
        amount: -amount,
        reason: `Spent: ${reason}`,
        timestamp: Date.now()
      };
      
      this.stats.recentRewards.unshift(expense);
      if (this.stats.recentRewards.length > this.MAX_RECENT_REWARDS) {
        this.stats.recentRewards = this.stats.recentRewards.slice(0, this.MAX_RECENT_REWARDS);
      }

      this.saveStats();
      this.notifyListeners();
      
      console.log(`💸 Spent ${amount} coins: ${reason}`);
      return true;
    }
    return false;
  }

  // Get current coin balance
  public getCoins(): number {
    return this.stats.totalCoins;
  }

  // Get full stats
  public getStats(): CoinStats {
    return { ...this.stats };
  }

  // Get win rate percentage
  public getWinRate(): number {
    if (this.stats.totalGames === 0) return 0;
    return Math.round((this.stats.totalWins / this.stats.totalGames) * 100);
  }

  // Get coin earning info for display
  public getCoinInfo(): { [key: string]: number } {
    return {
      'Easy AI Win': this.getRewardAmount('single', 'easy'),
      'Medium AI Win': this.getRewardAmount('single', 'medium'),
      'Hard AI Win': this.getRewardAmount('single', 'hard'),
      'Local Multiplayer Win': this.getRewardAmount('two-player'),
      'Online Win': this.getRewardAmount('online'),
      'Draw Bonus': this.getRewardAmount('single', 'medium', true)
    };
  }

  // Get milestone achievements
  public getMilestones(): Array<{ title: string; description: string; achieved: boolean }> {
    return [
      {
        title: "First Win",
        description: "Win your first game",
        achieved: this.stats.totalWins >= 1
      },
      {
        title: "Coin Collector",
        description: "Earn 50 coins",
        achieved: this.stats.totalCoins >= 50
      },
      {
        title: "AI Challenger",
        description: "Beat the hard AI",
        achieved: this.stats.hardWins >= 1
      },
      {
        title: "Multiplayer Master",
        description: "Win 5 local games",
        achieved: this.stats.twoPlayerWins >= 5
      },
      {
        title: "Online Champion",
        description: "Win 3 online matches",
        achieved: this.stats.onlineWins >= 3
      },
      {
        title: "Persistent Player",
        description: "Win 25 total games",
        achieved: this.stats.totalWins >= 25
      },
      {
        title: "Experienced Player",
        description: "Play 50 total games",
        achieved: this.stats.totalGames >= 50
      },
      {
        title: "Coin Hoarder",
        description: "Accumulate 200 coins",
        achieved: this.stats.totalCoins >= 200
      },
      {
        title: "AI Conqueror", 
        description: "Beat all AI difficulty levels",
        achieved: this.stats.easyWins >= 1 && this.stats.mediumWins >= 1 && this.stats.hardWins >= 1
      }
    ];
  }

  // Reset stats (for testing or user request)
  public resetStats(): void {
    this.stats = {
      totalCoins: 0,
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      singlePlayerWins: 0,
      twoPlayerWins: 0,
      onlineWins: 0,
      easyWins: 0,
      mediumWins: 0,
      hardWins: 0,
      recentRewards: []
    };
    this.saveStats();
    this.notifyListeners();
    console.log("🔄 Coin stats reset");
  }

  // Subscribe to coin changes
  public addListener(callback: (stats: CoinStats) => void): void {
    this.listeners.push(callback);
  }

  // Unsubscribe from coin changes
  public removeListener(callback: (stats: CoinStats) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.stats));
  }

  private saveStats(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Failed to save coin stats:', error);
    }
  }

  private loadStats(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.stats = {
          totalCoins: parsed.totalCoins || 0,
          totalGames: parsed.totalGames || 0, // Added
          totalWins: parsed.totalWins || 0,
          totalLosses: parsed.totalLosses || 0, // Added
          totalDraws: parsed.totalDraws || 0, // Added
          singlePlayerWins: parsed.singlePlayerWins || 0,
          twoPlayerWins: parsed.twoPlayerWins || 0,
          onlineWins: parsed.onlineWins || 0,
          easyWins: parsed.easyWins || 0,
          mediumWins: parsed.mediumWins || 0,
          hardWins: parsed.hardWins || 0,
          recentRewards: parsed.recentRewards || []
        };
        console.log(`🪙 Loaded stats: ${this.stats.totalGames} games, ${this.stats.totalCoins} coins`);
      }
    } catch (error) {
      console.warn('Failed to load coin stats:', error);
    }
  }
}

// Export singleton instance
export const coinService = new CoinService();