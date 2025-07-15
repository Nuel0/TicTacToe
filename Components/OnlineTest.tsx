import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { onlineGameService, GameState } from './OnlineGameService';
import { PlayerData } from '../App';

export function OnlineTest() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerSymbol, setPlayerSymbol] = useState<'X' | 'O' | null>(null);
  const [opponent, setOpponent] = useState<PlayerData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-10), `${timestamp}: ${message}`]);
    console.log(`[OnlineTest] ${message}`);
  };

  useEffect(() => {
    // Set up event listeners
    onlineGameService.setOnConnectionStatusChange((status) => {
      setIsConnected(status === 'connected');
      addLog(`Connection: ${status}`);
    });

    onlineGameService.setOnGameStateChange((state) => {
      setGameState(state);
      addLog(`Game updated - Turn: ${state.currentPlayer}, Moves: ${state.moveHistory.length - 1}`);
    });

    onlineGameService.setOnMatchFound((opp, roomId, symbol) => {
      setOpponent(opp);
      setPlayerSymbol(symbol);
      addLog(`Match found! You are ${symbol} vs ${opp.name}`);
    });

    return () => {
      onlineGameService.setOnGameStateChange(() => {});
      onlineGameService.setOnMatchFound(() => {});
    };
  }, []);

  const startTest = async () => {
    addLog('Starting online test...');
    
    try {
      const testPlayer: PlayerData = { name: 'TestPlayer', avatar: 'bear' };
      
      await onlineGameService.connect(testPlayer);
      addLog('Connected successfully');
      
      await onlineGameService.findMatch(testPlayer);
      addLog('Finding match...');
      
    } catch (error) {
      addLog(`Error: ${error}`);
    }
  };

  const makeMove = (position: number) => {
    if (!gameState || !playerSymbol) {
      addLog('Cannot make move - no game state');
      return;
    }

    if (gameState.currentPlayer !== playerSymbol) {
      addLog('Cannot make move - not your turn');
      return;
    }

    if (gameState.board[position] !== null) {
      addLog('Cannot make move - cell occupied');
      return;
    }

    addLog(`Making move at position ${position}`);
    const success = onlineGameService.makeMove(position);
    addLog(`Move result: ${success ? 'SUCCESS' : 'FAILED'}`);
  };

  const resetTest = () => {
    addLog('Resetting test');
    onlineGameService.resetGame();
    setLogs([]);
  };

  const stopTest = () => {
    addLog('Stopping test');
    onlineGameService.leaveGame();
    onlineGameService.disconnect();
    setGameState(null);
    setPlayerSymbol(null);
    setOpponent(null);
    setIsConnected(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Online Opponent Move Test
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Controls */}
        <div className="flex gap-2">
          <Button onClick={startTest} disabled={isConnected} size="sm">
            Start Test
          </Button>
          <Button onClick={resetTest} disabled={!gameState} variant="outline" size="sm">
            Reset Game
          </Button>
          <Button onClick={stopTest} disabled={!isConnected} variant="destructive" size="sm">
            Stop Test
          </Button>
        </div>

        {/* Game Info */}
        {gameState && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Game Status</h3>
              <div className="text-sm space-y-1">
                <div><strong>Your Symbol:</strong> {playerSymbol}</div>
                <div><strong>Current Turn:</strong> {gameState.currentPlayer}</div>
                <div><strong>Your Turn:</strong> {gameState.currentPlayer === playerSymbol ? 'YES ✅' : 'NO ❌'}</div>
                <div><strong>Game Result:</strong> {gameState.gameResult || 'Playing...'}</div>
                <div><strong>Moves Made:</strong> {gameState.moveHistory.length - 1}</div>
                {opponent && <div><strong>Opponent:</strong> {opponent.name}</div>}
              </div>
            </div>

            {/* Game Board */}
            <div className="space-y-2">
              <h3 className="font-medium">Board</h3>
              <div className="grid grid-cols-3 gap-1">
                {gameState.board.map((cell, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-12 w-12 text-lg"
                    onClick={() => makeMove(index)}
                    disabled={
                      !!cell || 
                      !!gameState.gameResult || 
                      gameState.currentPlayer !== playerSymbol
                    }
                  >
                    {cell || ''}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            🎯 Test Instructions
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <div>1. Click "Start Test" to begin</div>
            <div>2. Wait for matchmaking to find an opponent</div>
            <div>3. Make your first move by clicking any cell</div>
            <div>4. ⏰ Opponent should move automatically after exactly 1 second</div>
            <div>5. Check the logs to see the detailed timing</div>
          </div>
        </div>

        {/* Logs */}
        <div className="space-y-2">
          <h3 className="font-medium">Event Log</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono h-32 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No events yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="whitespace-nowrap">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expected Behavior */}
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
            ✅ Expected Behavior
          </h4>
          <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <div>• After you make a move, opponent should respond in exactly 1 second</div>
            <div>• You should see "Scheduling opponent move in 1 second..." in console</div>
            <div>• Then "OPPONENT MOVE EXECUTION" after 1 second</div>
            <div>• The board should update and it becomes your turn again</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}