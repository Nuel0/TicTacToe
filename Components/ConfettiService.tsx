// Confetti service for victory celebrations
export class ConfettiService {
  private static instance: ConfettiService;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: ConfettiParticle[] = [];
  private animationId: number | null = null;
  private isAnimating = false;

  private constructor() {}

  static getInstance(): ConfettiService {
    if (!ConfettiService.instance) {
      ConfettiService.instance = new ConfettiService();
    }
    return ConfettiService.instance;
  }

  // Trigger confetti celebration
  celebrate(): void {
    console.log('🎉 Starting confetti celebration!');
    
    // Stop any existing animation first
    this.stopAnimation();
    
    this.createCanvas();
    this.createParticles();
    this.startAnimation();

    // Auto-stop after 4 seconds
    setTimeout(() => {
      this.stopAnimation();
    }, 4000);

    // Handle window resize during animation
    const handleResize = () => {
      if (this.canvas) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up resize listener when animation stops
    setTimeout(() => {
      window.removeEventListener('resize', handleResize);
    }, 4100);
  }

  private createCanvas(): void {
    // Remove existing canvas if it exists
    if (this.canvas) {
      this.canvas.remove();
    }

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    if (!this.canvas || !this.ctx) return;

    // Style the canvas
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    
    // Set canvas size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    document.body.appendChild(this.canvas);
  }

  private createParticles(): void {
    this.particles = [];
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
      '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7', '#fdcb6e'
    ];

    // Responsive particle count based on screen size
    const screenWidth = window.innerWidth;
    const particleCount = screenWidth < 768 ? 60 : screenWidth < 1024 ? 80 : 100;
    
    // Create regular confetti particles
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new ConfettiParticle(colors, false));
    }
    
    // Create some larger burst particles for initial impact
    const burstCount = Math.floor(particleCount * 0.2);
    for (let i = 0; i < burstCount; i++) {
      this.particles.push(new ConfettiParticle(colors, true));
    }
  }

  private startAnimation(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.animate();
  }

  private animate(): void {
    if (!this.ctx || !this.canvas || !this.isAnimating) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update();
      particle.draw(this.ctx);

      // Remove particles that are off screen (with buffer zone)
      if (particle.y > this.canvas.height + 20 || 
          particle.x < -50 || 
          particle.x > this.canvas.width + 50) {
        this.particles.splice(i, 1);
      }
    }

    // Continue animation if particles exist
    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.stopAnimation();
    }
  }

  private stopAnimation(): void {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Clean up canvas
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
    
    console.log('🎊 Confetti celebration ended!');
  }
}

class ConfettiParticle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public rotation: number;
  public rotationSpeed: number;
  public size: number;
  public color: string;
  public shape: 'rectangle' | 'circle';

  constructor(colors: string[], isBurst: boolean = false) {
    if (isBurst) {
      // Burst particles start from center and explode outward
      this.x = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
      this.y = window.innerHeight / 3 + (Math.random() - 0.5) * 100;
      this.vx = (Math.random() - 0.5) * 12; // Strong horizontal velocity
      this.vy = (Math.random() - 0.5) * 8 - 2; // Can go up initially
      this.size = Math.random() * 10 + 6; // Larger size
    } else {
      // Regular confetti falls from top
      this.x = Math.random() * (window.innerWidth + 200) - 100;
      this.y = -20;
      this.vx = (Math.random() - 0.5) * 6; // Horizontal drift
      this.vy = Math.random() * 4 + 1; // Falling speed
      this.size = Math.random() * 6 + 3; // Regular size
    }
    
    // Random rotation
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 15;
    
    // Random color
    this.color = colors[Math.floor(Math.random() * colors.length)];
    
    // More rectangles for classic confetti look
    this.shape = Math.random() > 0.3 ? 'rectangle' : 'circle';
  }

  update(): void {
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Update rotation
    this.rotation += this.rotationSpeed;
    
    // Add slight gravity and air resistance
    this.vy += 0.1;
    this.vx *= 0.999;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Move to particle position and rotate
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    
    // Add subtle glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 3;
    
    // Set color
    ctx.fillStyle = this.color;
    
    // Draw shape
    if (this.shape === 'rectangle') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

// Export singleton instance
export const confettiService = ConfettiService.getInstance();