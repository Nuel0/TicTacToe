import { GameMode, Difficulty } from '../App';

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameResult = 'X' | 'O' | 'draw' | null;

interface AIMove {
  position: number;
  confidence: number;
  reasoning: string;
}

interface GameState {
  board: Board;
  currentPlayer: Player;
  moveCount: number;
  gameResult: GameResult;
}

export class AIService {
  private difficulty: Difficulty;
  private personality: 'aggressive' | 'defensive' | 'balanced' = 'balanced';
  
  constructor(difficulty: Difficulty = 'medium') {
    this.difficulty = difficulty;
    this.setPersonality();
  }

  private setPersonality() {
    switch (this.difficulty) {
      case 'easy':
        this.personality = 'balanced';
        break;
      case 'medium':
        this.personality = Math.random() < 0.5 ? 'aggressive' : 'defensive';
        break;
      case 'hard':
        this.personality = 'aggressive';
        break;
    }
  }

  /**
   * Main AI move decision method
   */
  public getMove(board: Board, moveCount: number = 0): AIMove {
    const gameState: GameState = {
      board,
      currentPlayer: 'O',
      moveCount,
      gameResult: this.checkWinner(board).winner
    };

    switch (this.difficulty) {
      case 'easy':
        return this.getEasyMove(gameState);
      case 'medium':
        return this.getMediumMove(gameState);
      case 'hard':
        return this.getHardMove(gameState);
      default:
        return this.getMediumMove(gameState);
    }
  }

  /**
   * Easy AI - Favors the player (player should win most games)
   * Makes many suboptimal moves to let player win ~70-80% of the time
   */
  private getEasyMove(gameState: GameState): AIMove {
    const { board } = gameState;
    const emptyCells = this.getEmptyCells(board);
    
    if (emptyCells.length === 0) {
      return { position: -1, confidence: 0, reasoning: 'No moves available' };
    }

    // Only 15% chance to make a winning move (let player win most games)
    const winMove = this.findWinningMove(board, 'O');
    if (winMove !== -1 && Math.random() < 0.15) {
      return { 
        position: winMove, 
        confidence: 0.3, 
        reasoning: 'Lucky win!' 
      };
    }

    // Only 40% chance to block player's winning move (let them win often)
    const blockMove = this.findWinningMove(board, 'X');
    if (blockMove !== -1 && Math.random() < 0.4) {
      return { 
        position: blockMove, 
        confidence: 0.3, 
        reasoning: 'Defensive block' 
      };
    }

    // 85% of the time, make random/suboptimal moves
    const randomMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    return { 
      position: randomMove, 
      confidence: 0.1, 
      reasoning: 'Exploring move' 
    };
  }

  /**
   * Medium AI - 60% AI wins, 40% player wins
   * Strategic play but with intentional mistakes
   */
  private getMediumMove(gameState: GameState): AIMove {
    const { board, moveCount } = gameState;
    const emptyCells = this.getEmptyCells(board);

    if (emptyCells.length === 0) {
      return { position: -1, confidence: 0, reasoning: 'No moves available' };
    }

    // Always take winning moves
    const winMove = this.findWinningMove(board, 'O');
    if (winMove !== -1) {
      return { 
        position: winMove, 
        confidence: 0.9, 
        reasoning: 'Winning move!' 
      };
    }

    // 85% chance to block opponent wins (occasionally miss blocks)
    const blockMove = this.findWinningMove(board, 'X');
    if (blockMove !== -1 && Math.random() < 0.85) {
      return { 
        position: blockMove, 
        confidence: 0.8, 
        reasoning: 'Blocking opponent' 
      };
    }

    // 60% chance for strategic move to maintain 60% win rate
    if (Math.random() < 0.6) {
      const strategicMove = this.getStrategicMove(board, moveCount);
      if (strategicMove !== -1) {
        return { 
          position: strategicMove, 
          confidence: 0.6, 
          reasoning: 'Strategic positioning' 
        };
      }
    }

    // Random move 40% of the time to give player chances
    const randomMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    return { 
      position: randomMove, 
      confidence: 0.3, 
      reasoning: 'Exploring options' 
    };
  }

  /**
   * Hard AI - 85% AI wins, 15% player wins
   * Near-optimal play with very rare mistakes
   */
  private getHardMove(gameState: GameState): AIMove {
    const { board, moveCount } = gameState;
    const emptyCells = this.getEmptyCells(board);

    if (emptyCells.length === 0) {
      return { position: -1, confidence: 0, reasoning: 'No moves available' };
    }

    // Always take winning moves
    const winMove = this.findWinningMove(board, 'O');
    if (winMove !== -1) {
      return { 
        position: winMove, 
        confidence: 0.95, 
        reasoning: 'Winning move!' 
      };
    }

    // 95% chance to block opponent wins (very rarely miss)
    const blockMove = this.findWinningMove(board, 'X');
    if (blockMove !== -1 && Math.random() < 0.95) {
      return { 
        position: blockMove, 
        confidence: 0.9, 
        reasoning: 'Blocking opponent' 
      };
    }

    // 90% chance to use minimax (optimal play most of the time)
    if (Math.random() < 0.9) {
      const bestMove = this.minimaxWithPruning(board, 9, true, -Infinity, Infinity);
      
      if (bestMove.position !== -1) {
        return {
          position: bestMove.position,
          confidence: 0.95,
          reasoning: 'Optimal move calculated'
        };
      }
    }

    // 10% chance for strategic but not optimal move
    const strategicMove = this.getStrategicMove(board, moveCount);
    if (strategicMove !== -1) {
      return { 
        position: strategicMove, 
        confidence: 0.7, 
        reasoning: 'Strategic positioning' 
      };
    }

    // Fallback
    return { 
      position: emptyCells[0], 
      confidence: 0.5, 
      reasoning: 'Safe move' 
    };
  }

