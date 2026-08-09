import { Component, input } from '@angular/core';
import { Song } from '../../models/song.model';

@Component({
  selector: 'app-search-item',
  imports: [],
  templateUrl: './search-item.html',
  styleUrl: './search-item.css',
})
export class SearchItem {
  song = input.required<Song>();
  selectSuggestion = input.required<() => void>();

  onSelect() {
    this.selectSuggestion()();
  }
}
