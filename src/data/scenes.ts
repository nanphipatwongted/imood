export interface Scene {
  id: string;
  name: string;
  /** Shown until real footage exists, and behind the video while it loads. */
  gradient: string;
  /** Seamless muted loop, e.g. { webm: '/scenes/rainy-cafe/video.webm', mp4: '...' } */
  video?: { webm: string; mp4: string };
  poster?: string;
  /** ~400×225 preview for the scene picker. */
  thumb?: string;
  /**
   * The ambient sounds this scene offers, in mixer order, with their default
   * volume (0 = available but off). Ids refer to src/data/sounds.ts.
   */
  sounds: { id: string; volume: number }[];
}

export const scenes: Scene[] = [
  {
    id: 'rainy-cafe',
    name: 'คาเฟ่วันฝนตก',
    gradient: 'linear-gradient(160deg, #2b2a33 0%, #4a3f3a 55%, #6b5345 100%)',
    video: { webm: '/scenes/rainy-cafe/video.webm', mp4: '/scenes/rainy-cafe/video.mp4' },
    poster: '/scenes/rainy-cafe/poster.webp',
    thumb: '/scenes/rainy-cafe/thumb.webp',
    sounds: [
      { id: 'rain', volume: 0.6 },
      { id: 'storm', volume: 0 },
      { id: 'chatter', volume: 0.3 },
      { id: 'coffee', volume: 0.2 },
      { id: 'keyboard', volume: 0 },
    ],
  },
];

export const defaultScene = scenes[0];
