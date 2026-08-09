import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audio: HTMLAudioElement = new Audio();
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private durationPromiseResolve: (() => void) | null = null;

  constructor() {
    this.audio.preload = 'auto';
  }

  loadSong(file: string): void {
    this.stop();
    this.audio.src = file;
    this.audio.load();
  }

  play(): void {
    this.audio.play().catch(() => {});
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.pause();
    this.clearStopTimer();
  }

  reset(): void {
    this.audio.currentTime = 0;
  }

  playForSeconds(seconds: number): Promise<void> {
    return this.playFromTimeForSeconds(0, seconds);
  }

  playFromTimeForSeconds(startTime: number, seconds: number): Promise<void> {
    return new Promise((resolve) => {
      this.stop();
      this.durationPromiseResolve = resolve;
      this.audio.currentTime = startTime;
      this.play();

      this.stopTimer = setTimeout(() => {
        this.stop();
        this.durationPromiseResolve = null;
        resolve();
      }, seconds * 1000);

      this.audio.onended = () => {
        this.clearStopTimer();
        if (this.durationPromiseResolve) {
          this.durationPromiseResolve();
          this.durationPromiseResolve = null;
        }
      };
    });
  }

  private clearStopTimer(): void {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getDuration(): number {
    return this.audio.duration;
  }

  isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended;
  }

  cleanup(): void {
    this.stop();
    this.audio.src = '';
    this.audio.load();
  }
}
