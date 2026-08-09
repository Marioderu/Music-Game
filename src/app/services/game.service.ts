import { computed, Injectable, signal } from '@angular/core';
import { Song } from '../models/song.model';
import { SONGS } from '../data/data';
import { AudioService } from './audio.service';

const INITIAL_SECONDS = 2;
const SECONDS_INCREMENT = 2;
const REVEALED_SECONDS = 20;
const MAX_ATTEMPTS = 3;
const RANDOM_START_MIN_PERCENT = 0.25;
const RANDOM_START_MAX_PERCENT = 0.75;

export type GamePhase = 'notInitialized' | 'loading' | 'listening' | 'waitingAnswer' | 'revealed';

export type Result = 'correct' | 'incorrect' | null;

export interface Round {
  rounds: number;
  selected: boolean;
}

export interface GameState {
  currentSong: Song | null;
  attempt: number;
  currentRound: number;
  playSeconds: number;
  currentTime: number;
  totalSongs: number;
  showAnswer: boolean;
  phase: GamePhase;
  correctAnswers: number;
  guessResult: Result;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private songs: Song[] = [...SONGS];
  private usedSongs = signal<Set<Song>>(new Set());
  private stateSignal = signal<GameState>({
    currentSong: null,
    attempt: 0,
    currentRound: 1,
    playSeconds: INITIAL_SECONDS,
    currentTime: 0,
    totalSongs: SONGS.length,
    showAnswer: false,
    phase: 'notInitialized',
    correctAnswers: 0,
    guessResult: null,
  });
  readonly readUsedSongs = this.usedSongs.asReadonly();
  readonly readState = this.stateSignal.asReadonly();
  readonly answer = computed(() => {
    const song = this.stateSignal().currentSong;

    if (!song || !this.stateSignal().showAnswer) return '';

    return `${song.title} - ${song.artist}`;
  });

  constructor(private audioService: AudioService) {}

  async startGame(): Promise<void> {
    this.stateSignal.update((state) => ({
      ...state,
      phase: 'waitingAnswer',
      guessResult: null,
    }));
    await this.setupNextSong();
  }

  async nextSong(): Promise<void> {
    await this.setupNextSong();

    this.stateSignal.update((state) => ({
      ...state,
      phase: 'waitingAnswer',
      wrongGuess: false,
      guessResult: null,
      currentRound: state.currentRound + 1,
    }));
  }

  private async setupNextSong(): Promise<void> {
    const availableSongs = this.songs.filter((s) => !this.usedSongs().has(s));

    if (availableSongs.length === 0) {
      this.resetUsedSongs();
      return this.setupNextSong();
    }

    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    const song = availableSongs[randomIndex];

    // this.usedSongs.update((songs) => songs.add(song));
    this.stateSignal.update((state) => ({
      ...state,
      currentSong: song,
      attempt: 0,
      playSeconds: INITIAL_SECONDS,
      showAnswer: false,
    }));

    this.audioService.loadSong(song.file);

    await this.waitForDuration();
  }

  private async playCurrentSong(): Promise<void> {
    if (!this.stateSignal().currentSong) return;

    if (this.stateSignal().attempt === 1) {
      this.stateSignal.update((state) => ({
        ...state,
        currentTime: this.getRandomStartTime(this.audioService.getDuration()),
      }));
    }

    await this.audioService.playFromTimeForSeconds(
      this.stateSignal().currentTime,
      this.stateSignal().playSeconds,
    );
  }

  private waitForDuration(): Promise<void> {
    return new Promise((resolve) => {
      const checkDuration = () => {
        const duration = this.audioService.getDuration();
        if (duration && !isNaN(duration) && duration > 0) {
          resolve();
        } else {
          setTimeout(checkDuration, 50);
        }
      };
      checkDuration();
    });
  }

  private getRandomStartTime(duration: number): number {
    if (!duration || isNaN(duration) || duration <= 0) {
      return 0;
    }
    const minStart = duration * RANDOM_START_MIN_PERCENT;
    const maxStart = duration * RANDOM_START_MAX_PERCENT;
    return minStart + Math.random() * (maxStart - minStart);
  }

  async replay(revealed: boolean): Promise<void> {
    if (!this.stateSignal().currentSong || this.stateSignal().phase === 'loading') return;

    const nextAttempt = revealed ? this.stateSignal().attempt : this.stateSignal().attempt + 1;
    const nextPlaySeconds = revealed
      ? REVEALED_SECONDS
      : this.stateSignal().attempt === 0
        ? INITIAL_SECONDS
        : this.stateSignal().playSeconds + SECONDS_INCREMENT;

    this.stateSignal.update((state) => ({
      ...state,
      attempt: nextAttempt,
      playSeconds: nextPlaySeconds,
      phase: 'listening',
    }));

    await this.playCurrentSong();

    this.stateSignal.update((state) => ({
      ...state,
      phase: 'waitingAnswer',
      currentTime: this.audioService.getCurrentTime(),
    }));
  }

  revealAnswer(): void {
    this.usedSongs.update((songs) => songs.add(this.stateSignal().currentSong!));
    this.stateSignal.update((state) => ({
      ...state,
      showAnswer: true,
      phase: 'revealed',
      guessResult: null,
    }));
    this.replay(true);
  }

  guessSong(song: Song): void {
    if (
      song.title === this.stateSignal().currentSong?.title &&
      song.artist === this.stateSignal().currentSong?.artist
    ) {
      // Acierto
      this.stateSignal.update((state) => ({
        ...state,
        correctAnswers: state.correctAnswers + 1,
        guessResult: 'correct',
      }));
      this.revealAnswer();
    } else {
      // Fallo
      this.stateSignal.update((state) => ({
        ...state,
        guessResult: 'incorrect',
      }));
    }
  }

  private resetGame(): void {
    this.usedSongs.set(new Set());
    this.stateSignal.set({
      currentSong: null,
      attempt: 0,
      currentRound: 1,
      playSeconds: INITIAL_SECONDS,
      currentTime: 0,
      totalSongs: this.songs.length,
      showAnswer: false,
      phase: 'notInitialized',
      correctAnswers: 0,
      guessResult: null,
    });
  }

  private resetUsedSongs(): void {
    this.usedSongs.set(new Set());
  }
}
