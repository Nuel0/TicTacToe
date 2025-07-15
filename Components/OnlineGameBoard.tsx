import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { GameCell } from './GameCell';
import { GameResultModal } from './GameResultModal';
import { AvatarDisplay } from './AvatarSelector';
import { Home, RotateCcw, Settings, ArrowLeft, Heart, Wifi, WifiOff, AlertCircle, Users, Clock, Brain } from 'lucide-react';
import { GameMode, PlayerData } from '../App';
import { onlineGameService, GameState, ConnectionStatus } from './OnlineGameService';
import { confettiService } from './ConfettiService';

interface OnlineGameBoardProps {
  playerOne: PlayerData;
  playerTwo: PlayerData;
  soundEnabled: boolean;
  onGoHome: () => void;
  onGoBack: () => void;
  onSettings: () => void;
}

export function OnlineGameBoard({ 
  playerOne, 
  playerTwo, 
  soundEnabled, 
  onGoHome, 
  onGoBack, 
  onSettings 
}: OnlineGameBoardProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [playerSymbol, setPlayerSymbol] = useState<'X' | 'O' | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [opponentThinking, setOpponentThinking] = useState(false);
  const [thinkingProgress, setThinkingProgress] = useState(0);

  useEffect(() => {
    // Set up event listeners
    onlineGameService.setOnConnectionStatusChange(setConnectionStatus);
    onlineGameService.setOnGameStateChange((state) => {
      console.log('🎮 Game state updated:', state);
      const previousState = gameState;
      setGameState(state);
      
      // Play appropriate sound based on game state change
      if (state.gameResult && (!previousState || !previousState.gameResult)) {
        // Game just ended, play victory/defeat sound
        const currentPlayerSymbol = onlineGameService.getPlayerSymbol();
        if (state.gameResult === 'draw') {
          playSound('draw');
        } else if (state.gameResult === currentPlayerSymbol) {
          // Player wins = victory
          playSound('victory');
          // Trigger confetti for player victory!
          confettiService.celebrate();
        } else {
          // Opponent wins = defeat
          playSound('defeat');
        }
      } else if (!state.gameResult) {
        // Regular move sound
        playSound('move');
      }
      
      // Stop opponent thinking when new state arrives
      setOpponentThinking(false);
      setThinkingProgress(0);
    });
    onlineGameService.setOnOpponentLeft(() => {
      setOpponentLeft(true);
    });
    onlineGameService.setOnError(setConnectionError);

    // Get initial state
    const initialState = onlineGameService.getGameState();
    const symbol = onlineGameService.getPlayerSymbol();
    
    if (initialState) {
      setGameState(initialState);
      console.log('🎯 Initial game state loaded:', initialState);
    }
    
    if (symbol) {
      setPlayerSymbol(symbol);
      console.log('👤 Player symbol:', symbol);
    }

    return () => {
      // Cleanup listeners
      onlineGameService.setOnGameStateChange(() => {});
      onlineGameService.setOnOpponentLeft(() => {});
      onlineGameService.setOnError(() => {});
    };
  }, []);

  // Update turn indicator and opponent thinking animation
  useEffect(() => {
    if (gameState && playerSymbol) {
      const newIsMyTurn = gameState.currentPlayer === playerSymbol && !gameState.gameResult;
      const wasMyTurn = isMyTurn;
      
      setIsMyTurn(newIsMyTurn);
      
      // Start opponent thinking animation when it becomes opponent's turn
      if (wasMyTurn && !newIsMyTurn && !gameState.gameResult) {
        console.log('🤖 Starting opponent thinking animation...');
        setOpponentThinking(true);
        setThinkingProgress(0);
        
        // Animate progress bar smoothly over 1 second
        const startTime = Date.now();
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / 1000) * 100, 100);
          setThinkingProgress(progress);
          
          if (progress >= 100) {
            clearInterval(progressInterval);
          }
        }, 16); // ~60fps updates
        
        // Auto-stop thinking after 1.2 seconds (with small buffer)
        setTimeout(() => {
          setOpponentThinking(false);
          setThinkingProgress(0);
          clearInterval(progressInterval);
        }, 1200);
      }
    }
  }, [gameState, playerSymbol, isMyTurn]);

  // Enhanced sound effects
  const playSound = (type: 'move' | 'victory' | 'defeat' | 'draw') => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      switch (type) {
        case 'move':
          // Simple move sound
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
          
        case 'victory':
          // Victory melody: C-E-G-C (ascending triumph)
          const victoryNotes = [523.25, 659.25, 783.99, 1046.50]; // C5-E5-G5-C6
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
          // Defeat sound: Descending "boo" effect
          const defeatFreqs = [400, 350, 300, 250]; // Descending frequencies
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
          // Draw sound: Neutral ascending-descending pattern
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

  // Handle cell click
  const handleCellClick = (index: number) => {
    if (!gameState || !isMyTurn || opponentLeft) return;
    
    console.log('👆 Player clicked cell:', index);
    const success = onlineGameService.makeMove(index);
    if (success) {
      console.log(`✅ Move successful at position ${index}`);
    } else {
      console.log(`❌ Move failed at position ${index}`);
    }
  };

  // Handle game reset
  const handleGameReset = () => {
    console.log('🔄 Resetting online game');
    onlineGameService.resetGame();
    setOpponentLeft(false);
    setConnectionError(null);
    setOpponentThinking(false);
    setThinkingProgress(0);
  };

  // Handle leaving game
  const handleLeaveGame = () => {
    console.log('🚪 Leaving online game');
    onlineGameService.leaveGame();
    onGoBack();
  };

  // Handle reconnection
  const handleReconnect = async () => {
    setConnectionError(null);
    setReconnectAttempts(prev => prev + 1);
    
    try {
      await onlineGameService.connect(playerOne);
    } catch (error) {
      setConnectionError('Failed to reconnect. Please try again.');
    }
  };

  // Get opponent data
  const getOpponentData = (): PlayerData => {
    const opponent = onlineGameService.getOpponent();
    return opponent || playerTwo;
  };

  // Get connection status display
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: <Wifi className="h-4 w-4 text-green-500" />, text: 'Connected', color: 'text-green-500' };
      case 'connecting':
        return { icon: <Wifi className="h-4 w-4 animate-pulse text-yellow-500" />, text: 'Connecting', color: 'text-yellow-500' };
      case 'disconnected':
        return { icon: <WifiOff className="h-4 w-4 text-red-500" />, text: 'Disconnected', color: 'text-red-500' };
      case 'error':
        return { icon: <AlertCircle className="h-4 w-4 text-red-500" />, text: 'Error', color: 'text-red-500' };
    }
  };

  const connectionDisplay = getConnectionStatusDisplay();
  const opponentData = getOpponentData();

  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading Game...</p>
            <p className="text-sm text-muted-foreground mt-2">Synchronizing with server</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Button variant="ghost" size="icon" onClick={handleLeaveGame} className="hover:bg-primary/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {connectionDisplay.icon}
                  {connectionDisplay.text}
                </Badge>
                <Badge variant="outline" className="border-primary/30 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Online Match
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={onSettings} className="hover:bg-primary/10">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              {/* Connection Error */}
              {connectionError && (
                <div className="space-y-3 mb-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-2">{connectionError}</p>
                    <Button size="sm" onClick={handleReconnect} className="w-full">
                      Reconnect ({reconnectAttempts + 1})
                    </Button>
                  </div>
                </div>
              )}

              {/* Opponent Left */}
              {opponentLeft && (
                <div className="space-y-3 mb-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                      Your opponent has left the game
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleLeaveGame} variant="outline" className="flex-1">
                        Leave Game
                      </Button>
                      <Button size="sm" onClick={() => setOpponentLeft(false)} className="flex-1">
                        Wait for Reconnect
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Status */}
              {gameState.gameResult ? (
                <div className="space-y-2">
                  <p className="text-lg">Game Over!</p>
                  <p className="text-sm text-muted-foreground">
                    {gameState.gameResult === 'draw' ? "It's a draw! Great game!" : 
                     gameState.gameResult === playerSymbol ? "You win! 🎉" :
                     "Your opponent wins! 💪"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="h-4 w-4 text-primary fill-current" />
                    <p className="text-lg">
                      {isMyTurn ? "Your turn!" : 
                       opponentThinking ? `${opponentData.name} is thinking...` :
                       `${opponentData.name}'s turn`}
                    </p>
                  </div>
                  
                  {/* Player indicators with avatars and symbols */}
                  <div className="flex justify-center gap-4">
                    {/* Player (always X) */}
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                      gameState.currentPlayer === 'X' && !gameState.gameResult ? 
                      'bg-red-100 dark:bg-red-900/20 ring-2 ring-red-500/50 shadow-md' : 'bg-muted/50'
                    }`}>
                      <AvatarDisplay avatar={playerOne.avatar} size="sm" />
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-red-500 font-bold text-sm">X</span>
                          <span className="text-sm font-medium">{playerOne.name}</span>
                          <span className="text-xs text-blue-500">(You)</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Opponent (always O) */}
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                      gameState.currentPlayer === 'O' && !gameState.gameResult ? 
                      'bg-blue-100 dark:bg-blue-900/20 ring-2 ring-blue-500/50 shadow-md' : 'bg-muted/50'
                    }`}>
                      <AvatarDisplay avatar={opponentData.avatar} size="sm" />
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-blue-500 font-bold text-sm">O</span>
                          <span className="text-sm font-medium">{opponentData.name}</span>
                          <span className="text-xs text-gray-500">(Opponent)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opponent thinking indicator */}
                  {opponentThinking && (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 animate-pulse text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {opponentData.name} is thinking...
                        </span>
                      </div>
                      <div className="w-full max-w-48">
                        <Progress value={thinkingProgress} className="h-2" />
                      </div>
                      <div className="text-xs text-center text-muted-foreground">
                        🧠 Will respond in exactly 1 second
                      </div>
                    </div>
                  )}

                  {/* First move hint */}
                  {gameState.moveHistory.length === 1 && isMyTurn && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ⭐ You are X - make the first move!
                      </p>
                    </div>
                  )}

                  {/* Turn indicator when waiting */}
                  {!isMyTurn && !gameState.gameResult && !opponentLeft && !opponentThinking && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-pulse flex space-x-1">
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-75"></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-150"></div>
                      </div>
                      <span>Waiting for opponent's move...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Board */}
        <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-3 aspect-square">
              {gameState.board.map((cell, index) => (
                <GameCell
                  key={index}
                  value={cell}
                  onClick={() => handleCellClick(index)}
                  isWinning={gameState.winningLine?.includes(index) || false}
                  disabled={!isMyTurn || !!gameState.gameResult || opponentLeft || connectionStatus !== 'connected'}
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
            onClick={handleLeaveGame}
            className="border-primary/30 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Leave
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGameReset}
            disabled={!gameState.gameResult || connectionStatus !== 'connected'}
            className="border-primary/30 hover:bg-primary/10"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            New Game
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

        {/* Online Status Panel */}
        <Card className="border border-blue-500/50 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-3">
            <div className="text-xs space-y-1">
              <div><strong>🌐 Connection:</strong> {connectionDisplay.text}</div>
              <div><strong>👤 You are:</strong> X (You always go first!)</div>
              <div><strong>🤖 Opponent is:</strong> O ({opponentData.name})</div>
              <div><strong>🎮 Room:</strong> {onlineGameService.getRoomId()?.slice(-8) || 'N/A'}</div>
              <div><strong>🎯 Turn:</strong> {gameState.currentPlayer} {isMyTurn ? '(Your turn!)' : '(Opponent)'}</div>
              <div><strong>📊 Moves:</strong> {gameState.moveHistory.length - 1}/9</div>
              <div className="pt-1 border-t border-blue-300/30">
                <strong>💫 Status:</strong> {
                  opponentLeft ? 'Opponent disconnected' :
                  connectionStatus !== 'connected' ? 'Connection issues' :
                  gameState.gameResult ? 'Game finished' :
                  isMyTurn ? 'Your turn - make a move!' : 
                  opponentThinking ? 'Opponent thinking (1s)' : 'Waiting for opponent'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Result Modal */}
      <GameResultModal
        isOpen={!!gameState.gameResult}
        result={gameState.gameResult}
        gameMode={'online' as GameMode}
        playerOne={playerOne}
        playerTwo={opponentData}
        onPlayAgain={handleGameReset}
        onGoHome={onGoHome}
        onClose={() => {
          // For online games, closing the modal is same as going home
          onGoHome();
        }}
        difficulty={'medium'}
      />
    </div>
  );
}