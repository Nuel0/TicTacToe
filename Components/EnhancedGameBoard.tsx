import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GameCell } from './GameCell';
import { GameResultModal } from './GameResultModal';
import { AvatarDisplay } from './AvatarSelector';
import { Home, RotateCcw, Settings, Undo2, ArrowLeft, Heart, Wifi, Brain, Zap } from 'lucide-react';
import { GameMode, Difficulty, PlayerData } from '../App';
import { AIService } from './AIService';

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameResult = 'X' | 'O' | 'draw' | null;

interface EnhancedGameBoardProps {
  gameMode: GameMode;
  difficulty: Difficulty;
  playerOne: PlayerData;
  playerTwo: PlayerData;
  soundEnabled: boolean;
  onGoHome: () => void;
  onGoBack: () => void;
  onSettings: () => void;
}

export function EnhancedGameBoard({ 
  gameMode, 
  difficulty, 
  playerOne, 
  playerTwo, 
  soundEnabled, 
  onGoHome, 
  onGoBack, 
  onSettings 
}: EnhancedGameBoardProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiThinkingMessage, setAiThinkingMessage] = useState('');
  const [moveHistory, setMoveHistory] = useState<Board[]>([Array(9).fill(null)]);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [aiService] = useState(() => new AIService(difficulty));
  const [moveCount, setMoveCount] = useState(0);
  const [gameStats, setGameStats] = useState({
    playerWins: 0,
    aiWins: 0,
    draws: 0
  });

  // Sound effects
  const playSound = useCallback((type: 'move' | 'win' | 'draw' | 'think') => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'move':
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          break;
        case 'think':
          oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          break;
        case 'win':
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          break;
        case 'draw':
          oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          break;
      }
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + (type === 'win' ? 0.3 : type === 'draw' ? 0.5 : type === 'think' ? 0.2 : 0.1));
    } catch (error) {
      console.warn('Audio context not available:', error);
    }
  }, [soundEnabled]);

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

  // Handle cell click
  const handleCellClick = (index: number) => {
    if (board[index] || gameResult || isAiThinking) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, newBoard]);
    setMoveCount(prev => prev + 1);
    playSound('move');

    const { winner, line } = checkWinner(newBoard);
    if (winner) {
      setGameResult(winner);
      setWinningLine(line);
      playSound(winner === 'draw' ? 'draw' : 'win');
      
      // Update stats
      if (winner === 'X') {
        setGameStats(prev => ({ ...prev, playerWins: prev.playerWins + 1 }));
      } else if (winner === 'O' && gameMode === 'single') {
        setGameStats(prev => ({ ...prev, aiWins: prev.aiWins + 1 }));
      } else if (winner === 'draw') {
        setGameStats(prev => ({ ...prev, draws: prev.draws + 1 }));
      }
      return;
    }

    if (gameMode === 'single' && currentPlayer === 'X') {
      setCurrentPlayer('O');
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  // Enhanced AI move effect
  useEffect(() => {
    if (gameMode === 'single' && currentPlayer === 'O' && !gameResult && !isAiThinking) {
      setIsAiThinking(true);
      playSound('think');
      
      const thinkingMessage = aiService.getThinkingMessage();
      setAiThinkingMessage(thinkingMessage);
      
      const thinkingTime = aiService.getThinkingTime();
      
      const aiMoveTimeout = setTimeout(() => {
        const aiMove = aiService.getMove(board, moveCount);
        
        if (aiMove.position !== -1) {
          const newBoard = [...board];
          newBoard[aiMove.position] = 'O';
          setBoard(newBoard);
          setMoveHistory(prev => [...prev, newBoard]);
          setMoveCount(prev => prev + 1);
          playSound('move');

          const { winner, line } = checkWinner(newBoard);
          if (winner) {
            setGameResult(winner);
            setWinningLine(line);
            playSound(winner === 'draw' ? 'draw' : 'win');
            
            // Update stats
            if (winner === 'O') {
              setGameStats(prev => ({ ...prev, aiWins: prev.aiWins + 1 }));
            } else if (winner === 'X') {
              setGameStats(prev => ({ ...prev, playerWins: prev.playerWins + 1 }));
            } else if (winner === 'draw') {
              setGameStats(prev => ({ ...prev, draws: prev.draws + 1 }));
            }
          } else {
            setCurrentPlayer('X');
          }
        }
        setIsAiThinking(false);
        setAiThinkingMessage('');
      }, thinkingTime);

      return () => clearTimeout(aiMoveTimeout);
    }
  }, [currentPlayer, board, gameMode, gameResult, isAiThinking, difficulty, moveCount, playSound, aiService]);

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setGameResult(null);
    setIsAiThinking(false);
    setAiThinkingMessage('');
    setMoveHistory([Array(9).fill(null)]);
    setWinningLine(null);
    setMoveCount(0);
  };

  // Undo last move
  const undoMove = () => {
    if (moveHistory.length <= 1 || gameResult || isAiThinking) return;
    
    const newHistory = [...moveHistory];
    newHistory.pop();
    
    if (gameMode === 'single') {
      if (newHistory.length > 1) {
        newHistory.pop();
      }
    }
    
    const previousBoard = newHistory[newHistory.length - 1];
    setBoard(previousBoard);
    setMoveHistory(newHistory);
    setMoveCount(newHistory.length - 1);
    setCurrentPlayer(gameMode === 'single' ? 'X' : (currentPlayer === 'X' ? 'O' : 'X'));
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
    }
  };

  const getDifficultyIcon = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return <Brain className="h-3 w-3" />;
      case 'medium': return <Brain className="h-3 w-3" />;
      case 'hard': return <Zap className="h-3 w-3" />;
    }
  };

  const getCurrentPlayerData = () => {
    return currentPlayer === 'X' ? playerOne : playerTwo;
  };

  const getTotalGames = () => {
    return gameStats.playerWins + gameStats.aiWins + gameStats.draws;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/30 rounded-full blur-xl"></div>
      </div>

      <div className="w-full max-w-md space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 relative z-10">
        {/* Header */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={onGoBack} className="hover:bg-primary/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                {gameMode === 'single' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getDifficultyColor(difficulty)}`} />
                    {getDifficultyIcon(difficulty)}
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} AI
                  </Badge>
                )}
                <Badge variant="outline" className="border-primary/30 flex items-center gap-1">
                  {gameMode === 'online' && <Wifi className="h-3 w-3" />}
                  {gameMode === 'single' ? 'vs AI' : gameMode === 'online' ? 'Online' : '2 Players'}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={onSettings} className="hover:bg-primary/10">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              {gameResult ? (
                <div className="space-y-2">
                  <p className="text-lg">Game Over!</p>
                  <p className="text-sm text-muted-foreground">
                    {gameResult === 'draw' ? "It's a draw! Great game!" : 
                     gameResult === 'X' ? `${playerOne.name} wins! 🎉` :
                     `${playerTwo.name} wins! 🎉`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="h-4 w-4 text-primary fill-current" />
                    <p className="text-lg">
                      {isAiThinking ? aiThinkingMessage : 
                       `${getCurrentPlayerData().name}'s turn`}
                    </p>
                  </div>
                  
                  {/* Player indicators with avatars */}
                  <div className="flex justify-center gap-4">
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                      currentPlayer === 'X' && !gameResult ? 'bg-red-100 dark:bg-red-900/20 ring-2 ring-red-500/50 shadow-md' : 'bg-muted/50'
                    }`}>
                      <AvatarDisplay avatar={playerOne.avatar} size="sm" />
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-red-500 font-bold text-sm">X</span>
                          <span className="text-sm font-medium">{playerOne.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                      currentPlayer === 'O' && !gameResult ? 'bg-blue-100 dark:bg-blue-900/20 ring-2 ring-blue-500/50 shadow-md' : 'bg-muted/50'
                    }`}>
                      <AvatarDisplay avatar={playerTwo.avatar} size="sm" />
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-blue-500 font-bold text-sm">O</span>
                          <span className="text-sm font-medium">{playerTwo.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isAiThinking && (
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <Brain className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Stats (for single player mode) */}
        {gameMode === 'single' && getTotalGames() > 0 && (
          <Card className="border border-primary/20 shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center text-sm">
                <div className="text-center">
                  <p className="font-medium text-green-600">{gameStats.playerWins}</p>
                  <p className="text-muted-foreground">Wins</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-yellow-600">{gameStats.draws}</p>
                  <p className="text-muted-foreground">Draws</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-red-600">{gameStats.aiWins}</p>
                  <p className="text-muted-foreground">AI Wins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Board */}
        <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-3 aspect-square">
              {board.map((cell, index) => (
                <GameCell
                  key={index}
                  value={cell}
                  onClick={() => handleCellClick(index)}
                  isWinning={winningLine?.includes(index) || false}
                  disabled={!!gameResult || isAiThinking}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undoMove}
            disabled={moveHistory.length <= 1 || !!gameResult || isAiThinking}
            className="border-primary/30 hover:bg-primary/10"
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            className="border-primary/30 hover:bg-primary/10"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onGoHome}
            className="border-primary/30 hover:bg-primary/10"
          >
            <Home className="h-4 w-4 mr-1" />
            Home
          </Button>
        </div>
      </div>

      {/* Game Result Modal */}
      <GameResultModal
        isOpen={!!gameResult}
        result={gameResult}
        gameMode={gameMode}
        playerOne={playerOne}
        playerTwo={playerTwo}
        onPlayAgain={resetGame}
        onGoHome={onGoHome}
      />
    </div>
  );
}