import { create } from "zustand";

export type CameraPhase = "ORBIT" | "DIVE" | "IMMERSIVE";

interface CinematicState {
  phase: CameraPhase;
  bloomIntensity: number;   // 0–3, driven by camera phase
  isInsideHeart: boolean;   // camera distance < heart radius threshold
  setPhase: (phase: CameraPhase) => void;
  setBloomIntensity: (v: number) => void;
  setIsInsideHeart: (v: boolean) => void;
}

export const useCinematicStore = create<CinematicState>((set) => ({
  phase: "ORBIT",
  bloomIntensity: 0.4,
  isInsideHeart: false,
  setPhase: (phase) => set({ phase }),
  setBloomIntensity: (bloomIntensity) => set({ bloomIntensity }),
  setIsInsideHeart: (isInsideHeart) => set({ isInsideHeart }),
}));
