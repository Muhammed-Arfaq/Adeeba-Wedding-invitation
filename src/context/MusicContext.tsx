import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Howl } from "howler";
import { wedding } from "@/config/wedding";

type MusicContextValue = {
  startMusic: () => void;
  toggleMute: () => void;
  isPlaying: boolean;
  isMuted: boolean;
  hasStarted: boolean;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const howlRef = useRef<Howl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const howl = new Howl({
      src: [wedding.music.url],
      loop: true,
      volume: wedding.music.volume,
      html5: true,
      preload: true,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
    });
    howlRef.current = howl;
    return () => {
      howl.unload();
    };
  }, []);

  const startMusic = useCallback(() => {
    const h = howlRef.current;
    if (!h || hasStarted) return;
    setHasStarted(true);
    h.play();
  }, [hasStarted]);

  const toggleMute = useCallback(() => {
    const h = howlRef.current;
    if (!h) return;
    const next = !isMuted;
    h.mute(next);
    setIsMuted(next);
  }, [isMuted]);

  return (
    <MusicContext.Provider value={{ startMusic, toggleMute, isPlaying, isMuted, hasStarted }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}
