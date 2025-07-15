import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { GameCell } from './GameCell';
import { GameResultModal } from './GameResultModal';
import { AvatarDisplay } from './AvatarSelector';
import { Home, RotateCcw, Settings, Undo2, ArrowLeft, Heart, Wifi, Brain, Clock } from 'lucide-react';
import { CoinDisplay } from './CoinDisplay';
import { coinService } from './CoinService';
import { GameMode, Difficulty, PlayerData } from '../App';
import { confettiService } from './ConfettiService';
import { aiPersonalityService } from './AIPersonalityService';
import { achievementService } from './AchievementService';

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameResult = 'X' | 'O' | 'draw' | null;

interface GameBoardProps {
  gameMode: GameMode;
  difficulty: Difficulty;
  playerOne: PlayerData;
  playerTwo: PlayerData;
  playerGoesFirst?: boolean; // Only relevant for single player mode
  soundEnabled: boolean;
  onGoHome: () => void;
  onGoBack: () => void;
  onSettings: () => void;
}

export function GameBoard({ 
  gameMode, 
  difficulty, 
  playerOne, 
  playerTwo, 
  playerGoesFirst = true, // Default to player going first
  soundEnabled, 
  onGoHome, 
  onGoBack, 
  onSettings 
}: GameBoardProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  
  // Debug logging
  console.log('🎮 GameBoard received props:', { gameMode, playerGoesFirst, playerOne: playerOne.name, playerTwo: playerTwo.name });
  
  // Determine starting player based on game mode and preference
  const getStartingPlayer = (): Player => {
    if (gameMode === 'single') {
      // In single player mode, whoever goes first gets 'X'
      // If player goes first: player='X', ai='O', start='X'
      // If AI goes first: player='O', ai='X', start='X' 
      const startingPlayer = 'X'; // X always goes first in tic-tac-toe
      console.log('🎯 Starting player determined:', startingPlayer, 'playerGoesFirst:', playerGoesFirst);
      return startingPlayer;
    }
    return 'X'; // In two-player and online, X always goes first
  };
  
  // Initialize currentPlayer with proper starting player
  const [currentPlayer, setCurrentPlayer] = useState<Player>(() => {
    const initialPlayer = getStartingPlayer();
    console.log('🚀 Initial currentPlayer set to:', initialPlayer);
    return initialPlayer;
  });
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiThinkingProgress, setAiThinkingProgress] = useState(0);
  const [moveHistory, setMoveHistory] = useState<Board[]>([Array(9).fill(null)]);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [aiShouldTryToWin, setAiShouldTryToWin] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);

  // Turn Timer State - Simplified
  const [turnTimeLeft, setTurnTimeLeft] = useState(3);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const TURN_TIME_LIMIT = 3; // 3 seconds for human players

  // Get AI personality for current difficulty
  const aiPersonality = aiPersonalityService.getAIPersonality(difficulty);

  // Determine which symbol the human player and AI use
  const getPlayerSymbols = () => {
    if (gameMode === 'single') {
      // X always goes first in tic-tac-toe
      // If player goes first: player='X', ai='O'
      // If AI goes first: ai='X', player='O'
      const symbols = {
        humanSymbol: playerGoesFirst ? 'X' : 'O',
        aiSymbol: playerGoesFirst ? 'O' : 'X'
      };
      console.log('🎭 Player symbols:', symbols, 'based on playerGoesFirst:', playerGoesFirst);
      console.log('🎮 Current player should be:', playerGoesFirst ? 'X (human)' : 'X (AI)');
      return symbols;
    }
    return { humanSymbol: 'X', aiSymbol: 'O' }; // Not used in non-single player
  };

  const { humanSymbol, aiSymbol } = getPlayerSymbols();

  // Check if current player is human
  const isCurrentPlayerHuman = useCallback(() => {
    if (gameMode === 'single') {
      return currentPlayer === humanSymbol;
    }
    // In two-player and online modes, both players are human
    return true;
  }, [gameMode, currentPlayer, humanSymbol]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
    console.log('⏰ Timer stopped');
  }, []);

  // Start timer for human player
  const startTimer = useCallback(() => {
    // Don't start timer if game is over, AI is thinking, or current player is not human
    if (gameResult || isAiThinking || !isCurrentPlayerHuman()) {
      console.log('⏰ Timer not started - conditions not met', { gameResult, isAiThinking, isHuman: isCurrentPlayerHuman() });
      return;
    }

    stopTimer(); // Clear any existing timer
    setTurnTimeLeft(TURN_TIME_LIMIT);
    setIsTimerRunning(true);
    console.log('⏰ Timer started for', getCurrentPlayerData().name);

    timerRef.current = setInterval(() => {
      setTurnTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up!
          console.log('⏰ Time up! Auto-switching turns');
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [gameResult, isAiThinking, isCurrentPlayerHuman]);

  // Handle time up - automatically switch turns
  const handleTimeUp = useCallback(() => {
    stopTimer();
    
    if (gameResult) return;

    console.log('⏰ Player ran out of time, switching turns');
    
    if (gameMode === 'single' && currentPlayer === humanSymbol) {
      // Switch to AI turn
      setCurrentPlayer(aiSymbol);
    } else {
      // Switch to next player in two-player or online mode
      setCurrentPlayer(prev => prev === 'X' ? 'O' : 'X');
    }
  }, [gameResult, gameMode, currentPlayer, humanSymbol, aiSymbol, stopTimer]);

  // Effect to handle AI moves and timer management
  useEffect(() => {
    if (gameResult || isAiThinking) return;

    if (gameMode === 'single' && currentPlayer === aiSymbol) {
      // AI's turn - stop timer and trigger AI move
      stopTimer();
      setTimeout(() => {
        triggerAiMove(board);
      }, 500);
    } else if (isCurrentPlayerHuman()) {
      // Human's turn - start timer after a short delay
      const timeoutId = setTimeout(() => {
        startTimer();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayer, gameResult, isAiThinking, gameMode, aiSymbol, isCurrentPlayerHuman, startTimer, stopTimer]);

  // Effect to determine AI strategy for this game
  useEffect(() => {
    if (gameMode === 'single') {
      const shouldTryWin = aiPersonalityService.shouldAITryToWin(difficulty);
      setAiShouldTryToWin(shouldTryWin);
      console.log(`🎭 AI Personality: ${aiPersonality.name} will ${shouldTryWin ? 'TRY TO WIN' : 'PLAY CASUALLY'} this game`);
    }
    
    // Record game start for achievements (only once per game)
    achievementService.recordGameStart(gameMode, 'center', playerOne.avatar);
  }, [gameMode, difficulty]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  // Enhanced sound effects
  const playSound = (type: 'move' | 'victory' | 'defeat' | 'draw' | 'tick') => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      switch (type) {
        case 'move':
          const moveOsc = audioContext.createOscillator();
          const moveGain = audioContext.createGain();
          moveOsc.connect(moveGain);
          moveGain.connect(audioContext.destination);
          moveOsc.frequency.setValueAtTime(440, audioContext.currentTime);
          moveGain.gain.setValueAtTime(0.1, audioContext.currentTime);
          moveGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          moveOsc.start(audioContext.currentTime);
          moveOsc.stop(audioContext.currentTime + 0.1);
          break;
          
        case 'tick':
          const tickOsc = audioContext.createOscillator();
          const tickGain = audioContext.createGain();
          tickOsc.connect(tickGain);
          tickGain.connect(audioContext.destination);
          tickOsc.frequency.setValueAtTime(800, audioContext.currentTime);
          tickGain.gain.setValueAtTime(0.05, audioContext.currentTime);
          tickGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          tickOsc.start(audioContext.currentTime);
          tickOsc.stop(audioContext.currentTime + 0.1);
          break;
          
        case 'victory':
          const victoryNotes = [523.25, 659.25, 783.99, 1046.50];
          victoryNotes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);
            osc.start(audioContext.currentTime + i * 0.15);
            osc.stop(audioContext.currentTime + i * 0.15 + 0.3);
          });
          break;
          
        case 'defeat':
          const defeatFreqs = [400, 350, 300, 250];
          defeatFreqs.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.12);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.8, audioContext.currentTime + i * 0.12 + 0.25);
            gain.gain.setValueAtTime(0.12, audioContext.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.12 + 0.4);
            osc.start(audioContext.currentTime + i * 0.12);
            osc.stop(audioContext.currentTime + i * 0.12 + 0.4);
          });
          break;
          
        case 'draw':
          const drawOsc = audioContext.createOscillator();
          const drawGain = audioContext.createGain();
          drawOsc.connect(drawGain);
          drawGain.connect(audioContext.destination);
          drawOsc.frequency.setValueAtTime(330, audioContext.currentTime);
          drawOsc.frequency.linearRampToValueAtTime(440, audioContext.currentTime + 0.25);
          drawOsc.frequency.linearRampToValueAtTime(330, audioContext.currentTime + 0.5);
          drawGain.gain.setValueAtTime(0.1, audioContext.currentTime);
          drawGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
          drawOsc.start(audioContext.currentTime);
          drawOsc.stop(audioContext.currentTime + 0.6);
          break;
      }
    } catch (error) {
      console.warn('Audio context not available:', error);
    }
  };

  // Play tick sound when timer gets to 1 second
  useEffect(() => {
    if (turnTimeLeft === 1 && isTimerRunning) {
      playSound('tick');
    }
  }, [turnTimeLeft, isTimerRunning]);

  // Check for winner
  const checkWinner = (board: Board): { winner: GameResult; line: number[] | null } => {
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
  };

  // Get all empty cells
  const getEmptyCells = (board: Board): number[] => {
    const emptyCells = [];
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        emptyCells.push(i);
      }
    }
    return emptyCells;
  };

  // Check if a move would win the game for a player
  const isWinningMove = (board: Board, position: number, player: Player): boolean => {
    const testBoard = [...board];
    testBoard[position] = player;
    return checkWinner(testBoard).winner === player;
  };

  // Find winning move for a player
  const findWinningMove = (board: Board, player: Player): number | null => {
    const emptyCells = getEmptyCells(board);
    for (const cell of emptyCells) {
      if (isWinningMove(board, cell, player)) {
        return cell;
      }
    }
    return null;
  };

  // Minimax algorithm for optimal play
  const minimax = (board: Board, depth: number, isMaximizing: boolean): number => {
    const { winner } = checkWinner(board);
    
    // Adjust scoring based on AI symbol
    if (winner === aiSymbol) return 10 - depth;
    if (winner === humanSymbol) return depth - 10;
    if (winner === 'draw') return 0;
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      const emptyCells = getEmptyCells(board);
      
      for (const cell of emptyCells) {
        const newBoard = [...board];
        newBoard[cell] = aiSymbol;
        const evaluation = minimax(newBoard, depth + 1, false);
        maxEval = Math.max(maxEval, evaluation);
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      const emptyCells = getEmptyCells(board);
      
      for (const cell of emptyCells) {
        const newBoard = [...board];
        newBoard[cell] = humanSymbol;
        const evaluation = minimax(newBoard, depth + 1, true);
        minEval = Math.min(minEval, evaluation);
      }
      return minEval;
    }
  };

  // Get best move using minimax
  const getBestMove = (board: Board): number => {
    let bestMove = -1;
    let bestValue = -Infinity;
    const emptyCells = getEmptyCells(board);
    
    for (const cell of emptyCells) {
      const newBoard = [...board];
      newBoard[cell] = aiSymbol;
      const moveValue = minimax(newBoard, 0, false);
      
      if (moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = cell;
      }
    }
    return bestMove;
  };

  // Get a deliberately suboptimal move
  const getSuboptimalMove = (board: Board): number => {
    const emptyCells = getEmptyCells(board);
    
    // Avoid center and corners, prefer edges for weaker play
    const edges = [1, 3, 5, 7].filter(i => board[i] === null);
    if (edges.length > 0 && Math.random() < 0.7) {
      return edges[Math.floor(Math.random() * edges.length)];
    }
    
    // Otherwise random move
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  };

  // AI Strategy with tuned difficulty levels for target win rates
  const getAiMove = (board: Board): number => {
    const emptyCells = getEmptyCells(board);
    if (emptyCells.length === 0) return -1;

    // Check if AI should make a blunder based on personality (this adds randomness on top of difficulty)
    const shouldBlunder = Math.random() < aiPersonality.blunderChance;
    
    if (shouldBlunder) {
      console.log(`🎭 ${aiPersonality.name} is making a blunder!`);
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    // If AI is not trying to win this game, make suboptimal moves
    if (!aiShouldTryToWin) {
      console.log(`🎭 ${aiPersonality.name} is playing casually (not trying to win)`);
      
      // Still block immediate player wins sometimes
      const blockingMove = findWinningMove(board, humanSymbol);
      if (blockingMove !== null && Math.random() < 0.4) {
        return blockingMove;
      }
      
      return getSuboptimalMove(board);
    }

    // Main AI strategy based on difficulty to achieve target win rates
    switch (difficulty) {
      case 'easy':
        // Easy AI: Player should win 60% - AI wins 40%
        // Make AI much weaker with lots of random moves and poor blocking
        
        // Always take winning move if available
        const easyWinningMove = findWinningMove(board, aiSymbol);
        if (easyWinningMove !== null) return easyWinningMove;
        
        // Only block player 30% of the time (very weak blocking)
        const easyBlockingMove = findWinningMove(board, humanSymbol);
        if (easyBlockingMove !== null && Math.random() < 0.3) {
          return easyBlockingMove;
        }
        
        // 75% chance of making completely random moves
        if (Math.random() < 0.75) {
          return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
        
        // 25% chance of slightly strategic play (prefer edges over corners/center)
        return getSuboptimalMove(board);

      case 'medium':
        // Medium AI: Player should win 40% - AI wins 60%
        // Balanced play with some strategic mistakes
        
        // Always take winning move
        const mediumWinningMove = findWinningMove(board, aiSymbol);
        if (mediumWinningMove !== null) return mediumWinningMove;
        
        // Block player 70% of the time (decent blocking)
        const mediumBlockingMove = findWinningMove(board, humanSymbol);
        if (mediumBlockingMove !== null && Math.random() < 0.7) {
          return mediumBlockingMove;
        }
        
        // 40% chance of random/suboptimal moves
        if (Math.random() < 0.4) {
          return getSuboptimalMove(board);
        }
        
        // 60% chance of good strategic play
        // Take center if available
        if (board[4] === null) return 4;
        
        // Take corners
        const corners = [0, 2, 6, 8].filter(i => board[i] === null);
        if (corners.length > 0) {
          return corners[Math.floor(Math.random() * corners.length)];
        }
        
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];

      case 'hard':
        // Hard AI: Player should win 20% - AI wins 80%
        // Very strong but not perfect play
        
        // Always take winning move
        const hardWinningMove = findWinningMove(board, aiSymbol);
        if (hardWinningMove !== null) return hardWinningMove;
        
        // Always block player (95% of the time to allow rare mistakes)
        const hardBlockingMove = findWinningMove(board, humanSymbol);
        if (hardBlockingMove !== null && Math.random() < 0.95) {
          return hardBlockingMove;
        }
        
        // 15% chance of suboptimal move (to allow player some wins)
        if (Math.random() < 0.15) {
          return getSuboptimalMove(board);
        }
        
        // 85% chance of optimal play using minimax
        return getBestMove(board);

      default:
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
  };

  // Trigger AI move
  const triggerAiMove = (currentBoard: Board) => {
    console.log(`🤖 ${aiPersonality.name} move triggered! (Trying to win: ${aiShouldTryToWin}) Difficulty: ${difficulty}`);
    stopTimer(); // Stop any human timer
    setIsAiThinking(true);
    setAiThinkingProgress(0);

    // Progress animation
    const progressInterval = setInterval(() => {
      setAiThinkingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 8; // Adjusted for personality thinking time
      });
    }, aiPersonality.thinkingTime / 12);

    // AI makes move after personality-based thinking time
    setTimeout(() => {
      console.log(`🤖 ${aiPersonality.name} making move now!`);
      
      const aiMove = getAiMove(currentBoard);
      
      if (aiMove !== -1) {
        const newBoard = [...currentBoard];
        newBoard[aiMove] = aiSymbol;
        
        console.log(`🤖 ${aiPersonality.name} chose cell:`, aiMove);
        
        setBoard(newBoard);
        setMoveHistory(prev => [...prev, newBoard]);
        playSound('move');

        const { winner, line } = checkWinner(newBoard);
        if (winner) {
          setGameResult(winner);
          setWinningLine(line);
          
          // Record the game result for AI personality tracking
          if (gameMode === 'single') {
            aiPersonalityService.recordGameResult(difficulty, winner);
          }
          
          // Record game result for achievements and coins
          const playerWon = (gameMode === 'single' && winner === humanSymbol) || 
                           (gameMode !== 'single' && winner === 'X');
          const result = winner === 'draw' ? 'draw' : (playerWon ? 'win' : 'loss');
          
          // Record in coin service for stats tracking
          coinService.recordGame(gameMode, result as 'win' | 'loss' | 'draw', difficulty);
          
          // Record in achievement service
          achievementService.recordGameEnd(result, gameMode, difficulty, newBoard.filter(Boolean).length);
          
          // Play appropriate sound and show modal
          if (winner === 'draw') {
            playSound('draw');
          } else if (winner === aiSymbol) {
            playSound('defeat');
          } else {
            playSound('victory');
            confettiService.celebrate();
          }
          
          setTimeout(() => setShowResultModal(true), 500);
        } else {
          setCurrentPlayer(humanSymbol);
        }
      }
      
      setIsAiThinking(false);
      setAiThinkingProgress(0);
      clearInterval(progressInterval);
    }, aiPersonality.thinkingTime);
  };

  // Handle cell click
  const handleCellClick = (index: number) => {
    if (board[index] || gameResult || isAiThinking) return;

    console.log('👤 Player clicked cell:', index);
    stopTimer(); // Stop timer when move is made
    
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, newBoard]);
    playSound('move');

    const { winner, line } = checkWinner(newBoard);
    if (winner) {
      setGameResult(winner);
      setWinningLine(line);
      
      // Record the game result for AI personality tracking
      if (gameMode === 'single') {
        aiPersonalityService.recordGameResult(difficulty, winner);
      }
      
      // Record game result for achievements and coins
      const playerWon = (gameMode === 'single' && winner === humanSymbol) || 
                       (gameMode !== 'single' && winner === 'X');
      const result = winner === 'draw' ? 'draw' : (playerWon ? 'win' : 'loss');
      
      // Record in coin service for stats tracking
      coinService.recordGame(gameMode, result as 'win' | 'loss' | 'draw', difficulty);
      
      // Record in achievement service
      achievementService.recordGameEnd(result, gameMode, difficulty, newBoard.filter(Boolean).length);
      
      if (winner === 'draw') {
        playSound('draw');
      } else if (winner === humanSymbol) {
        playSound('victory');
        confettiService.celebrate();
      } else {
        playSound('defeat');
      }
      
      setTimeout(() => setShowResultModal(true), 500);
      return;
    }

    if (gameMode === 'single' && currentPlayer === humanSymbol) {
      setCurrentPlayer(aiSymbol);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  // Reset game
  const resetGame = () => {
    console.log('🔄 Resetting game');
    stopTimer(); // Stop any running timer
    
    const newBoard = Array(9).fill(null);
    const newStartingPlayer = getStartingPlayer();
    
    setBoard(newBoard);
    setCurrentPlayer(newStartingPlayer);
    setGameResult(null);
    setIsAiThinking(false);
    setAiThinkingProgress(0);
    setMoveHistory([newBoard]);
    setWinningLine(null);
    setShowResultModal(false);
    setTurnTimeLeft(TURN_TIME_LIMIT);
    
    console.log('🔄 Reset complete. Starting player:', newStartingPlayer, 'PlayerGoesFirst:', playerGoesFirst);
    
    // Record new game start for achievements
    achievementService.recordGameStart(gameMode, 'center', playerOne.avatar);
    
    // Determine new AI strategy
    if (gameMode === 'single') {
      const shouldTryWin = aiPersonalityService.shouldAITryToWin(difficulty);
      setAiShouldTryToWin(shouldTryWin);
      console.log(`🎭 New game: ${aiPersonality.name} will ${shouldTryWin ? 'TRY TO WIN' : 'PLAY CASUALLY'}`);
    }
  };

  // Undo last move
  const undoMove = () => {
    if (moveHistory.length <= 1 || gameResult || isAiThinking) return;
    
    stopTimer(); // Stop timer during undo
    
    const newHistory = [...moveHistory];
    newHistory.pop();
    
    if (gameMode === 'single' && newHistory.length > 1) {
      newHistory.pop(); // Remove AI move too
    }
    
    const previousBoard = newHistory[newHistory.length - 1];
    setBoard(previousBoard);
    setMoveHistory(newHistory);
    setCurrentPlayer(getStartingPlayer());
    setIsAiThinking(false);
    setAiThinkingProgress(0);
    setTurnTimeLeft(TURN_TIME_LIMIT);
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
    }
  };

  const getCurrentPlayerData = () => {
    if (gameMode === 'single') {
      return currentPlayer === humanSymbol ? playerOne : playerTwo;
    }
    return currentPlayer === 'X' ? playerOne : playerTwo;
  };

  const getPlayerDisplayInfo = (isPlayerOne: boolean) => {
    if (gameMode === 'single') {
      if (isPlayerOne) {
        // Player One is always the human
        return {
          player: playerOne,
          symbol: humanSymbol,
          isActive: currentPlayer === humanSymbol && !gameResult
        };
      } else {
        // Player Two is the AI
        return {
          player: playerTwo,
          symbol: aiSymbol,
          isActive: currentPlayer === aiSymbol && !gameResult
        };
      }
    } else {
      // Two-player and online modes
      if (isPlayerOne) {
        return {
          player: playerOne,
          symbol: 'X' as Player,
          isActive: currentPlayer === 'X' && !gameResult
        };
      } else {
        return {
          player: playerTwo,
          symbol: 'O' as Player,
          isActive: currentPlayer === 'O' && !gameResult
        };
      }
    }
  };

  const aiStats = aiPersonalityService.getStats(difficulty);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-5 sm:top-10 left-5 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 bg-primary/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-5 sm:bottom-10 right-5 sm:right-10 w-24 sm:w-40 h-24 sm:h-40 bg-accent/30 rounded-full blur-xl"></div>
      </div>

      <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 relative z-10">
        {/* Header */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={onGoBack} className="hover:bg-primary/10 w-8 h-8 sm:w-10 sm:h-10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
                <CoinDisplay variant="badge" />
                {gameMode === 'single' && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs hidden sm:flex">
                    <div className={`w-2 h-2 rounded-full ${getDifficultyColor(difficulty)}`} />
                    {aiPersonality.name}
                  </Badge>
                )}
                <Badge variant="outline" className="border-primary/30 flex items-center gap-1 text-xs">
                  {gameMode === 'online' && <Wifi className="h-3 w-3" />}
                  {gameMode === 'single' ? (
                    <>
                      <Brain className="h-3 w-3" />
                      <span className="hidden sm:inline">vs AI</span>
                      <span className="sm:hidden">AI</span>
                    </>
                  ) : gameMode === 'online' ? 'Online' : '2P'}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={onSettings} className="hover:bg-primary/10 w-8 h-8 sm:w-10 sm:h-10">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              {gameResult ? (
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-base sm:text-lg">Game Over!</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {gameResult === 'draw' ? "It's a draw! Great game!" : 
                     gameMode === 'single' ? 
                       (gameResult === humanSymbol ? `${playerOne.name} wins! 🎉` : `${playerTwo.name} wins! 🎉`) :
                       (gameResult === 'X' ? `${playerOne.name} wins! 🎉` : `${playerTwo.name} wins! 🎉`)}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="h-3 sm:h-4 w-3 sm:w-4 text-primary fill-current" />
                    <p className="text-sm sm:text-lg">
                      {isAiThinking ? `${playerTwo.name} is thinking...` : 
                       `${getCurrentPlayerData().name}'s turn`}
                    </p>
                  </div>

                  {/* Turn Timer */}
                  {isTimerRunning && isCurrentPlayerHuman() && !gameResult && !isAiThinking && (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-3 sm:h-4 w-3 sm:w-4 ${turnTimeLeft <= 1 ? 'text-destructive animate-pulse' : 'text-primary'}`} />
                        <span className={`text-xs sm:text-sm font-medium ${turnTimeLeft <= 1 ? 'text-destructive' : 'text-foreground'}`}>
                          {turnTimeLeft}s
                        </span>
                      </div>
                      <div className="w-32 sm:w-48">
                        <Progress 
                          value={(turnTimeLeft / TURN_TIME_LIMIT) * 100} 
                          className={`h-1.5 sm:h-2 ${turnTimeLeft <= 1 ? 'progress-destructive' : ''}`}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* AI Personality Info */}
                  {gameMode === 'single' && !gameResult && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {aiPersonality.description}
                      </p>
                      {aiStats.totalGames > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Win Rate: {(aiStats.winRate * 100).toFixed(1)}% ({aiStats.aiWins}/{aiStats.totalGames})
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Player indicators with avatars */}
                  <div className="flex justify-center gap-2 sm:gap-4">
                    {/* Player One */}
                    {(() => {
                      const playerInfo = getPlayerDisplayInfo(true);
                      return (
                        <div className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1 sm:py-2 rounded-xl transition-all ${
                          playerInfo.isActive ? 
                            (playerInfo.symbol === 'X' ? 'bg-red-100 dark:bg-red-900/20 ring-2 ring-red-500/50 shadow-md' : 'bg-blue-100 dark:bg-blue-900/20 ring-2 ring-blue-500/50 shadow-md') 
                            : 'bg-muted/50'
                        }`}>
                          <AvatarDisplay avatar={playerInfo.player.avatar} size="sm" />
                          <div className="text-left">
                            <div className="flex items-center gap-1">
                              <span className={`${playerInfo.symbol === 'X' ? 'text-red-500' : 'text-blue-500'} font-bold text-xs sm:text-sm`}>
                                {playerInfo.symbol}
                              </span>
                              <span className="text-xs sm:text-sm font-medium truncate max-w-[60px] sm:max-w-none">{playerInfo.player.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Player Two */}
                    {(() => {
                      const playerInfo = getPlayerDisplayInfo(false);
                      return (
                        <div className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1 sm:py-2 rounded-xl transition-all ${
                          playerInfo.isActive ? 
                            (playerInfo.symbol === 'X' ? 'bg-red-100 dark:bg-red-900/20 ring-2 ring-red-500/50 shadow-md' : 'bg-blue-100 dark:bg-blue-900/20 ring-2 ring-blue-500/50 shadow-md') 
                            : 'bg-muted/50'
                        }`}>
                          <AvatarDisplay avatar={playerInfo.player.avatar} size="sm" />
                          <div className="text-left">
                            <div className="flex items-center gap-1">
                              <span className={`${playerInfo.symbol === 'X' ? 'text-red-500' : 'text-blue-500'} font-bold text-xs sm:text-sm`}>
                                {playerInfo.symbol}
                              </span>
                              <span className="text-xs sm:text-sm font-medium truncate max-w-[60px] sm:max-w-none">{playerInfo.player.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {isAiThinking && (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 sm:h-4 w-3 sm:w-4 border-b-2 border-primary"></div>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {aiPersonality.name} is analyzing...
                        </span>
                      </div>
                      <div className="w-32 sm:w-48">
                        <Progress value={aiThinkingProgress} className="h-1 sm:h-2" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Board */}
        <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 aspect-square">
              {board.map((cell, index) => (
                <GameCell
                  key={index}
                  value={cell}
                  onClick={() => handleCellClick(index)}
                  isWinning={winningLine?.includes(index) || false}
                  disabled={!!gameResult || isAiThinking || (gameMode === 'single' && currentPlayer === aiSymbol)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undoMove}
            disabled={moveHistory.length <= 1 || !!gameResult || isAiThinking}
            className="border-primary/30 hover:bg-primary/10 h-8 sm:h-auto text-xs sm:text-sm"
          >
            <Undo2 className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            className="border-primary/30 hover:bg-primary/10 h-8 sm:h-auto text-xs sm:text-sm"
          >
            <RotateCcw className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onGoHome}
            className="border-primary/30 hover:bg-primary/10 h-8 sm:h-auto text-xs sm:text-sm"
          >
            <Home className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </div>
      </div>

      {/* Game Result Modal */}
      <GameResultModal
        isOpen={showResultModal}
        result={gameResult}
        gameMode={gameMode}
        playerOne={playerOne}
        playerTwo={playerTwo}
        playerGoesFirst={playerGoesFirst}
        onPlayAgain={() => {
          setShowResultModal(false);
          resetGame();
        }}
        onGoHome={() => {
          setShowResultModal(false);
          onGoHome();
        }}
        onClose={() => setShowResultModal(false)}
        difficulty={difficulty}
      />
    </div>
  );
}