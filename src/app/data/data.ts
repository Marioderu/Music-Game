import { Song } from '../models/song.model';
import { Tribe } from '../models/tribe.model';
import songsData from '../../../public/songs-info.json';
import tribesData from '../../../public/tribes-info.json';

export const SONGS: Song[] = songsData as Song[];
export const TRIBES: Tribe[] = tribesData as Tribe[];