  /**
   * Enhanced minimax with alpha-beta pruning
   */
  private minimaxWithPruning(
    board: Board, 
    depth: number, 
    isMaximizing: boolean, 
    alpha: number, 
    beta: number
  ): { position: number; score: number } {
    const { winner } = this.checkWinner(board);
    
    if (winner === 'O') return { position: -1, score: 10 - depth };
    if (winner === 'X') return { position: -1, score: depth - 10 };
    if (winner === 'draw') return { position: -1, score: 0 };

    const emptyCells = this.getEmptyCells(board);
    let bestMove = -1;

    if (isMaximizing) {
      let maxScore = -Infinity;
      
      for (const move of emptyCells) {
        board[move] = 'O';
        const result = this.minimaxWithPruning(board, depth + 1, false, alpha, beta);
        board[move] = null;
        
        if (result.score > maxScore) {
          maxScore = result.score;
          bestMove = move;
        }
        
        alpha = Math.max(alpha, result.score);
        if (beta <= alpha) break;
      }
      
      return { position: bestMove, score: maxScore };
    } else {
      let minScore = Infinity;
      
      for (const move of emptyCells) {
        board[move] = 'X';
        const result = this.minimaxWithPruning(board, depth + 1, true, alpha, beta);
        board[move] = null;
        
        if (result.score < minScore) {
          minScore = result.score;
          bestMove = move;
        }
        
        beta = Math.min(beta, result.score);
        if (beta <= alpha) break;
      }
      
      return { position: bestMove, score: minScore };
    }
  }

  /**
   * Find winning move for given player
   */
  private findWinningMove(board: Board, player: Player): number {
    const emptyCells = this.getEmptyCells(board);
    
    for (const move of emptyCells) {
      board[move] = player;
      const { winner } = this.checkWinner(board);
      board[move] = null;
      
      if (winner === player) {
        return move;
      }
    }
    
    return -1;
  }

  /**
   * Get strategic move based on game state
   */
  private getStrategicMove(board: Board, moveCount: number): number {
    const emptyCells = this.getEmptyCells(board);
    
    // First move: take center or corner
    if (moveCount <= 1) {
      if (board[4] === null) return 4; // Center
      const corners = [0, 2, 6, 8].filter(i => board[i] === null);
      if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)];
      }
    }

    // Look for forks (moves that create multiple winning opportunities)
    const forkMove = this.findForkMove(board, 'O');
    if (forkMove !== -1) return forkMove;

    // Block opponent forks
    const blockForkMove = this.findForkMove(board, 'X');
    if (blockForkMove !== -1) return blockForkMove;

    // Take center if available
    if (board[4] === null) return 4;

    // Take corners
    const corners = [0, 2, 6, 8].filter(i => board[i] === null);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // Take edges
    const edges = [1, 3, 5, 7].filter(i => board[i] === null);
    if (edges.length > 0) {
      return edges[Math.floor(Math.random() * edges.length)];
    }

    return emptyCells[0];
  }

  /**
   * Find fork moves (moves that create multiple winning opportunities)
   */
  private findForkMove(board: Board, player: Player): number {
    const emptyCells = this.getEmptyCells(board);
    
    for (const move of emptyCells) {
      board[move] = player;
      let winningMoves = 0;
      
      for (const testMove of this.getEmptyCells(board)) {
        board[testMove] = player;
        const { winner } = this.checkWinner(board);
        board[testMove] = null;
        
        if (winner === player) {
          winningMoves++;
        }
      }
      
      board[move] = null;
      
      if (winningMoves >= 2) {
        return move;
      }
    }
    
    return -1;
  }

  /**
   * Get empty cells on the board
   */
  private getEmptyCells(board: Board): number[] {
    return board.map((cell, index) => cell === null ? index : null)
                .filter(val => val !== null) as number[];
  }

  /**
   * Check for winner on the board
   */
  private checkWinner(board: Board): { winner: GameResult; line: number[] | null } {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a] as GameResult, line };
      }
    }

    if (board.every(cell => cell !== null)) {
      return { winner: 'draw', line: null };
    }

    return { winner: null, line: null };
  }

  /**
   * Get AI thinking time based on difficulty
   */
  public getThinkingTime(): number {
    const baseTime = Math.random() * 500 + 200; // 200-700ms base
    
    switch (this.difficulty) {
      case 'easy':
        return baseTime * 0.5; // 100-350ms
      case 'medium':
        return baseTime * 0.8; // 160-560ms
      case 'hard':
        return baseTime * 1.2; // 240-840ms
      default:
        return baseTime;
    }
  }

  /**
   * Get AI personality-based messages
   */
  public getThinkingMessage(): string {
    const messages = {
      aggressive: [
        "Planning my attack...",
        "Looking for weaknesses...",
        "Calculating victory...",
        "Preparing to strike..."
      ],
      defensive: [
        "Analyzing your strategy...",
        "Being cautious...",
        "Thinking defensively...",
        "Considering options..."
      ],
      balanced: [
        "Thinking...",
        "Analyzing the board...",
        "Planning next move...",
        "Considering possibilities..."
      ]
    };

    const personalityMessages = messages[this.personality];
    return personalityMessages[Math.floor(Math.random() * personalityMessages.length)];
  }
}

// Export a singleton instance
export const aiService = new AIService();