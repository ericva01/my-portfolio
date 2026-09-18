export type YouTubePlayer = {
  playVideo(): void; stopVideo(): void; mute(): void; unMute(): void;
  setVolume(volume: number): void; isMuted(): boolean; destroy(): void;
};
type PlayerEvent = { target: YouTubePlayer; data: number };
type YouTubeAPI = { Player: new (element: HTMLIFrameElement, options: {
  events: { onReady(event: PlayerEvent): void; onStateChange(event: PlayerEvent): void;
    onError(event: PlayerEvent): void; onAutoplayBlocked(event: PlayerEvent): void; };
}) => YouTubePlayer };
declare global { interface Window { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void; } }
let loading: Promise<YouTubeAPI> | undefined;
// Share the script across Strict Mode effects and footer replays.
export function loadYouTubeAPI(): Promise<YouTubeAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise<YouTubeAPI>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    const clean = () => {
      window.clearTimeout(timeout);
      script.removeEventListener("error", failed);
      if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = previous;
    };
    const failed = () => { clean(); script.remove(); reject(new Error("YouTube unavailable")); };
    const ready = () => {
      clean();
      if (window.YT?.Player) resolve(window.YT); else reject(new Error("Player unavailable"));
      previous?.();
    };
    const timeout = window.setTimeout(failed, 15000);
    window.onYouTubeIframeAPIReady = ready;
    script.addEventListener("error", failed);
    document.head.appendChild(script);
  }).catch((error: unknown) => { loading = undefined; throw error; });
  return loading;
}
