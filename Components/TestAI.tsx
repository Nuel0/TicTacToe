import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Difficulty } from '../App';

type Player = 'X' | 'O' | null;
type Board = Player[];

export function TestAI() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameResult, setGameResult] = useState<Player>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const checkWinner = (board: Board): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    if (board.every(cell => cell !== null)) return 'draw' as Player;
    return null;
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
    return checkWinner(testBoard) === player;
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

  // AI Strategy based on difficulty (same as GameBoard)
  const getAiMove = (board: Board): number => {
    const emptyCells = getEmptyCells(board);
    if (emptyCells.length === 0) return -1;

    switch (difficulty) {
      case 'easy':
        // Easy AI: 70% random moves, 30% strategic (but makes mistakes)
        if (Math.random() < 0.7) {
          return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        } else {
          const winningMove = findWinningMove(board, 'O');
          if (winningMove !== null && Math.random() < 0.6) {
            return winningMove;
          }
          
          const blockingMove = findWinningMove(board, 'X');
          if (blockingMove !== null && Math.random() < 0.4) {
            return blockingMove;
          }
          
          return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }

      case 'medium':
        // Medium AI: Always wins, usually blocks, decent strategy
        const winningMove = findWinningMove(board, 'O');
        if (winningMove !== null) {
          return winningMove;
        }
        
        const blockingMove = findWinningMove(board, 'X');
        if (blockingMove !== null) {
          return blockingMove;
        }
        
        if (board[4] === null) {
          return 4;
        }
        
        const corners = [0, 2, 6, 8].filter(i => board[i] === null);
        if (corners.length > 0) {
          return corners[Math.floor(Math.random() * corners.length)];
        }
        
        return emptyCells[0];

      case 'hard':
        // Hard AI: Uses best strategy
        const hardWinningMove = findWinningMove(board, 'O');
        if (hardWinningMove !== null) {
          return hardWinningMove;
        }
        
        const hardBlockingMove = findWinningMove(board, 'X');
        if (hardBlockingMove !== null) {
          return hardBlockingMove;
        }
        
        // Take center if available
        if (board[4] === null) return 4;
        
        // Take corners
        const hardCorners = [0, 2, 6, 8].filter(i => board[i] === null);
        if (hardCorners.length > 0) {
          return hardCorners[Math.floor(Math.random() * hardCorners.length)];
        }
        
        return emptyCells[0];

      default:
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
  };

  const makeAiMove = (currentBoard: Board) => {
    console.log(`🤖 TestAI (${difficulty.toUpperCase()}) making move!`);
    
    const aiMove = getAiMove(currentBoard);
    if (aiMove !== -1) {
      const newBoard = [...currentBoard];
      newBoard[aiMove] = 'O';
      setBoard(newBoard);
      console.log(`🤖 TestAI (${difficulty.toUpperCase()}) chose cell:`, aiMove);

      const winner = checkWinner(newBoard);
      if (winner) {
        setGameResult(winner);
        alert(`Winner: ${winner}`);
      } else {
        setCurrentPlayer('X');
      }
    }
    setIsAiThinking(false);
  };

  const handleCellClick = (index: number) => {
    if (board[index] || isAiThinking || gameResult) return;

    console.log('👤 Player clicked cell:', index);
    
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const winner = checkWinner(newBoard);
    if (winner) {
      setGameResult(winner);
      alert(`Winner: ${winner}`);
      return;
    }

    // Trigger AI move
    setCurrentPlayer('O');
    setIsAiThinking(true);
    
    setTimeout(() => {
      makeAiMove(newBoard);
    }, 1000);
  };

  const resetGame = () => {
    console.log(`🔄 TestAI reset (${difficulty.toUpperCase()})`);
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setIsAiThinking(false);
    setGameResult(null);
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          🧪 AI Difficulty Test
        </CardTitle>
        <div className="flex items-center justify-center gap-2">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
            <Button
              key={diff}
              variant={difficulty === diff ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDifficulty(diff);
                resetGame();
              }}
              className="text-xs"
            >
              <div className={`w-2 h-2 rounded-full ${getDifficultyColor(diff)} mr-1`} />
              {diff.toUpperCase()}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Status */}
          <div className="text-center">
            <Badge variant="secondary" className="flex items-center gap-1 w-fit mx-auto">
              <div className={`w-2 h-2 rounded-full ${getDifficultyColor(difficulty)}`} />
              {difficulty.toUpperCase()} AI vs Player
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {gameResult ? `Game Over: ${gameResult}` : 
               isAiThinking ? `${difficulty.toUpperCase()} AI Thinking...` : 
               `${currentPlayer}'s Turn`}
            </p>
          </div>

          {/* Game Board */}
          <div className="grid grid-cols-3 gap-2">
            {board.map((cell, index) => (
              <Button
                key={index}
                variant="outline"
                className="aspect-square text-2xl h-20 w-20"
                onClick={() => handleCellClick(index)}
                disabled={!!cell || isAiThinking || !!gameResult}
              >
                {cell || ''}
              </Button>
            ))}
          </div>
          
          <Button onClick={resetGame} className="w-full">
            🔄 Reset Test
          </Button>
          
          {/* Test Status */}
          <div className="text-xs space-y-1 bg-gray-100 dark:bg-gray-800 p-3 rounded border">
            <div><strong>🎮 Current Difficulty:</strong> {difficulty.toUpperCase()}</div>
            <div><strong>👤 Current Player:</strong> {currentPlayer}</div>
            <div><strong>🤖 AI Thinking:</strong> {isAiThinking ? 'YES ⏳' : 'NO ✅'}</div>
            <div><strong>🎯 Game Result:</strong> {gameResult || 'Playing...'}</div>
            <div><strong>📋 Empty Cells:</strong> {board.filter(cell => cell === null).length}</div>
            <div className="pt-1 border-t border-gray-300">
              <strong>🧠 AI Strategy:</strong> {
                difficulty === 'easy' ? 'Random moves, makes mistakes' :
                difficulty === 'medium' ? 'Balanced, blocks & wins' :
                'Smart strategy, hard to beat'
              }
            </div>
            <div className="pt-1 text-muted-foreground">
              <strong>📝 Instructions:</strong> Click any cell to play as X. Test different difficulty levels!
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}