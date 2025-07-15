import { PlayerData } from '../App';

export type GameState = {
  board: ('X' | 'O' | null)[];
  currentPlayer: 'X' | 'O';
  gameResult: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null;
  moveHistory: ('X' | 'O' | null)[][];
};

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type MatchmakingStatus = 'idle' | 'searching' | 'found' | 'in_game';

class OnlineGameService {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private matchmakingStatus: MatchmakingStatus = 'idle';
  private gameState: GameState | null = null;
  private currentRoomId: string | null = null;
  private playerId: string | null = null;
  private playerSymbol: 'X' | 'O' | null = null;
  private opponent: PlayerData | null = null;
  private opponentMoveTimeout: NodeJS.Timeout | null = null;
  private matchmakingTimeout: NodeJS.Timeout | null = null;
  
  // Event listeners
  private onConnectionStatusChange: ((status: ConnectionStatus) => void) | null = null;
  private onMatchmakingStatusChange: ((status: MatchmakingStatus) => void) | null = null;
  private onGameStateChange: ((state: GameState) => void) | null = null;
  private onMatchFound: ((opponent: PlayerData, roomId: string, symbol: 'X' | 'O') => void) | null = null;
  private onOpponentLeft: (() => void) | null = null;
  private onError: ((message: string) => void) | null = null;

  // Demo opponents
  private demoOpponents: PlayerData[] = [
    { name: 'Alex_Pro', avatar: 'fox' },
    { name: 'Sarah_Strategic', avatar: 'owl' },
    { name: 'Mike_Master', avatar: 'bear' },
    { name: 'Emma_Expert', avatar: 'rabbit' },
    { name: 'Chris_Champion', avatar: 'deer' },
    { name: 'Luna_Legend', avatar: 'cat' },
    { name: 'Max_Mighty', avatar: 'dog' },
    { name: 'Zoe_Zen', avatar: 'squirrel' }
  ];

  constructor() {
    this.playerId = this.generatePlayerId();
    console.log('🎮 OnlineGameService initialized');
  }

