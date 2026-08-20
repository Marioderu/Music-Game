import { computed, Injectable, signal } from '@angular/core';
import { Song } from '../models/song.model';
import { SONGS, TRIBES } from '../data/data';
import { AudioService } from './audio.service';

const INITIAL_SECONDS = 2;
const SECONDS_INCREMENT = 2;
const MAX_ATTEMPTS = 3;
export const REVEALED_SECONDS = 20;

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
  scorePanelVisible: boolean;
  scorePanelClosing: boolean;
  addScoreDisabled: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  readonly songs: Song[] = [...SONGS];
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
    scorePanelVisible: false,
    scorePanelClosing: false,
    addScoreDisabled: false,
  });
  private tribeScoresSignal = signal<Record<number, number>>(
    Object.fromEntries(TRIBES.map((tribe) => [tribe.id, 0])),
  );
  readonly tribeScores = this.tribeScoresSignal.asReadonly();
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

    this.stateSignal.update((state) => ({
      ...state,
      currentSong: song,
      attempt: 0,
      playSeconds: INITIAL_SECONDS,
      currentTime: 0,
      showAnswer: false,
    }));

    this.audioService.loadSong(song.guess);

    await this.waitForDuration();
  }

  private async playCurrentSong(): Promise<void> {
    const state = this.stateSignal();

    if (!state.currentSong) return;

    await this.audioService.playFromTimeForSeconds(state.currentTime, state.playSeconds);
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

  async replay(revealed: boolean): Promise<void> {
    const state = this.stateSignal();

    if (!state.currentSong || state.phase === 'loading') return;

    if (revealed) {
      await this.playRevealSong();
      return;
    }

    if (state.attempt >= MAX_ATTEMPTS) return;

    const nextAttempt = state.attempt + 1;
    const nextPlaySeconds = nextAttempt * SECONDS_INCREMENT;

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

  async revealAnswer(guessed: boolean): Promise<void> {
    const state = this.stateSignal();

    if (!state.currentSong || state.showAnswer) return;

    const song = state.currentSong;

    this.usedSongs.update((songs) => {
      const newSongs = new Set(songs);
      newSongs.add(song);
      return newSongs;
    });

    this.stateSignal.update((state) => ({
      ...state,
      showAnswer: true,
      phase: 'revealed',
      addScoreDisabled: !guessed,
    }));

    this.playRevealSong();
  }

  guessSong(song: Song): boolean {
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

      this.revealAnswer(true);
      return true;
    } else {
      // Fallo
      this.stateSignal.update((state) => ({
        ...state,
        guessResult: 'incorrect',
      }));

      return false;
    }
  }

  addTribeScore(tribeId: number, points: number): void {
    this.tribeScoresSignal.update((scores) => ({
      ...scores,
      [tribeId]: (scores[tribeId] ?? 0) + points,
    }));
  }

  setScorePanelVisible(visible: boolean): void {
    if (this.stateSignal().scorePanelVisible !== visible) {
      if (!visible) {
        this.stateSignal.update((state) => ({
          ...state,
          scorePanelClosing: true,
          addScoreDisabled: true,
        }));

        setTimeout(() => {
          this.stateSignal.update((state) => ({
            ...state,
            scorePanelVisible: false,
          }));
        }, 150);
      } else {
        this.stateSignal.update((state) => ({
          ...state,
          scorePanelVisible: true,
          scorePanelClosing: false,
        }));
      }
    }
  }

  stopAudio() {
    this.audioService.stop();
  }

  resetGame(): void {
    this.stopAudio();
    this.usedSongs.set(new Set());
    this.tribeScoresSignal.set(Object.fromEntries(TRIBES.map((tribe) => [tribe.id, 0])));
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
      scorePanelVisible: false,
      scorePanelClosing: false,
      addScoreDisabled: false,
    });
  }

  private async playRevealSong(): Promise<void> {
    const song = this.stateSignal().currentSong;

    if (!song) return;

    this.audioService.loadSong(song.reveal);

    await this.waitForDuration();

    await this.audioService.playFromTimeForSeconds(0, REVEALED_SECONDS);
  }

  private resetUsedSongs(): void {
    this.usedSongs.set(new Set());
  }
}
