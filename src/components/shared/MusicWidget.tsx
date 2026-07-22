import { useMusic } from "@/context/MusicContext";
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from "react-icons/hi2";

export function MusicWidget() {
  const { isPlaying, isMuted, hasStarted, toggleMute } = useMusic();

  if (!hasStarted) return null;

  return (
    <button
      type="button"
      onClick={toggleMute}
      className="music-pill"
      aria-label={isMuted ? "Unmute music" : "Mute music"}
    >
      <span className={`music-dot ${isPlaying && !isMuted ? "playing" : ""}`} aria-hidden />
      <span className="font-display text-[0.65rem] tracking-[0.2em] uppercase text-gold-soft">
        {isMuted ? "Muted" : "Music"}
      </span>
      {isMuted ? (
        <HiOutlineSpeakerXMark size={14} className="text-gold-soft" aria-hidden />
      ) : (
        <HiOutlineSpeakerWave size={14} className="text-gold-soft" aria-hidden />
      )}
    </button>
  );
}
