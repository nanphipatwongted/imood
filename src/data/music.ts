export interface MusicStation {
  id: string;
  name: string;
  /** YouTube video ID — YouTube hosts and licenses the audio. */
  youtubeId: string;
}

// Live-stream IDs change whenever the channel restarts a stream (and
// YouTube's `live_stream?channel=` embed doesn't work for these channels), so
// check the live ones before launch. Regular uploads like 'study' don't expire.
// Look up a title: https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json
export const stations: MusicStation[] = [
  { id: 'lofi', name: 'Lofi Hip Hop', youtubeId: 'rFZHOHl-L8A' }, // live, checked Oct 2026
  { id: 'study', name: 'Study Session', youtubeId: 'lTRiuFIWV54' }, // regular upload
  { id: 'synthwave', name: 'Synthwave', youtubeId: '4xDzrJKXOOY' }, // live, checked Oct 2026
];

export const defaultStation = stations[0];

export function embedUrl(youtubeId: string) {
  return `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&controls=0&playsinline=1`;
}
