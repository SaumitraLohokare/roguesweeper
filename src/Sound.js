
export class SoundManager {
    masterGain = null;

    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();

        // Create a master gain node to prevent clipping when multiple sounds play
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.4; // Reduce overall volume to leave headroom
        this.masterGain.connect(this.audioCtx.destination);
    }

    setMasterVolume(vol) {
        if (this.masterGain) {
            // Clamp between 0 and 1, then scale to max 0.5 to prevent clipping
            const v = Math.max(0, Math.min(1, vol)) * 0.5;
            this.masterGain.gain.setValueAtTime(v, this.audioCtx.currentTime);
        }
    }


    playTone(freq, type, duration, vol = 0.1, startTime = null) {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        };
        // Ensure start time is never in the past by adding a tiny buffer if using currentTime
        // If exact time is provided, use it but ensure it's not behind current time
        const now = this.audioCtx.currentTime;
        const start = startTime ? Math.max(startTime, now) : now + 0.005;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);

        // Envelope
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        // Connect to master gain instead of destination
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + duration);
    };

    playMove() {
        this.playTone(300, 'sine', 0.1, 0.05);
    };

    playReveal() {
        // Soft, high pitched pop, very short
        // Randomized slightly to avoid phasing artifacts on mass reveal
        const pitch = 800 + Math.random() * 200;
        this.playTone(pitch, 'sine', 0.08, 0.02);
    }

    playCoin() {
        this.playTone(1200, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1800, 'square', 0.2, 0.1), 50);
    };

    playAttack() {
        const duration = 0.1;
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.audioCtx.createGain();
        gain.gain.value = 0.1;
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        noise.connect(gain);
        // Connect to master gain
        gain.connect(this.masterGain);
        noise.start();
    };

    playDamage() { this.playTone(100, 'sawtooth', 0.3, 0.2) };

    playWin() {
        const now = this.audioCtx.currentTime;
        // Major arpeggio
        [440, 554.37, 659.25, 880].forEach((f, i) => {
            this.playTone(f, 'triangle', 0.15, 0.1, now + i * 0.1);
        });
        this.playTone(880, 'square', 0.4, 0.1, now + 0.4);
    };

    playLose() {
        [300, 200, 100].forEach((f, i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.4, 0.2), i * 200));
    }

    // --- Background Music ---
    musicLoopId = null;
    noteIndex = 0;

    startMusic() {
        if (this.musicLoopId) return;

        // Explicitly resume context here to ensure it wakes up on user interaction
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.noteIndex = 0;
        this.scheduleNextNote();
    }

    stopMusic() {
        if (this.musicLoopId) {
            clearTimeout(this.musicLoopId);
            this.musicLoopId = null;
        }
    }

    scheduleNextNote() {
        const tempo = 100; // Slightly slower for background
        const secondsPerBeat = 60 / tempo;
        const now = this.audioCtx.currentTime;

        // Expanded Melody (C Major / A Minor feel)
        // 0 = rest
        // Format: { f: frequency, d: duration_in_beats }
        // C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, B4=493.88
        // C3=130.81 (Bass)

        // Helper to generate notes
        const n = (freq, dur = 1) => ({ f: freq, d: dur });
        const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25;
        const A3 = 220.00, G3 = 196.00, E3 = 164.81;

        const melodySequence = [
            // Section A (Main Theme)
            n(E4, 0.5), n(G4, 0.5), n(A4, 1), n(E4, 0.5), n(D4, 0.5), n(C4, 1),
            n(A3, 0.5), n(C4, 0.5), n(D4, 0.5), n(E4, 0.5), n(D4, 1.5), n(0, 0.5),

            n(E4, 0.5), n(G4, 0.5), n(A4, 1), n(C5, 0.5), n(B4, 0.5), n(G4, 1),
            n(A4, 0.5), n(G4, 0.5), n(E4, 0.5), n(D4, 0.5), n(C4, 2),

            // Section B (Lower, more mysterious)
            n(A3, 1), n(C4, 1), n(E4, 1), n(A4, 1),
            n(G4, 1.5), n(F4, 0.5), n(E4, 2),
            n(D4, 0.5), n(E4, 0.5), n(F4, 1), n(E4, 1), n(C4, 1),
            n(D4, 2), n(0, 2),

            // Loop back transition
            n(E4, 0.5), n(D4, 0.5), n(C4, 3)
        ];

        const note = melodySequence[this.noteIndex];

        // Play the note if it's not a rest (freq > 0)
        if (note.f > 0) {
            // Use triangle/sine for soft background
            this.playTone(note.f, 'triangle', note.d * secondsPerBeat * 0.9, 0.03, now + 0.05);
        }

        this.noteIndex = (this.noteIndex + 1) % melodySequence.length;

        // Schedule next with Lookahead-ish logic (using setTimeout)
        const timeToNext = note.d * secondsPerBeat * 1000;

        this.musicLoopId = setTimeout(() => {
            this.scheduleNextNote();
        }, timeToNext);
    }
};

let soundManager;

export function getSoundManager() {
    if (!soundManager) {
        soundManager = new SoundManager();
    }
    return soundManager;
}
