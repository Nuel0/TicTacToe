import React, { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { GameSetup } from './components/GameSetup';
import { OnlineMatchmaking } from './components/OnlineMatchmaking';
import { GameBoard } from './components/GameBoard';
import { OnlineGameBoard } from './components/OnlineGameBoard';
import { Settings } from './components/Settings';
import { Achievements } from './components/Achievements';
import { IntroScreen } from './components/IntroScreen';
import { CoinDisplay } from './components/CoinDisplay';
import { aiPersonalityService } from './components/AIPersonalityService';
import { coinService } from './components/CoinService';
import { achievementService } from './components/AchievementService';

export type GameMode = 'single' | 'two-player' | 'online';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Screen = 'intro' | 'home' | 'setup' | 'matchmaking' | 'game' | 'online-game' | 'settings' | 'achievements';
export type Avatar = 'bear' | 'fox' | 'owl' | 'rabbit' | 'squirrel' | 'deer' | 'cat' | 'dog';

export interface PlayerData {
  name: string;
  avatar: Avatar;
}

export default function App() {
  // Always start with intro screen
  const [currentScreen, setCurrentScreen] = useState<Screen>('intro');
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [playerOne, setPlayerOne] = useState<PlayerData>({ name: '', avatar: 'bear' });
  const [playerTwo, setPlayerTwo] = useState<PlayerData>({ name: '', avatar: 'fox' });
  const [onlineOpponent, setOnlineOpponent] = useState<PlayerData | null>(null);
  const [playerGoesFirst, setPlayerGoesFirst] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [coins, setCoins] = useState(coinService.getCoins());

  // Initialize theme and settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('tictactoe-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    const savedSound = localStorage.getItem('tictactoe-sound');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }

    const savedFirstPlayer = localStorage.getItem('tictactoe-player-goes-first');
    if (savedFirstPlayer !== null) {
      setPlayerGoesFirst(savedFirstPlayer === 'true');
    }

    // Listen for achievement unlocks and award coins
    const handleAchievementUnlocked = (event: CustomEvent) => {
      const { achievement, coins } = event.detail;
      coinService.addCoins(coins, `Achievement: ${achievement.title}`);
      console.log(`🏆 Achievement Unlocked: ${achievement.title} (+${coins} coins)`);
    };

    window.addEventListener('achievementUnlocked', handleAchievementUnlocked as EventListener);

    return () => {
      window.removeEventListener('achievementUnlocked', handleAchievementUnlocked as EventListener);
    };
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('tictactoe-theme', isDarkMode ? 'dark' : 'light');
    
    // Track theme switching for achievements
    achievementService.recordThemeSwitch();
  }, [isDarkMode]);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('tictactoe-sound', soundEnabled.toString());
  }, [soundEnabled]);

  // Save first player preference
  useEffect(() => {
    localStorage.setItem('tictactoe-player-goes-first', playerGoesFirst.toString());
  }, [playerGoesFirst]);

  // Listen to coin changes
  useEffect(() => {
    const handleCoinChange = (stats: any) => {
      setCoins(stats.totalCoins);
      // Track coin earnings for achievements
      achievementService.recordCoinEarned(stats.totalCoins);
    };
    
    coinService.addListener(handleCoinChange);
    return () => coinService.removeListener(handleCoinChange);
  }, []);

  const completeIntro = () => {
    setCurrentScreen('home');
  };

  const startSetup = () => {
    setCurrentScreen('setup');
  };

  const startMatchmaking = (
    mode: GameMode, 
    diff: Difficulty, 
    p1: PlayerData, 
    p2: PlayerData,
    playerFirst?: boolean
  ) => {
    setGameMode(mode);
    setDifficulty(diff);
    setPlayerOne(p1);
    setPlayerTwo(p2);
    
    if (mode === 'single' && playerFirst !== undefined) {
      setPlayerGoesFirst(playerFirst);
    }
    
    // Record game start for achievements
    achievementService.recordGameStart(mode, 'center', p1.avatar);
    
    if (mode === 'online') {
      setCurrentScreen('matchmaking');
    } else {
      setCurrentScreen('game');
    }
  };

  const startGameWithOpponent = (opponent: PlayerData) => {
    setOnlineOpponent(opponent);
    setCurrentScreen('online-game');
  };

  const goHome = () => {
    setCurrentScreen('home');
    setPlayerOne({ name: '', avatar: 'bear' });
    setPlayerTwo({ name: '', avatar: 'fox' });
    setOnlineOpponent(null);
    setGameMode('single');
    setDifficulty('medium');
  };

  const goToSettings = () => {
    setCurrentScreen('settings');
  };

  const goToAchievements = () => {
    setCurrentScreen('achievements');
  };

  const goBackToSetup = () => {
    setCurrentScreen('setup');
  };

  const goBackToMatchmaking = () => {
    setCurrentScreen('matchmaking');
  };

  const goBackToSettings = () => {
    setCurrentScreen('settings');
  };

  const getEffectivePlayerTwo = (): PlayerData => {
    if (gameMode === 'online' && onlineOpponent) {
      return onlineOpponent;
    }
    if (gameMode === 'single') {
      const aiPersonality = aiPersonalityService.getAIPersonality(difficulty);
      return {
        name: aiPersonality.name,
        avatar: aiPersonality.avatar
      };
    }
    return playerTwo;
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {currentScreen === 'intro' && (
        <IntroScreen 
          onComplete={completeIntro}
        />
      )}
      {currentScreen === 'home' && (
        <Home 
          onStartSetup={startSetup}
          onSettings={goToSettings}
        />
      )}
      {currentScreen === 'setup' && (
        <GameSetup
          onStartGame={startMatchmaking}
          onBack={goHome}
        />
      )}
      {currentScreen === 'matchmaking' && (
        <OnlineMatchmaking
          playerOne={playerOne}
          onMatchFound={startGameWithOpponent}
          onBack={goBackToSetup}
        />
      )}
      {currentScreen === 'game' && (
        <GameBoard
          gameMode={gameMode}
          difficulty={difficulty}
          playerOne={playerOne}
          playerTwo={getEffectivePlayerTwo()}
          playerGoesFirst={playerGoesFirst}
          soundEnabled={soundEnabled}
          onGoHome={goHome}
          onGoBack={goBackToSetup}
          onSettings={goToSettings}
        />
      )}
      {currentScreen === 'online-game' && (
        <OnlineGameBoard
          playerOne={playerOne}
          playerTwo={onlineOpponent || playerTwo}
          soundEnabled={soundEnabled}
          onGoHome={goHome}
          onGoBack={goBackToMatchmaking}
          onSettings={goToSettings}
        />
      )}
      {currentScreen === 'settings' && (
        <Settings
          isDarkMode={isDarkMode}
          soundEnabled={soundEnabled}
          onToggleTheme={handleToggleTheme}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onBack={() => setCurrentScreen('home')}
          onViewAchievements={goToAchievements}
        />
      )}
      {currentScreen === 'achievements' && (
        <Achievements
          onBack={goBackToSettings}
        />
      )}
    </div>
  );
}