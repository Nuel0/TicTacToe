import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AvatarDisplay } from './AvatarSelector';
import { Trophy, Handshake, Rotate3D, Home, RotateCcw, Heart, Star, Wifi, Coins, TrendingUp } from 'lucide-react';
import { GameMode, PlayerData } from '../App';
import { coinService } from './CoinService';

interface GameResultModalProps {
  isOpen: boolean;
  result: 'X' | 'O' | 'draw' | null;
  gameMode: GameMode;
  playerOne: PlayerData;
  playerTwo: PlayerData;
  playerGoesFirst?: boolean; // For single player mode
  difficulty?: 'easy' | 'medium' | 'hard';
  onPlayAgain: () => void;
  onGoHome: () => void;
  onClose?: () => void;
}

export function GameResultModal({ 
  isOpen, 
  result, 
  gameMode, 
  playerOne, 
  playerTwo, 
  playerGoesFirst = true,
  difficulty = 'medium',
  onPlayAgain, 
  onGoHome,
  onClose 
}: GameResultModalProps) {
  const [coinReward, setCoinReward] = useState<number | null>(null);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);

  // Display coin reward amount when modal opens (coins already awarded in GameBoard)
  useEffect(() => {
    if (isOpen && result) {
      let shouldShowCoins = false;
      let isPlayerWin = false;
      let isDraw = result === 'draw';
      
      if (isDraw) {
        // Always show coins for draws
        shouldShowCoins = true;
      } else {
        // Determine if the human player won
        if (gameMode === 'single') {
          // In single player: Determine human symbol based on who goes first
          const humanSymbol = playerGoesFirst ? 'X' : 'O';
          isPlayerWin = result === humanSymbol;
          shouldShowCoins = isPlayerWin; // Only show if human wins
        } else if (gameMode === 'two-player') {
          // In two-player: Both are human, so show coins for any win
          isPlayerWin = true;
          shouldShowCoins = true;
        } else if (gameMode === 'online') {
          // In online: playerOne is always the human player
          // Human is 'X' in online mode (they always go first)
          isPlayerWin = result === 'X';
          shouldShowCoins = isPlayerWin; // Only show if human wins
        }
      }
      
      if (shouldShowCoins) {
        // Just get the reward amount for display (don't award coins again)
        const coinInfo = coinService.getCoinInfo();
        let rewardAmount = 0;
        
        if (isDraw) {
          rewardAmount = coinInfo['Draw Bonus'];
        } else if (isPlayerWin) {
          switch (gameMode) {
            case 'single':
              switch (difficulty) {
                case 'easy': rewardAmount = coinInfo['Easy AI Win']; break;
                case 'medium': rewardAmount = coinInfo['Medium AI Win']; break;
                case 'hard': rewardAmount = coinInfo['Hard AI Win']; break;
              }
              break;
            case 'two-player':
              rewardAmount = coinInfo['Local Multiplayer Win'];
              break;
            case 'online':
              rewardAmount = coinInfo['Online Win'];
              break;
          }
        }
        
        setCoinReward(rewardAmount);
        setShowCoinAnimation(true);
        
        // Hide animation after 3 seconds
        setTimeout(() => {
          setShowCoinAnimation(false);
        }, 3000);
      } else {
        // No coins to show
        setCoinReward(null);
        setShowCoinAnimation(false);
      }
    }
  }, [isOpen, result, gameMode, difficulty, playerGoesFirst]);

  if (!result) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) {
      onClose();
    }
  };

  const getResultInfo = () => {
    if (result === 'draw') {
      return {
        title: "Perfect Balance!",
        subtitle: "It's a beautiful draw! 🤝",
        description: "You both played wonderfully. Great minds think alike!",
        accessibilityDescription: "The game ended in a draw between both players",
        icon: <Handshake className="h-16 w-16 text-yellow-500" />,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-700',
        winner: null
      };
    }
    
    // Determine winner based on game mode and player positions
    let winner: PlayerData;
    let isPlayerOneWin: boolean;
    
    if (gameMode === 'single') {
      // In single player: playerOne is human, playerTwo is AI
      // Winner depends on who has the winning symbol
      const humanSymbol = playerGoesFirst ? 'X' : 'O';
      isPlayerOneWin = result === humanSymbol;
      winner = isPlayerOneWin ? playerOne : playerTwo;
    } else {
      // In other modes: X=playerOne, O=playerTwo
      isPlayerOneWin = result === 'X';
      winner = isPlayerOneWin ? playerOne : playerTwo;
    }
    
    return {
      title: `${winner.name} Wins!`,
      subtitle: isPlayerOneWin ? "🎉 Fantastic victory!" : "🎊 Amazing triumph!",
      description: gameMode === 'single' && !isPlayerOneWin
        ? "The AI got you this time! But don't worry - every game makes you stronger." 
        : gameMode === 'online'
        ? `Congratulations! That was an excellent online match.`
        : `Congratulations ${winner.name}! That was some excellent gameplay.`,
      accessibilityDescription: `Game over. ${winner.name} won the game by playing as ${result}.`,
      icon: <Trophy className={`h-16 w-16 ${isPlayerOneWin ? 'text-blue-500' : 'text-red-500'}`} />,
      color: isPlayerOneWin ? 'text-blue-500' : 'text-red-500',
      bgColor: isPlayerOneWin ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20',
      borderColor: isPlayerOneWin ? 'border-blue-200 dark:border-blue-700' : 'border-red-200 dark:border-red-700',
      winner
    };
  };

  const getPlayerDisplayInfo = (isPlayerOne: boolean) => {
    if (gameMode === 'single') {
      if (isPlayerOne) {
        // Player One is always the human
        const humanSymbol = playerGoesFirst ? 'X' : 'O';
        return {
          player: playerOne,
          symbol: humanSymbol,
          label: `Player (${humanSymbol})`
        };
      } else {
        // Player Two is the AI
        const aiSymbol = playerGoesFirst ? 'O' : 'X';
        return {
          player: playerTwo,
          symbol: aiSymbol,
          label: `AI (${aiSymbol})`
        };
      }
    } else {
      // Two-player and online modes
      if (isPlayerOne) {
        return {
          player: playerOne,
          symbol: 'X' as const,
          label: 'Player X'
        };
      } else {
        return {
          player: playerTwo,
          symbol: 'O' as const,
          label: 'Player O'
        };
      }
    }
  };

  const { title, subtitle, description, accessibilityDescription, icon, color, bgColor, borderColor, winner } = getResultInfo();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={`sm:max-w-md border-2 ${borderColor} shadow-2xl`}>
        <DialogHeader>
          <DialogDescription className="sr-only">
            {accessibilityDescription}
          </DialogDescription>
          <div className="flex flex-col items-center space-y-6 py-6">
            {/* Icon with background */}
            <div className={`p-6 rounded-full ${bgColor} animate-in zoom-in-50 duration-500`}>
              {icon}
            </div>
            
            {/* Winner avatar and info */}
            {winner && (
              <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-2 duration-700">
                <AvatarDisplay avatar={winner.avatar} size="lg" />
                <div className="text-center">
                  <DialogTitle className={`text-3xl ${color}`}>
                    {title}
                  </DialogTitle>
                  <p className="text-lg text-muted-foreground mt-1">
                    {subtitle}
                  </p>
                </div>
              </div>
            )}

            {/* Draw case */}
            {!winner && (
              <div className="text-center space-y-2 animate-in slide-in-from-bottom-2 duration-700">
                <DialogTitle className={`text-3xl ${color}`}>
                  {title}
                </DialogTitle>
                <p className="text-lg text-muted-foreground">
                  {subtitle}
                </p>
              </div>
            )}
            
            {/* Description */}
            <p className="text-sm text-muted-foreground max-w-sm text-center animate-in slide-in-from-bottom-2 duration-700 delay-200">
              {description}
            </p>

            {/* Coin Reward - Only show if coins were actually awarded */}
            {coinReward && coinReward > 0 && (
              <div className={`${
                showCoinAnimation 
                  ? 'animate-in zoom-in-50 fade-in-0 duration-500 delay-300' 
                  : 'animate-out zoom-out-50 fade-out-0 duration-300'
              }`}>
                <div className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-800/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-2 bg-yellow-500 rounded-full animate-bounce">
                      <Coins className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                        +{coinReward} Coins Earned!
                      </div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        {result === 'draw' ? 'Draw bonus' : 'Victory reward'}
                      </div>
                    </div>
                    <div className="text-2xl animate-spin">🪙</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Game info badges */}
            <div className="flex flex-wrap justify-center gap-2 animate-in slide-in-from-bottom-2 duration-700 delay-300">
              {gameMode === 'online' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Online Match
                </Badge>
              )}
              
              {result !== 'draw' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {result === 'X' ? 'Team Red' : 'Team Blue'} Victory
                </Badge>
              )}
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-500 fill-current" />
                Great Game!
              </Badge>
              
              {/* Only show coin badge if coins were actually awarded */}
              {coinReward && coinReward > 0 && (
                <Badge className="bg-yellow-500 text-white border-yellow-600 flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  +{coinReward} coins
                </Badge>
              )}
            </div>

            {/* Player stats */}
            <div className={`w-full p-4 ${bgColor} rounded-xl animate-in slide-in-from-bottom-2 duration-700 delay-400`}>
              <div className="space-y-3">
                <p className="text-center text-sm font-medium">Final Match</p>
                <div className="flex justify-between items-center">
                  {/* Player One */}
                  {(() => {
                    const playerInfo = getPlayerDisplayInfo(true);
                    const isWinner = result === playerInfo.symbol;
                    return (
                      <div className="flex items-center gap-2">
                        <AvatarDisplay avatar={playerInfo.player.avatar} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{playerInfo.player.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {playerInfo.label}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Player One Result */}
                  <div className="text-2xl">
                    {(() => {
                      const playerInfo = getPlayerDisplayInfo(true);
                      const isWinner = result === playerInfo.symbol;
                      return isWinner ? '🏆' : result === 'draw' ? '🤝' : '';
                    })()}
                  </div>
                  
                  <div className="text-2xl">VS</div>
                  
                  {/* Player Two Result */}
                  <div className="text-2xl">
                    {(() => {
                      const playerInfo = getPlayerDisplayInfo(false);
                      const isWinner = result === playerInfo.symbol;
                      return isWinner ? '🏆' : result === 'draw' ? '🤝' : '';
                    })()}
                  </div>
                  
                  {/* Player Two */}
                  {(() => {
                    const playerInfo = getPlayerDisplayInfo(false);
                    const isWinner = result === playerInfo.symbol;
                    return (
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium text-right">{playerInfo.player.name}</p>
                          <p className="text-xs text-muted-foreground text-right">
                            {playerInfo.label}
                          </p>
                        </div>
                        <AvatarDisplay avatar={playerInfo.player.avatar} size="sm" />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        {/* Action buttons */}
        <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-500 delay-500">
          <Button 
            onClick={onPlayAgain}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            size="lg"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
          <Button 
            onClick={onGoHome}
            variant="outline"
            className="w-full border-primary/30 hover:bg-primary/10"
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}