  private generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substring(2, 15);
  }

  private generateRoomId(): string {
    return 'room_' + Math.random().toString(36).substring(2, 15);
  }

  // Connection Management
  async connect(player: PlayerData): Promise<void> {
    console.log('🔌 Connecting to demo service...');
    this.setConnectionStatus('connecting');

    return new Promise((resolve) => {
      setTimeout(() => {
        this.setConnectionStatus('connected');
        console.log('✅ Demo connection established');
        resolve();
      }, 1000);
    });
  }

  disconnect(): void {
    console.log('🔌 Disconnecting...');
    this.clearOpponentMoveTimeout();
    this.clearMatchmakingTimeout();
    this.setConnectionStatus('disconnected');
    this.setMatchmakingStatus('idle');
    this.currentRoomId = null;
    this.opponent = null;
    this.playerSymbol = null;
    this.gameState = null;
  }

  // Matchmaking
  async findMatch(player: PlayerData): Promise<void> {
    // Prevent multiple concurrent matchmaking attempts
    if (this.matchmakingStatus !== 'idle') {
      console.log('⚠️ Already in matchmaking, status:', this.matchmakingStatus);
      return;
    }

    // Ensure we're connected first
    if (this.connectionStatus !== 'connected') {
      console.log('⚠️ Not connected, cannot start matchmaking');
      return;
    }

    console.log('🔍 Starting matchmaking for player:', player.name);
    this.setMatchmakingStatus('searching');

    // Clear any existing timeout
    this.clearMatchmakingTimeout();

    // Simulate search time (2-4 seconds)
    const searchTime = 2000 + Math.random() * 2000;
    
    this.matchmakingTimeout = setTimeout(() => {
      // Double-check we're still in searching state
      if (this.matchmakingStatus !== 'searching') {
        console.log('⚠️ Matchmaking status changed during search, aborting');
        return;
      }

      const randomOpponent = this.demoOpponents[
        Math.floor(Math.random() * this.demoOpponents.length)
      ];
      
      const roomId = this.generateRoomId();
      // ALWAYS assign player as 'X' so they can make the first move
      const symbol: 'X' = 'X';
      
      console.log('🎯 Match found!');
      console.log('👤 Your symbol: X (You always go first!)');
      console.log('🤖 Opponent:', randomOpponent.name, '(will be O)');
      
      this.currentRoomId = roomId;
      this.opponent = randomOpponent;
      this.playerSymbol = symbol;
      
      this.setMatchmakingStatus('found');
      this.onMatchFound?.(randomOpponent, roomId, symbol);
      
      // Initialize game state
      this.gameState = {
        board: Array(9).fill(null),
        currentPlayer: 'X', // X always goes first, and player is always X
        gameResult: null,
        winningLine: null,
        moveHistory: [Array(9).fill(null)]
      };
      
      setTimeout(() => {
        // Only proceed if we're still in the found state
        if (this.matchmakingStatus === 'found') {
          this.setMatchmakingStatus('in_game');
          this.onGameStateChange?.(this.gameState!);
          console.log('🚀 Game started!');
          console.log('🎮 You are X - make the first move!');
          console.log('🤖 Opponent is O - will respond after you move');
        }
      }, 1000);
      
    }, searchTime);
  }

  cancelMatchmaking(): void {
    console.log('❌ Cancelling matchmaking');
    this.clearMatchmakingTimeout();
    this.clearOpponentMoveTimeout();
    this.setMatchmakingStatus('idle');
    
    // Reset game-related state
    this.currentRoomId = null;
    this.opponent = null;
    this.playerSymbol = null;
    this.gameState = null;
  }

  // Game Actions
  makeMove(position: number): boolean {
    console.log('\n🎯 === PLAYER MAKING MOVE ===');
    console.log('Position:', position);
    console.log('Game state exists:', !!this.gameState);
    console.log('Game result:', this.gameState?.gameResult);
    console.log('Cell occupied:', this.gameState?.board[position]);
    console.log('Current player:', this.gameState?.currentPlayer);
    console.log('Your symbol:', this.playerSymbol);
    console.log('Is your turn:', this.gameState?.currentPlayer === this.playerSymbol);

    if (!this.gameState) {
      console.log('❌ No game state');
      return false;
    }
    
    if (this.gameState.gameResult) {
      console.log('❌ Game is over');
      return false;
    }
    
    if (this.gameState.board[position] !== null) {
      console.log('❌ Cell is occupied');
      return false;
    }
    
    if (this.gameState.currentPlayer !== this.playerSymbol) {
      console.log('❌ Not your turn');
      return false;
    }

    console.log('✅ Move is valid, processing...');

    // Clear any pending opponent move
    this.clearOpponentMoveTimeout();

    // Apply player move immediately
    const newBoard = [...this.gameState.board];
    newBoard[position] = this.playerSymbol!;
    
    console.log('📝 Applied your move (X), board:', newBoard);

    // Update game state
    this.gameState = {
      ...this.gameState,
      board: newBoard,
      currentPlayer: 'O', // Switch to opponent (O)
      moveHistory: [...this.gameState.moveHistory, newBoard]
    };

    // Check for winner after player move
    const { winner, line } = this.checkWinner(this.gameState.board);
    if (winner) {
      console.log('🏆 Game over after your move! Winner:', winner);
      this.gameState.gameResult = winner;
      this.gameState.winningLine = line;
      this.onGameStateChange?.(this.gameState);
      return true;
    }

    console.log('🔄 Game continues, opponent\'s turn (O)');

    // Notify UI immediately
    this.onGameStateChange?.(this.gameState);

    // Schedule opponent move after exactly 1 second
    console.log('⏰ Scheduling opponent move in exactly 1 second...');
    this.scheduleOpponentMove();

    return true;
  }

  private scheduleOpponentMove(): void {
    console.log('⏱️ Starting opponent thinking timer...');
    
    this.opponentMoveTimeout = setTimeout(() => {
      console.log('\n🤖 === OPPONENT MOVE EXECUTION ===');
      this.executeOpponentMove();
    }, 1000); // Exactly 1 second
  }

  private executeOpponentMove(): void {
    if (!this.gameState) {
      console.log('❌ No game state for opponent move');
      return;
    }

    if (this.gameState.gameResult) {
      console.log('❌ Game is already over');
      return;
    }

    if (this.gameState.currentPlayer !== 'O') {
      console.log('❌ Not opponent\'s turn');
      return;
    }

    console.log('🤖 Opponent (O) making move after thinking...');
    console.log('Current board:', this.gameState.board);

    // Get empty cells
    const emptyCells = this.gameState.board
      .map((cell, index) => cell === null ? index : -1)
      .filter(index => index !== -1);

    console.log('📋 Available empty cells:', emptyCells);

    if (emptyCells.length === 0) {
      console.log('❌ No empty cells available');
      return;
    }

    // Pick random cell for opponent
    const randomPosition = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    console.log('🎯 Opponent chooses position:', randomPosition);
    
    // Apply opponent move
    const newBoard = [...this.gameState.board];
    newBoard[randomPosition] = 'O';
    
    // Update game state - switch back to player (X)
    this.gameState = {
      ...this.gameState,
      board: newBoard,
      currentPlayer: 'X', // Back to player's turn
      moveHistory: [...this.gameState.moveHistory, newBoard]
    };

    console.log('📝 Opponent move applied, new board:', newBoard);

    // Check for winner after opponent move
    const { winner, line } = this.checkWinner(this.gameState.board);
    if (winner) {
      console.log('🏆 Game over after opponent move! Winner:', winner);
      this.gameState.gameResult = winner;
      this.gameState.winningLine = line;
    } else {
      console.log('🔄 Game continues, back to your turn (X)');
    }

    // Notify UI
    console.log('📢 Updating UI with opponent\'s move');
    this.onGameStateChange?.(this.gameState);
  }

  private clearOpponentMoveTimeout(): void {
    if (this.opponentMoveTimeout) {
      console.log('🚫 Clearing opponent move timeout');
      clearTimeout(this.opponentMoveTimeout);
      this.opponentMoveTimeout = null;
    }
  }

  private clearMatchmakingTimeout(): void {
    if (this.matchmakingTimeout) {
      console.log('🚫 Clearing matchmaking timeout');
      clearTimeout(this.matchmakingTimeout);
      this.matchmakingTimeout = null;
    }
  }

  resetGame(): void {
    console.log('🔄 Resetting game - you remain X');
    this.clearOpponentMoveTimeout();
    
    this.gameState = {
      board: Array(9).fill(null),
      currentPlayer: 'X', // Player is always X
      gameResult: null,
      winningLine: null,
      moveHistory: [Array(9).fill(null)]
    };
    
    this.onGameStateChange?.(this.gameState);
    console.log('✨ New game ready - you (X) can make the first move!');
  }

  leaveGame(): void {
    console.log('🚪 Leaving game');
    this.clearOpponentMoveTimeout();
    this.clearMatchmakingTimeout();
    this.setMatchmakingStatus('idle');
    this.currentRoomId = null;
    this.opponent = null;
    this.playerSymbol = null;
    this.gameState = null;
  }

  // Utility methods
  private checkWinner(board: ('X' | 'O' | null)[]): { winner: 'X' | 'O' | 'draw' | null; line: number[] | null } {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a] as 'X' | 'O', line };
      }
    }

    if (board.every(cell => cell !== null)) {
      return { winner: 'draw', line: null };
    }

    return { winner: null, line: null };
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.onConnectionStatusChange?.(status);
  }

  private setMatchmakingStatus(status: MatchmakingStatus): void {
    this.matchmakingStatus = status;
    this.onMatchmakingStatusChange?.(status);
  }

  // Event listener setters
  setOnConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.onConnectionStatusChange = callback;
  }

  setOnMatchmakingStatusChange(callback: (status: MatchmakingStatus) => void): void {
    this.onMatchmakingStatusChange = callback;
  }

  setOnGameStateChange(callback: (state: GameState) => void): void {
    this.onGameStateChange = callback;
  }

  setOnMatchFound(callback: (opponent: PlayerData, roomId: string, symbol: 'X' | 'O') => void): void {
    this.onMatchFound = callback;
  }

  setOnOpponentLeft(callback: () => void): void {
    this.onOpponentLeft = callback;
  }

  setOnError(callback: (message: string) => void): void {
    this.onError = callback;
  }

  // Getters
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  getMatchmakingStatus(): MatchmakingStatus {
    return this.matchmakingStatus;
  }

  getGameState(): GameState | null {
    return this.gameState;
  }

  getOpponent(): PlayerData | null {
    return this.opponent;
  }

  getPlayerSymbol(): 'X' | 'O' | null {
    return this.playerSymbol;
  }

  getRoomId(): string | null {
    return this.currentRoomId;
  }
}

// Export singleton instance
export const onlineGameService = new OnlineGameService();