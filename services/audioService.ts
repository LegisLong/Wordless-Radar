
export class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.3; // Master volume
    } catch (e) {
      console.warn("AudioContext not supported");
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    // Re-init if missing (sometimes needed on reloads or specific browser states)
    if (!this.ctx) {
         try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.3;
        } catch(e) {}
    }
  }

  public setVolume(value: number) {
    if (this.masterGain && this.ctx) {
        // Clamp between 0 and 1. value input is 0.0 to 1.0
        const safeValue = Math.max(0, Math.min(1, value));
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(safeValue, this.ctx.currentTime);
    }
  }

  playSuccess() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Arpeggio
    const notes = [440, 554.37, 659.25, 880]; // A Major
    notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + (i * 0.05));
        
        gain.gain.setValueAtTime(0, t + (i * 0.05));
        gain.gain.linearRampToValueAtTime(0.2, t + (i * 0.05) + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (i * 0.05) + 0.3);
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + (i * 0.05));
        osc.stop(t + (i * 0.05) + 0.3);
    });
  }

  playFailure() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Buzz sound
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(55, t + 0.3);
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playRuleViolation() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Dissonant dual tone
    [300, 315].forEach(freq => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.2);
    });
  }

  playLevelUp() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
    notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t + (i * 0.1));
        
        gain.gain.setValueAtTime(0.1, t + (i * 0.1));
        gain.gain.linearRampToValueAtTime(0.01, t + (i * 0.1) + 0.4);
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + (i * 0.1));
        osc.stop(t + (i * 0.1) + 0.4);
    });
  }

  playTick() {
      this.resume();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
  }

  playScan() {
      this.resume();
      if (!this.ctx || !this.masterGain) return;
      
      const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
  }
  
  playGameOver() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 1.5);
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 1.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.5);
  }

  playDragStart() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // High pitch blip
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.05);
    
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playDragEnd() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Mechanical thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.05);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

export const audioService = new AudioController();