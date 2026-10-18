import { useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';
import { sounds } from '../data/sounds';

const FADE_MS = 600;

/**
 * Keeps one looping Howl per ambient sound in sync with the mix.
 * Howls are created lazily the first time a sound is turned up, and paused
 * (not just muted) at volume 0 so idle layers don't burn CPU.
 */
export function useAmbientMixer(
  mix: Record<string, number>,
  master: number,
  active: boolean,
) {
  const howls = useRef(new Map<string, Howl>());

  useEffect(() => {
    Howler.volume(master);
  }, [master]);

  useEffect(() => {
    for (const sound of sounds) {
      const target = active ? (mix[sound.id] ?? 0) : 0;
      let howl = howls.current.get(sound.id);

      if (target > 0 && !howl) {
        howl = new Howl({ src: sound.src, loop: true, volume: 0 });
        howls.current.set(sound.id, howl);
      }
      if (!howl) continue;

      if (target > 0) {
        if (!howl.playing()) howl.play();
        howl.fade(howl.volume(), target, FADE_MS);
      } else if (howl.playing()) {
        howl.fade(howl.volume(), 0, FADE_MS);
        howl.once('fade', () => {
          if (howl.volume() === 0) howl.pause();
        });
      }
    }
  }, [mix, active]);

  useEffect(() => {
    const map = howls.current;
    return () => {
      map.forEach((howl) => howl.unload());
      map.clear();
    };
  }, []);
}
