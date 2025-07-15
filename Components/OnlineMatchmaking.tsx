import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AvatarDisplay } from './AvatarSelector';
import { ArrowLeft, Wifi, Globe, Users, Zap, Clock, CheckCircle, MapPin, AlertCircle } from 'lucide-react';
import { PlayerData } from '../App';
import { onlineGameService, ConnectionStatus, MatchmakingStatus } from './OnlineGameService';

interface OnlineMatchmakingProps {
  playerOne: PlayerData;
  onMatchFound: (opponent: PlayerData) => void;
  onBack: () => void;
}

export function OnlineMatchmaking({ playerOne, onMatchFound, onBack }: OnlineMatchmakingProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [matchmakingStatus, setMatchmakingStatus] = useState<MatchmakingStatus>('idle');
  const [searchProgress, setSearchProgress] = useState(0);
  const [matchedOpponent, setMatchedOpponent] = useState<PlayerData | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  
  // Add flags to prevent duplicate operations
  const isInitializedRef = useRef(false);
  const isMatchFoundRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    console.log('🎯 OnlineMatchmaking: Initializing...');

    // Set up event listeners
    onlineGameService.setOnConnectionStatusChange(setConnectionStatus);
    onlineGameService.setOnMatchmakingStatusChange(setMatchmakingStatus);
    onlineGameService.setOnError(setError);
    
    onlineGameService.setOnMatchFound((opponent, roomId, symbol) => {
      // Prevent duplicate match found events
      if (isMatchFoundRef.current) {
        console.log('⚠️ OnlineMatchmaking: Match already found, ignoring duplicate');
        return;
      }
      isMatchFoundRef.current = true;
      
      console.log('🎯 OnlineMatchmaking: Match found!', opponent);
      setMatchedOpponent(opponent);
      setRoomId(roomId);
      
      // Delay before calling onMatchFound to show the match result
      setTimeout(() => {
        onMatchFound(opponent);
      }, 2000);
    });

    // Connect to service and start matchmaking
    const initializeMatchmaking = async () => {
      try {
        console.log('🔌 OnlineMatchmaking: Connecting to service...');
        setError(null);
        await onlineGameService.connect(playerOne);
        
        // Start matchmaking after connection
        setTimeout(() => {
          console.log('🔍 OnlineMatchmaking: Starting matchmaking...');
          onlineGameService.findMatch(playerOne);
        }, 500);
        
      } catch (err) {
        console.error('❌ OnlineMatchmaking: Connection failed', err);
        setError('Failed to connect to matchmaking service');
      }
    };

    initializeMatchmaking();

    // Update search time
    const timeTimer = setInterval(() => {
      setSearchTime(prev => {
        const newTime = prev + 1;
        // Only update if we're still searching
        const currentStatus = onlineGameService.getMatchmakingStatus();
        return currentStatus === 'searching' ? newTime : prev;
      });
    }, 1000);

    // Update progress based on status
    const progressTimer = setInterval(() => {
      const currentStatus = onlineGameService.getMatchmakingStatus();
      
      if (currentStatus === 'searching') {
        setSearchProgress(prev => {
          const newProgress = prev + (Math.random() * 5);
          return newProgress > 60 ? 60 : newProgress;
        });
      } else if (currentStatus === 'found') {
        setSearchProgress(85);
      } else if (currentStatus === 'in_game') {
        setSearchProgress(100);
      }
    }, 200);

    // Cleanup function
    return () => {
      console.log('🧹 OnlineMatchmaking: Cleaning up...');
      clearInterval(timeTimer);
      clearInterval(progressTimer);
      
      // Only cancel if we haven't found a match yet
      if (!isMatchFoundRef.current) {
        onlineGameService.cancelMatchmaking();
      }
      
      // Reset the initialization flag for potential re-mounting
      isInitializedRef.current = false;
    };
  }, [playerOne, onMatchFound]); // Removed matchmakingStatus from dependencies

  const handleCancel = () => {
    console.log('🚫 OnlineMatchmaking: User cancelled');
    onlineGameService.cancelMatchmaking();
    onlineGameService.disconnect();
    onBack();
  };

  const handleRetry = async () => {
    console.log('🔄 OnlineMatchmaking: Retrying connection...');
    setError(null);
    isMatchFoundRef.current = false; // Reset match found flag
    
    try {
      await onlineGameService.connect(playerOne);
      onlineGameService.findMatch(playerOne);
    } catch (err) {
      console.error('❌ OnlineMatchmaking: Retry failed', err);
      setError('Failed to reconnect. Please try again.');
    }
  };

  const getStatusInfo = () => {
    if (error) {
      return {
        title: 'Connection Error',
        description: error,
        icon: <AlertCircle className="h-8 w-8 text-red-500" />,
        color: 'text-red-500'
      };
    }

    if (connectionStatus === 'connecting') {
      return {
        title: 'Connecting...',
        description: 'Connecting to matchmaking servers',
        icon: <Wifi className="h-8 w-8 animate-pulse text-primary" />,
        color: 'text-primary'
      };
    }

    switch (matchmakingStatus) {
      case 'searching':
        return {
          title: 'Finding Players...',
          description: 'Searching for players worldwide',
          icon: <Globe className="h-8 w-8 animate-spin text-primary" />,
          color: 'text-blue-500'
        };
      case 'found':
        return {
          title: 'Player Found!',
          description: 'Perfect match found! Preparing game...',
          icon: <Users className="h-8 w-8 text-green-500" />,
          color: 'text-green-500'
        };
      case 'in_game':
        return {
          title: 'Ready to Play!',
          description: 'Connecting to game room...',
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          color: 'text-green-500'
        };
      default:
        return {
          title: 'Preparing...',
          description: 'Setting up matchmaking',
          icon: <Zap className="h-8 w-8 animate-pulse text-primary" />,
          color: 'text-primary'
        };
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressValue = () => {
    if (error) return 0;
    if (connectionStatus === 'connecting') return 20;
    return searchProgress;
  };

  const { title, description, icon, color } = getStatusInfo();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-accent/30 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-primary/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handleCancel} className="hover:bg-primary/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <CardTitle className="text-lg">Online Matchmaking</CardTitle>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(searchTime)}
                  </Badge>
                  <Badge 
                    variant={connectionStatus === 'connected' ? 'default' : 'destructive'} 
                    className="flex items-center gap-1"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500' : 
                      connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    {connectionStatus === 'connected' ? 'Online' : 
                     connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
                  </Badge>
                </div>
              </div>
              <div className="w-10" />
            </div>
            <Progress value={getProgressValue()} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Matchmaking Status */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Status Icon */}
              <div className="flex justify-center">
                <div className={`p-6 rounded-full ${
                  error ? 'bg-red-100 dark:bg-red-900/20' : 'bg-primary/10'
                }`}>
                  {icon}
                </div>
              </div>

              {/* Status Text */}
              <div className="space-y-2">
                <h3 className={`text-xl ${color}`}>{title}</h3>
                <p className="text-muted-foreground">{description}</p>
              </div>

              {/* Error Actions */}
              {error && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleRetry} size="sm">
                    Retry Connection
                  </Button>
                  <Button variant="outline" onClick={handleCancel} size="sm">
                    Go Back
                  </Button>
                </div>
              )}

              {/* Your Profile */}
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-3">Your Profile</p>
                <div className="flex items-center justify-center gap-3">
                  <AvatarDisplay avatar={playerOne.avatar} size="md" />
                  <div>
                    <p className="font-medium">{playerOne.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {connectionStatus === 'connected' ? 'Ready to play!' : 'Connecting...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Opponent Profile - Show when found */}
              {matchmakingStatus !== 'idle' && matchmakingStatus !== 'searching' && matchedOpponent && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Match Found!</p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <AvatarDisplay avatar={matchedOpponent.avatar} size="md" />
                    <div>
                      <p className="font-medium">{matchedOpponent.name}</p>
                      <p className="text-sm text-muted-foreground">Online now</p>
                    </div>
                  </div>
                  {roomId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Room: {roomId.slice(-8)}
                    </p>
                  )}
                </div>
              )}

              {/* Search Status Messages */}
              <div className="space-y-2">
                {!error && connectionStatus === 'connected' && matchmakingStatus === 'searching' && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-pulse flex space-x-1">
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-75"></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-150"></div>
                    </div>
                    <span>Looking for players worldwide...</span>
                  </div>
                )}
                
                {matchmakingStatus === 'found' && (
                  <div className="text-sm text-green-600 dark:text-green-400 animate-in fade-in-0 duration-500">
                    ✨ Great match found! Similar skill level detected
                  </div>
                )}
                
                {matchmakingStatus === 'in_game' && (
                  <div className="text-sm text-primary animate-in fade-in-0 duration-500">
                    🎮 Entering game room... Get ready!
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {/* Cancel/Back Button */}
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full border-primary/30 hover:bg-primary/10"
            disabled={matchmakingStatus === 'in_game'}
          >
            {error ? 'Go Back' : matchmakingStatus === 'in_game' ? 'Entering Game...' : 'Cancel Search'}
          </Button>

          {/* Demo Mode Notice */}
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="p-3">
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  🎭 Demo Mode Active
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  This is a simulation of real online multiplayer. In production, this would connect to actual players via WebSocket servers.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fun Facts */}
        <Card className="border-primary/10 bg-primary/5">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">🌍 Real-Time Features</p>
              <p className="text-xs text-muted-foreground">
                {searchTime < 5 && "✓ WebSocket connections for instant moves"}
                {searchTime >= 5 && searchTime < 10 && "✓ Smart matchmaking based on skill level"}
                {searchTime >= 10 && searchTime < 15 && "✓ Automatic reconnection on network issues"}
                {searchTime >= 15 && "✓ Global player pool from 50+ countries"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}