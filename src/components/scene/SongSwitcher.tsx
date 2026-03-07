"use client";

import { Disc3, Music, Pause, Play, SkipBack, SkipForward } from "lucide-react";

interface SongSwitcherProps {
    isVisible: boolean;
    activeTrack: "main" | "idle";
    onNext: () => void;
    onPrev: () => void;
    mainSongName?: string;
    idleSongName?: string;
    isPlaying: boolean;
    onTogglePlay: () => void;
    progress: number;
}

export function SongSwitcher({
    isVisible,
    activeTrack,
    onNext,
    onPrev,
    mainSongName = "Our Song",
    idleSongName = "Valentine",
    isPlaying,
    onTogglePlay,
    progress = 0,
}: SongSwitcherProps) {
    if (!isVisible) return null;

    return (
        <div
            style={{
                position: "absolute",
                bottom: "1.5rem",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 100,
                animation: "spring-bounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
            }}
        >
            <style>{`
        @keyframes spring-bounce {
          0% { opacity: 0; transform: translate(-50%, 40px) scale(0.8); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>

            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black p-3 pr-4 backdrop-blur-md shadow-2xl">
                <p className="px-1 text-xs font-medium uppercase tracking-widest text-white/50">
                    Now Playing
                </p>

                <div className="flex flex-row items-center gap-1">
                    {/* Previous Track Button */}
                    <button
                        onClick={onPrev}
                        className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <SkipBack size={18} />
                    </button>

                    {/* Current Track Display */}
                    <div className="flex w-[140px] items-center justify-center gap-2 px-2 text-[#e8a87c] shadow-[0_0_12px_rgba(232,168,124,0.15)] rounded-xl py-2 bg-[#e8a87c]/10">
                        {activeTrack === "main" ? (
                            <>
                                <Music size={16} className="animate-pulse" />
                                <span className="truncate text-sm font-medium">{mainSongName}</span>
                            </>
                        ) : (
                            <>
                                <Disc3 size={16} className="animate-pulse flex-shrink-0" />
                                <span className="truncate text-sm font-medium">{idleSongName}</span>
                            </>
                        )}
                    </div>

                    {/* Play/Pause Track Button */}
                    <button
                        onClick={onTogglePlay}
                        className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>

                    {/* Next Track Button */}
                    <button
                        onClick={onNext}
                        className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <SkipForward size={18} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10 mt-1">
                    <div
                        className="h-full bg-[#e8a87c] transition-all duration-300 ease-linear"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
