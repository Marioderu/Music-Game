import { Component, input } from '@angular/core';
import { Song } from '../../../models/song.model';

@Component({
  selector: 'app-used-song',
  imports: [],
  templateUrl: './used-song.html',
  styleUrl: './used-song.css',
})
export class UsedSong {
  readonly song = input.required<Song>();
}
