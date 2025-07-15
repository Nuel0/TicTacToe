import { Difficulty, Avatar } from '../App';

interface AIPersonality {
  name: string;
  avatar: Avatar;
  description: string;
  thinkingTime: number; // milliseconds
  blunderChance: number; // 0-1 probability of making a random move
  targetWinRate: number; // Expected AI win rate for this difficulty
}

interface AIStats {
  totalGames: number;
  aiWins: number;
  playerWins: number;
  draws: number;
  winRate: number;
}

class AIPersonalityService {
  private static instance: AIPersonalityService;
  private personalities: Record<Difficulty, AIPersonality>;

  private constructor() {
    this.personalities = {
      easy: {
        name: 'Friendly Bear',
        avatar: 'bear',
        description: 'A gentle bear who\'s still learning the game. Makes lots of friendly mistakes!',
        thinkingTime: 800, // Shorter thinking time
        blunderChance: 0.15, // 15% chance of random moves
        targetWinRate: 0.40 // AI should win 40% (Player wins 60%)
      },
      medium: {
        name: 'Smart Fox',
        avatar: 'fox',
        description: 'A clever fox with decent strategy. Balances offense and defense reasonably well.',
        thinkingTime: 1000, // Medium thinking time
        blunderChance: 0.08, // 8% chance of random moves
        targetWinRate: 0.60 // AI should win 60% (Player wins 40%)
      },
      hard: {
        name: 'Master Owl',
        avatar: 'owl',
        description: 'A wise owl with excellent tactical skills. Very difficult to beat!',
        thinkingTime: 1200, // Longer thinking time for dramatic effect
        blunderChance: 0.03, // 3% chance of random moves
        targetWinRate: 0.80 // AI should win 80% (Player wins 20%)
      }
    };
  }

  public static getInstance(): AIPersonalityService {
    if (!AIPersonalityService.instance) {
      AIPersonalityService.instance = new AIPersonalityService();
    }
    return AIPersonalityService.instance;
  }

  public getAIPersonality(difficulty: Difficulty): AIPersonality {
    return this.personalities[difficulty];
  }

  public shouldAITryToWin(difficulty: Difficulty): boolean {
    // Get current stats to check if AI needs to adjust strategy
    const stats = this.getStats(difficulty);
    const personality = this.personalities[difficulty];
    
    // If we don't have enough games, use base strategy
    if (stats.totalGames < 5) {
      return Math.random() < personality.targetWinRate;
    }
    
    // Adjust strategy based on current performance vs target
    const currentWinRate = stats.winRate;
    const targetWinRate = personality.targetWinRate;
    
    // If AI is winning too much, be more casual
    if (currentWinRate > targetWinRate + 0.1) {
      return Math.random() < 0.3; // Be more casual
    }
    
    // If AI is winning too little, try harder
    if (currentWinRate < targetWinRate - 0.1) {
      return Math.random() < 0.9; // Try harder
    }
    
    // If close to target, maintain current strategy
    return Math.random() < personality.targetWinRate;
  }

  public recordGameResult(difficulty: Difficulty, winner: 'X' | 'O' | 'draw'): void {
    const key = `ai-stats-${difficulty}`;
    const stats = this.getStats(difficulty);
    
    stats.totalGames++;
    
    if (winner === 'draw') {
      stats.draws++;
    } else {
      // Determine if AI won based on the game setup
      // This is a simplified check - in a real implementation, you'd pass more context
      const aiWon = winner === 'O'; // Assuming AI is usually 'O', but this should be more robust
      
      if (aiWon) {
        stats.aiWins++;
      } else {
        stats.playerWins++;
      }
    }
    
    stats.winRate = stats.totalGames > 0 ? stats.aiWins / stats.totalGames : 0;
    
    localStorage.setItem(key, JSON.stringify(stats));
    
    console.log(`📊 AI Stats for ${difficulty}:`, stats, `Target: ${this.personalities[difficulty].targetWinRate * 100}%`);
  }

  public getStats(difficulty: Difficulty): AIStats {
    const key = `ai-stats-${difficulty}`;
    const saved = localStorage.getItem(key);
    
    const defaultStats: AIStats = {
      totalGames: 0,
      aiWins: 0,
      playerWins: 0,
      draws: 0,
      winRate: 0
    };
    
    if (saved) {
      try {
        return { ...defaultStats, ...JSON.parse(saved) };
      } catch (error) {
        console.warn('Failed to parse AI stats:', error);
        return defaultStats;
      }
    }
    
    return defaultStats;
  }

  public resetStats(difficulty?: Difficulty): void {
    if (difficulty) {
      localStorage.removeItem(`ai-stats-${difficulty}`);
    } else {
      // Reset all difficulties
      localStorage.removeItem('ai-stats-easy');
      localStorage.removeItem('ai-stats-medium');
      localStorage.removeItem('ai-stats-hard');
    }
  }

  public getAllStats(): Record<Difficulty, AIStats> {
    return {
      easy: this.getStats('easy'),
      medium: this.getStats('medium'),
      hard: this.getStats('hard')
    };
  }

  public getTargetWinRates(): Record<Difficulty, number> {
    return {
      easy: this.personalities.easy.targetWinRate,
      medium: this.personalities.medium.targetWinRate,
      hard: this.personalities.hard.targetWinRate
    };
  }

  public getDifficultyInfo(difficulty: Difficulty): { 
    personality: AIPersonality; 
    stats: AIStats; 
    performance: 'below' | 'on-target' | 'above' 
  } {
    const personality = this.personalities[difficulty];
    const stats = this.getStats(difficulty);
    
    let performance: 'below' | 'on-target' | 'above' = 'on-target';
    
    if (stats.totalGames >= 5) {
      const diff = stats.winRate - personality.targetWinRate;
      if (diff < -0.1) performance = 'below';
      else if (diff > 0.1) performance = 'above';
    }
    
    return { personality, stats, performance };
  }
}

export const aiPersonalityService = AIPersonalityService.getInstance();