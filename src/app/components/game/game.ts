import { Component, OnInit, OnDestroy, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, GamePhase, Round } from '../../services/game.service';
import { SONGS, TRIBES } from '../../data/data';
import { SearchItem } from '../search-item/search-item';
import { Song } from '../../models/song.model';
import { Tribe } from '../../models/tribe.model';
import { TribeComponent } from '../tribe/tribe';
import { RoundOption } from './round-option/round-option';
import { UsedSong } from './used-song/used-song';
import { TribeScore } from './tribe-score/tribe-score';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, SearchItem, TribeComponent, RoundOption, UsedSong, TribeScore],
  templateUrl: './game.html',
  styleUrl: './game.css',
})
export class GameComponent implements OnInit, OnDestroy {
  readonly tribes: Tribe[] = [...TRIBES];
  readonly state;
  readonly answer;
  readonly usedSongs;
  readonly tribeScores;
  readonly GamePhase: Record<GamePhase, GamePhase> = {
    notInitialized: 'notInitialized',
    loading: 'loading',
    listening: 'listening',
    waitingAnswer: 'waitingAnswer',
    revealed: 'revealed',
  };
  readonly selectedRounds = signal(5);
  readonly progress = signal(0);
  readonly search = signal('');
  readonly suggestions = computed(() => {
    const query = this.search().trim().toLowerCase();

    if (!query) return [];

    return SONGS.filter(
      (song) =>
        song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query),
    ).slice(0, 5);
  });
  private progressInterval?: number;
  readonly points = computed(() => {
    const state = this.state();

    if (state.attempt === 0 || state.guessResult !== 'correct') return 0;
    if (state.attempt === 1) return 5;
    if (state.attempt === 2) return 3;

    return 1;
  });
  readonly scoreAnimation = signal<{
    tribeId: number;
    points: number;
  } | null>(null);
  readonly isEndGame = computed(() => {
    const state = this.state();

    return state.currentRound === this.selectedRounds();
  });
  readonly showClassification = signal(false);
  readonly rankingRevealed = signal(false);
  readonly ranking = computed(() => {
    return this.tribes
      .map((tribe) => ({
        tribe,
        score: this.tribeScores()[tribe.id] ?? 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        position: index + 1,
      }));
  });

  constructor(private gameService: GameService) {
    this.state = gameService.readState;
    this.answer = gameService.answer;
    this.usedSongs = gameService.readUsedSongs;
    this.tribeScores = gameService.tribeScores;

    effect(() => {
      const state = this.state();

      if (state.phase === 'listening') {
        this.startProgress(state.playSeconds);
      } else {
        this.stopProgress();
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.stopProgress();
    this.gameService['audioService']?.cleanup();
  }

  onStartGame(): void {
    this.gameService.startGame();
  }

  onListen(): void {
    this.gameService.replay(false);
  }

  onNewSong(): void {
    this.gameService.nextSong();
  }

  onRevealAnswer(): void {
    this.gameService.revealAnswer(false);
  }

  startProgress(seconds: number) {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    this.progress.set(0);

    const start = performance.now();
    const duration = seconds * 1000;

    const interval = window.setInterval(() => {
      const elapsed = performance.now() - start;

      this.progress.set(Math.min((elapsed / duration) * 100, 100));

      if (elapsed >= duration) {
        clearInterval(interval);

        if (this.progressInterval === interval) {
          this.progressInterval = undefined;
        }

        this.progress.set(100);
      }
    }, 16);

    this.progressInterval = interval;
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.search.set(value);
  }

  onSelectSuggestion(song: Song): void {
    const guessed = this.gameService.guessSong(song);

    if (guessed) this.celebrate();

    this.search.set('');
  }

  onEmptySearch(): void {
    this.search.set('');
  }

  onAddTribeScore(tribeId: number): void {
    const points = this.points();

    if (points === 0) return;

    this.gameService.addTribeScore(tribeId, points);

    this.scoreAnimation.set({ tribeId, points });

    setTimeout(() => {
      this.scoreAnimation.set(null);
    }, 1000);

    this.onCloseScorePanel();
  }

  onOpenScorePanel(): void {
    this.gameService.setScorePanelVisible(true);
  }

  onCloseScorePanel(): void {
    this.gameService.setScorePanelVisible(false);
  }

  onShowClassification(): void {
    this.gameService.stopAudio();
    this.showClassification.set(true);
  }

  revealRanking(): void {
    this.rankingRevealed.set(true);
  }

  private stopProgress(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }

    this.progress.set(0);
  }

  private celebrate() {
    confetti({
      particleCount: 150,
      spread: 100,
      startVelocity: 45,
      origin: {
        x: 0.5,
        y: 0.6,
      },
      colors: ['#e9b93f', '#f3efe6', '#c69a33', '#ffffff'],
    });
  }
}
