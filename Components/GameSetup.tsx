import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AvatarSelector } from './AvatarSelector';
import { ArrowLeft, ArrowRight, Users, Bot, Star, Sparkles, Zap, UserCheck, GamepadIcon, Globe, Wifi, CheckCircle, Play, Timer } from 'lucide-react';
import { CoinDisplay } from './CoinDisplay';
import { GameMode, Difficulty, Avatar, PlayerData } from '../App';

interface GameSetupProps {
  onStartGame: (mode: GameMode, difficulty: Difficulty, playerOne: PlayerData, playerTwo: PlayerData, playerGoesFirst?: boolean) => void;
  onBack: () => void;
}

export function GameSetup({ onStartGame, onBack }: GameSetupProps) {
  const [step, setStep] = useState(1);
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [playerGoesFirst, setPlayerGoesFirst] = useState<boolean>(true);
  const [playerOneName, setPlayerOneName] = useState('');
  const [playerOneAvatar, setPlayerOneAvatar] = useState<Avatar>('bear');
  const [playerTwoName, setPlayerTwoName] = useState('');
  const [playerTwoAvatar, setPlayerTwoAvatar] = useState<Avatar>('fox');

  // Updated step flow: 
  // Single player: 1=Mode, 2=Difficulty, 3=Player Setup, 4=Turn Order
  // Two player: 1=Mode, 2=Player Setup  
  // Online: 1=Mode, 2=Player Setup
  const totalSteps = gameMode === 'online' ? 2 : 
                   gameMode === 'single' ? 4 : 
                   2;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleModeSelect = (mode: GameMode) => {
    setGameMode(mode);
  };

  const canProceedFromStep = () => {
    switch (step) {
      case 1: return true; // Mode selection always allows proceed
      case 2: 
        if (gameMode === 'online') {
          return playerOneName.trim().length > 0;
        } else if (gameMode === 'two-player') {
          return playerOneName.trim().length > 0 && playerTwoName.trim().length > 0;
        }
        return true; // Difficulty selection always allows proceed
      case 3: 
        if (gameMode === 'single') {
          return playerOneName.trim().length > 0; // Player name input step
        }
        return true;
      case 4:
        if (gameMode === 'single') {
          return true; // Turn order selection always allows proceed
        }
        return true;
      default: return false;
    }
  };

  const handleStartGame = () => {
    const p1: PlayerData = {
      name: playerOneName.trim() || 'Player 1',
      avatar: playerOneAvatar
    };
    
    const p2: PlayerData = {
      name: gameMode === 'single' 
        ? getDifficultyAIName()
        : (playerTwoName.trim() || 'Player 2'),
      avatar: gameMode === 'single' ? 'owl' : playerTwoAvatar
    };
    
    console.log('🚀 Starting game with:', { gameMode, difficulty, p1, p2, playerGoesFirst });
    onStartGame(gameMode, difficulty, p1, p2, playerGoesFirst);
  };

  const getDifficultyAIName = () => {
    switch (difficulty) {
      case 'easy': return 'Friendly AI';
      case 'medium': return 'Smart AI';
      case 'hard': return 'Master AI';
      default: return 'AI';
    }
  };

  const getDifficultyIcon = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return <Star className="h-4 w-4" />;
      case 'medium': return <Sparkles className="h-4 w-4" />;
      case 'hard': return <Zap className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
    }
  };

  const getAvatarEmoji = (avatar: Avatar) => {
    switch (avatar) {
      case 'bear': return '🐻';
      case 'fox': return '🦊';
      case 'owl': return '🦉';
      case 'rabbit': return '🐰';
      case 'squirrel': return '🐿️';
      case 'deer': return '🦌';
      case 'cat': return '🐱';
      case 'dog': return '🐶';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-20 sm:w-32 h-20 sm:h-32 bg-primary/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 sm:bottom-20 left-10 sm:left-20 w-24 sm:w-40 h-24 sm:h-40 bg-accent/30 rounded-full blur-xl"></div>
      </div>

      <div className="w-full max-w-sm sm:max-w-lg space-y-4 sm:space-y-6 relative z-10">
        {/* Header */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-primary/10 w-8 h-8 sm:w-10 sm:h-10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <CardTitle className="text-base sm:text-lg">Game Setup</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">Step {step} of {totalSteps}</p>
              </div>
              <div className="w-8 sm:w-10" />
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Step Content */}
        <Card className="border-2 border-primary/20 shadow-lg min-h-[400px] sm:min-h-[500px]">
          <CardContent className="p-4 sm:p-6">
            {/* Step 1: Game Mode */}
            {step === 1 && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
                <div className="text-center space-y-2">
                  <h3 className="text-lg sm:text-xl">Choose Your Adventure</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">How would you like to play today?</p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <Button
                    variant={gameMode === 'single' ? 'default' : 'outline'}
                    size="lg"
                    className={`w-full p-4 sm:p-6 h-auto ${gameMode === 'single' ? 'bg-primary shadow-lg' : 'hover:bg-primary/10'}`}
                    onClick={() => handleModeSelect('single')}
                  >
                    <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0 max-w-full">
                      <div className={`p-2 sm:p-3 rounded-full ${gameMode === 'single' ? 'bg-primary-foreground/20' : 'bg-primary/10'} flex-shrink-0`}>
                        <Bot className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <div className="text-left flex-1 min-w-0 overflow-hidden pr-2">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm sm:text-base flex-shrink-0">Single Player</span>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">vs AI</Badge>
                        </div>
                        <div className="text-xs sm:text-sm opacity-80 leading-tight mobile-multiline overflow-wrap-anywhere">Challenge our friendly AI companions</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant={gameMode === 'two-player' ? 'default' : 'outline'}
                    size="lg"
                    className={`w-full p-4 sm:p-6 h-auto ${gameMode === 'two-player' ? 'bg-primary shadow-lg' : 'hover:bg-primary/10'}`}
                    onClick={() => handleModeSelect('two-player')}
                  >
                    <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0 max-w-full">
                      <div className={`p-2 sm:p-3 rounded-full ${gameMode === 'two-player' ? 'bg-primary-foreground/20' : 'bg-primary/10'} flex-shrink-0`}>
                        <Users className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <div className="text-left flex-1 min-w-0 overflow-hidden pr-2">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm sm:text-base flex-shrink-0">Local Co-op</span>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Same Device</Badge>
                        </div>
                        <div className="text-xs sm:text-sm opacity-80 leading-tight mobile-multiline overflow-wrap-anywhere">Play with a friend beside you</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant={gameMode === 'online' ? 'default' : 'outline'}
                    size="lg"
                    className={`w-full p-4 sm:p-6 h-auto ${gameMode === 'online' ? 'bg-primary shadow-lg' : 'hover:bg-primary/10'}`}
                    onClick={() => handleModeSelect('online')}
                  >
                    <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0 max-w-full">
                      <div className={`p-2 sm:p-3 rounded-full ${gameMode === 'online' ? 'bg-primary-foreground/20' : 'bg-primary/10'} flex-shrink-0`}>
                        <Globe className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <div className="text-left flex-1 min-w-0 overflow-hidden pr-2">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm sm:text-base flex-shrink-0">Online Play</span>
                          <Badge variant="secondary" className="text-xs flex items-center gap-1 flex-shrink-0">
                            <Wifi className="h-3 w-3" />
                            Beta
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm opacity-80 leading-tight mobile-multiline overflow-wrap-anywhere">Match with players worldwide</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Difficulty (for Single Player) */}
            {step === 2 && gameMode === 'single' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
                <div className="text-center space-y-2">
                  <h3 className="text-lg sm:text-xl">Choose Your Challenge</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">Pick your AI opponent's personality</p>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                    <div key={diff} className="w-full">
                      <Button
                        variant={difficulty === diff ? 'default' : 'outline'}
                        size="lg"
                        className={`w-full p-3 sm:p-4 h-auto justify-start ${difficulty === diff ? 'bg-primary shadow-lg' : 'hover:bg-primary/10'}`}
                        onClick={() => setDifficulty(diff)}
                      >
                        <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0 max-w-full">
                          <div className={`p-1.5 sm:p-2 rounded-full ${difficulty === diff ? 'bg-primary-foreground/20' : 'bg-primary/10'} flex-shrink-0`}>
                            {getDifficultyIcon(diff)}
                          </div>
                          <div className="text-left flex-1 min-w-0 overflow-hidden pr-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="capitalize text-sm sm:text-base flex-shrink-0">{diff} AI</span>
                              <div className={`w-2 h-2 rounded-full ${getDifficultyColor(diff)} flex-shrink-0`} />
                            </div>
                            <div className="text-xs sm:text-sm opacity-80 leading-[1.4] mobile-multiline overflow-wrap-anywhere">
                              {diff === 'easy' && 'Friendly and makes mistakes - you should win most games!'}
                              {diff === 'medium' && 'Competitive Challenger - AI might win 60% of games'}
                              {diff === 'hard' && 'Master Strategies - AI might win 85% of the games'}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Player Setup (Single Player only) */}
            {step === 3 && gameMode === 'single' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
                {/* Header Section */}
                <div className="text-center space-y-2 sm:space-y-3">
                  <div className="p-3 sm:p-4 bg-primary/10 rounded-full w-fit mx-auto">
                    <UserCheck className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl text-foreground">Set Up Your Profile</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">Personalize your gaming experience</p>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {/* Player One Setup */}
                  <div className="space-y-3 sm:space-y-4 p-4 sm:p-5 bg-card/50 rounded-2xl border border-border/50 backdrop-blur-sm">
                    {/* Player 1 Avatar Preview */}
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center border-4 border-primary/30 shadow-lg">
                        <span className="text-3xl sm:text-4xl">{getAvatarEmoji(playerOneAvatar)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <Label className="text-xs sm:text-sm font-medium text-foreground">
                        Your Profile
                      </Label>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Input
                          placeholder="Enter your name..."
                          value={playerOneName}
                          onChange={(e) => setPlayerOneName(e.target.value)}
                          className="text-center bg-input-background border-border/50 focus:border-primary/50 rounded-xl h-10 sm:h-12"
                          autoFocus
                        />
                      </div>
                      
                      <AvatarSelector
                        selectedAvatar={playerOneAvatar}
                        onSelectAvatar={setPlayerOneAvatar}
                        size="md"
                      />
                    </div>

                    {/* Playing as text for Player 1 */}
                    <div className="text-center pt-2">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Playing as{' '}
                        <span className="capitalize font-medium text-foreground">
                          {playerOneAvatar}
                        </span>{' '}
                        <span className="text-sm sm:text-base">{getAvatarEmoji(playerOneAvatar)}</span>
                      </p>
                    </div>
                  </div>

                  {/* AI Preview for single player */}
                  <div className="space-y-3 sm:space-y-4 p-4 sm:p-5 bg-card/50 rounded-2xl border border-border/50 backdrop-blur-sm opacity-75">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                      <Label className="text-xs sm:text-sm font-medium text-foreground">
                        Your Opponent
                      </Label>
                    </div>
                    
                    <div className="text-center space-y-2 sm:space-y-3">
                      <div className="w-12 sm:w-16 h-12 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto border-2 border-primary/20">
                        <span className="text-xl sm:text-2xl">🦉</span>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-foreground">{getDifficultyAIName()}</p>
                        <p className="text-xs text-muted-foreground">
                          AI always uses the wise owl
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Turn Order (for Single Player only) */}
            {step === 4 && gameMode === 'single' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
                <div className="text-center space-y-2">
                  <h3 className="text-lg sm:text-xl">Who Goes First?</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">Choose the turn order for your game</p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <Button
                    variant={playerGoesFirst ? 'default' : 'outline'}
                    size="lg"
                    className={`w-full p-4 sm:p-6 h-auto ${playerGoesFirst ? 'bg-primary shadow-lg' : 'hover:bg-primary/10'}`}
                    onClick={() => setPlayerGoesFirst(true)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0 max-w-full">
                      <div className={`p-2 sm:p-3 rounded-full ${playerGoesFirst ? 'bg-primary-foreground/20' : 'bg-primary/10'} flex-shrink-0`}>
                        <Play className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <div className="text-left flex-1 min-w-0 overflow-hidden pr-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm sm:text-base flex-shrink-0">I Go First</span>
                          <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 flex-shrink-0">
                            X
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm opacity-80 leading-[1.4] mobile-multiline overflow-wrap-anywhere">You make the opening move and play as X</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant={!playerGoesFirst ? 'default' : 'outline'}
                    size="lg"
                    className={`w-full p-4 sm:p-6 h-auto ${!playerGoesFirst ? 'bg-primary shadow-lg' : 'hover:bg-primary/10'}`}
                    onClick={() => setPlayerGoesFirst(false)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0 max-w-full">
                      <div className={`p-2 sm:p-3 rounded-full ${!playerGoesFirst ? 'bg-primary-foreground/20' : 'bg-primary/10'} flex-shrink-0`}>
                        <Timer className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <div className="text-left flex-1 min-w-0 overflow-hidden pr-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm sm:text-base flex-shrink-0">AI Goes First</span>
                          <Badge variant="secondary" className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 flex-shrink-0">
                            O
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm opacity-80 leading-[1.4] mobile-multiline overflow-wrap-anywhere">Let the AI make the opening move, you play as O</div>
                      </div>
                    </div>
                  </Button>
                </div>

                {/* Turn order explanation */}
                <div className="bg-muted/50 rounded-xl p-3 sm:p-4 space-y-2">
                  <h4 className="text-xs sm:text-sm text-muted-foreground">🎯 Strategy Tip:</h4>
                  <p className="text-xs text-muted-foreground">
                    Going first (X) gives you the opening advantage, but going second (O) lets you react to the AI's strategy. 
                    Both choices offer unique gameplay experiences!
                  </p>
                </div>

                {/* Show current setup */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-3 sm:p-4 border border-primary/20">
                  <div className="text-center space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-primary">Ready to Start!</p>
                    <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-sm sm:text-base">{getAvatarEmoji(playerOneAvatar)}</span>
                        <span className="text-xs sm:text-sm">{playerOneName || 'You'}</span>
                        <Badge variant="secondary" className={`text-xs ${playerGoesFirst ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                          {playerGoesFirst ? 'X - First' : 'O - Second'}
                        </Badge>
                      </div>
                      <span className="text-xs">vs</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm sm:text-base">🦉</span>
                        <span className="text-xs sm:text-sm">{getDifficultyAIName()}</span>
                        <Badge variant="secondary" className={`text-xs ${!playerGoesFirst ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                          {!playerGoesFirst ? 'X - First' : 'O - Second'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Online Player Setup */}
            {step === 2 && gameMode === 'online' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
                {/* Selected Mode Summary */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-3 sm:p-4 border border-primary/20">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-primary/20 rounded-xl">
                      <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-primary text-sm sm:text-base">Online Play Selected</span>
                        <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
                          <Wifi className="h-3 w-3" />
                          Beta
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Ready to match with players worldwide! 🌍</p>
                    </div>
                  </div>
                </div>

                {/* Player Setup Header */}
                <div className="text-center space-y-2 sm:space-y-3">
                  <div className="p-3 sm:p-4 bg-primary/10 rounded-full w-fit mx-auto">
                    <UserCheck className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl text-foreground">Create Your Online Profile</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">This is how other players will see you</p>
                  </div>
                </div>

                {/* Large Avatar Preview - Outside the profile card */}
                <div className="flex justify-center">
                  <div className="w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center border-4 border-primary/30 shadow-lg">
                    <span className="text-4xl sm:text-5xl">{getAvatarEmoji(playerOneAvatar)}</span>
                  </div>
                </div>

                {/* Player Profile Setup */}
                <div className="space-y-3 sm:space-y-4 p-4 sm:p-5 bg-card/50 rounded-2xl border border-border/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive"></div>
                    <Label className="text-xs sm:text-sm font-medium text-foreground">Your Profile</Label>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Input
                        placeholder="Your display name..."
                        value={playerOneName}
                        onChange={(e) => setPlayerOneName(e.target.value)}
                        className="text-center bg-input-background border-border/50 focus:border-primary/50 rounded-xl h-10 sm:h-12"
                        autoFocus
                      />
                    </div>
                    
                    <AvatarSelector
                      selectedAvatar={playerOneAvatar}
                      onSelectAvatar={setPlayerOneAvatar}
                      size="md"
                    />
                  </div>
                </div>

                {/* Playing as text */}
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Playing as{' '}
                    <span className="capitalize font-medium text-foreground">
                      {playerOneAvatar}
                    </span>{' '}
                    <span className="text-sm sm:text-base">{getAvatarEmoji(playerOneAvatar)}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Player Setup for Two Player Mode */}
            {step === 2 && gameMode === 'two-player' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
                {/* Header Section */}
                <div className="text-center space-y-2 sm:space-y-3">
                  <div className="p-3 sm:p-4 bg-primary/10 rounded-full w-fit mx-auto">
                    <UserCheck className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl text-foreground">Set Up Both Players</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">Get both players ready for the game</p>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {/* Player One Setup */}
                  <div className="space-y-3 sm:space-y-4 p-4 sm:p-5 bg-card/50 rounded-2xl border border-border/50 backdrop-blur-sm">
                    {/* Player 1 Avatar Preview */}
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center border-4 border-primary/30 shadow-lg">
                        <span className="text-3xl sm:text-4xl">{getAvatarEmoji(playerOneAvatar)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <Label className="text-xs sm:text-sm font-medium text-foreground">Player 1 (X)</Label>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Input
                          placeholder="Enter Player 1's name..."
                          value={playerOneName}
                          onChange={(e) => setPlayerOneName(e.target.value)}
                          className="text-center bg-input-background border-border/50 focus:border-primary/50 rounded-xl h-10 sm:h-12"
                          autoFocus
                        />
                      </div>
                      
                      <AvatarSelector
                        selectedAvatar={playerOneAvatar}
                        onSelectAvatar={setPlayerOneAvatar}
                        size="md"
                      />
                    </div>
                  </div>

                  {/* Player Two Setup */}
                  <div className="space-y-3 sm:space-y-4 p-4 sm:p-5 bg-card/50 rounded-2xl border border-border/50 backdrop-blur-sm">
                    {/* Player 2 Avatar Preview */}
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center border-4 border-primary/30 shadow-lg">
                        <span className="text-3xl sm:text-4xl">{getAvatarEmoji(playerTwoAvatar)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <Label className="text-xs sm:text-sm font-medium text-foreground">Player 2 (O)</Label>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Input
                          placeholder="Enter Player 2's name..."
                          value={playerTwoName}
                          onChange={(e) => setPlayerTwoName(e.target.value)}
                          className="text-center bg-input-background border-border/50 focus:border-primary/50 rounded-xl h-10 sm:h-12"
                        />
                      </div>
                      
                      <AvatarSelector
                        selectedAvatar={playerTwoAvatar}
                        onSelectAvatar={setPlayerTwoAvatar}
                        size="md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            className="flex-1 border-primary/30 hover:bg-primary/10 h-10 sm:h-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Back</span>
          </Button>
          
          {step < totalSteps ? (
            <Button
              onClick={nextStep}
              disabled={!canProceedFromStep()}
              className="flex-1 bg-primary hover:bg-primary/90 h-10 sm:h-auto"
            >
              <span className="text-sm sm:text-base">Next</span>
              <ArrowRight className="h-4 w-4 ml-1 sm:ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleStartGame}
              disabled={!canProceedFromStep()}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg h-10 sm:h-auto"
            >
              <GamepadIcon className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">{gameMode === 'online' ? 'Find Match!' : 'Start Game!'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}