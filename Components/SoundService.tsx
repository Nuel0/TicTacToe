// Sound service for generating game audio effects
export class SoundService {
  private static instance: SoundService;
  
  private constructor() {}
  
  static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }
  
  // Play enhanced sound effects
  playSound(type: 'move' | 'victory' | 'defeat' | 'draw', soundEnabled: boolean = true): void {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      switch (type) {
        case 'move':
          this.playMoveSound(audioContext);
          break;
        case 'victory':
          this.playVictorySound(audioContext);
          break;
        case 'defeat':
          this.playDefeatSound(audioContext);
          break;
        case 'draw':
          this.playDrawSound(audioContext);
          break;
      }
    } catch (error) {
      console.warn('Audio context not available:', error);
    }
  }
  
  private playMoveSound(audioContext: AudioContext): void {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }
  
  private playVictorySound(audioContext: AudioContext): void {
    // Victory melody: C-E-G-C (ascending triumph)
    const victoryNotes = [523.25, 659.25, 783.99, 1046.50]; // C5-E5-G5-C6
    
    victoryNotes.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);
      
      oscillator.start(audioContext.currentTime + i * 0.15);
      oscillator.stop(audioContext.currentTime + i * 0.15 + 0.3);
    });
    
    console.log('🎉 Victory sound played!');
  }
  
  private playDefeatSound(audioContext: AudioContext): void {
    // Defeat sound: Descending "boo" effect with wobble
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const lfo = audioContext.createOscillator(); // Low frequency oscillator for wobble
    const lfoGain = audioContext.createGain();
    
    // Connect LFO for frequency modulation (wobble effect)
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Main descending frequency
    oscillator.frequency.setValueAtTime(350, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.8);
    
    // LFO for wobble effect
    lfo.frequency.setValueAtTime(8, audioContext.currentTime); // 8Hz wobble
    lfoGain.gain.setValueAtTime(15, audioContext.currentTime); // Wobble depth
    
    // Main volume envelope
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
    
    oscillator.start(audioContext.currentTime);
    lfo.start(audioContext.currentTime);
    
    oscillator.stop(audioContext.currentTime + 1.0);
    lfo.stop(audioContext.currentTime + 1.0);
    
    console.log('👎 Defeat sound played with wobble effect!');
  }
  
  private playDrawSound(audioContext: AudioContext): void {
    // Draw sound: Neutral ascending-descending pattern
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(440, audioContext.currentTime + 0.25);
    oscillator.frequency.linearRampToValueAtTime(330, audioContext.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
    
    console.log('🤝 Draw sound played!');
  }
}

// Export singleton instance
export const soundService = SoundService.getInstance();