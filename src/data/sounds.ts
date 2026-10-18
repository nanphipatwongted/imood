export interface AmbientSound {
  id: string;
  label: string;
  icon: string;
  /** Opus first, AAC fallback for Safari — Howler picks the first it can play. */
  src: [string, string];
}

const sound = (id: string, label: string, icon: string): AmbientSound => ({
  id,
  label,
  icon,
  src: [`/sounds/${id}.ogg`, `/sounds/${id}.m4a`],
});

// Every sound any scene can use. Which ones appear in the mixer is decided per
// scene in src/data/scenes.ts.
//
// Real recordings (storm, chatter, coffee, keyboard) are processed with
// scripts/process-sound.sh; rain is still a synthetic placeholder from
// scripts/generate-placeholder-sounds.sh. Log every real file in
// src/data/credits.json.
export const sounds: AmbientSound[] = [
  sound('rain', 'ฝน', '🌧️'),
  sound('storm', 'พายุ', '⛈️'),
  sound('chatter', 'คนคุย', '🗣️'),
  sound('coffee', 'ทำกาแฟ', '☕'),
  sound('keyboard', 'คีย์บอร์ด', '⌨️'),
];

export const soundById = new Map(sounds.map((s) => [s.id, s]));
