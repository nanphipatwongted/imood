import type { Scene } from '../data/scenes';

export default function SceneBackground({ scene }: { scene: Scene }) {
  return (
    <div className="fixed inset-0 -z-10 transition-[background] duration-700" style={{ background: scene.gradient }}>
      {scene.video && (
        // `key` forces a fresh <video> per scene so the new source loads.
        <video
          key={scene.id}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={scene.poster}
        >
          <source src={scene.video.webm} type="video/webm" />
          <source src={scene.video.mp4} type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />
    </div>
  );
}
