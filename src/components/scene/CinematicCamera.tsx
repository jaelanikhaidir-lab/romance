"use client";

/**
 * CinematicCamera
 * ─────────────────────────────────────────────────────────────────────────────
 * Three camera phases, synced to an audio element:
 *
 *  ORBIT     — slow circular orbit around Love 3D (intro)
 *  DIVE      — GSAP-powered dive toward center, FOV ramp (chorus build-up)
 *  IMMERSIVE — inside the heart, slow drift, muted rotation
 *
 * Audio file: /music.mp3  (place the song in /public/music.mp3)
 * Chorus timestamp is configurable via CHORUS_START_SEC.
 *
 * Controls are disabled during DIVE / IMMERSIVE so the orbit camera takes over.
 */

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { useCinematicStore } from "@/store/cinematic-store";

// ── Tune these to match "Message in a Bottle (Taylor's Version)" ──────────────
// Chorus first hits at ~1:05 in the song. Adjust as needed.
const CHORUS_START_SEC = 65;

// ── Camera geometry ────────────────────────────────────────────────────────────
const ORBIT_RADIUS   = 20;   // distance while orbiting
const ORBIT_SPEED    = 0.10; // radians / second
const ORBIT_Y        = 5;    // camera height during orbit
const HEART_RADIUS   = 5;    // distance threshold: "inside" heart
const FOV_NORMAL     = 60;
const FOV_DIVE_PEAK  = 90;

// ── Drift params (immersive phase) ─────────────────────────────────────────────
const DRIFT_AMP_X  = 0.8;
const DRIFT_AMP_Y  = 0.5;
const DRIFT_SPEED  = 0.25;

export function CinematicCamera() {
  const { camera, gl } = useThree();
  const phase          = useCinematicStore((s) => s.phase);
  const setPhase       = useCinematicStore((s) => s.setPhase);
  const setBloom       = useCinematicStore((s) => s.setBloomIntensity);
  const setInside      = useCinematicStore((s) => s.setIsInsideHeart);

  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const diveFiredRef   = useRef(false);
  const gsapCtxRef     = useRef<gsap.Context | null>(null);
  const orbitAngleRef  = useRef(Math.PI); // Start behind center

  // ── Bootstrap audio ──────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio("/music.mp3");
    audio.loop  = false;
    audio.preload = "auto";
    audioRef.current = audio;

    // Auto-play on first user interaction to satisfy browser autoplay policy
    const tryPlay = () => {
      audio.play().catch(() => {/* user hasn't interacted yet — silent fail */});
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    };
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("keydown", tryPlay);

    return () => {
      audio.pause();
      audio.src = "";
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      gsapCtxRef.current?.revert();
    };
  }, []);

  // ── Set initial camera position ───────────────────────────────────────────────
  useEffect(() => {
    camera.position.set(0, ORBIT_Y, ORBIT_RADIUS);
    camera.lookAt(0, 0, 0);
    (camera as THREE.PerspectiveCamera).fov = FOV_NORMAL;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera]);

  // ── DIVE sequence (triggered once) ───────────────────────────────────────────
  function triggerDive() {
    if (diveFiredRef.current) return;
    diveFiredRef.current = true;
    setPhase("DIVE");
    setBloom(2.5);

    const cam = camera as THREE.PerspectiveCamera;
    const proxy = { fov: cam.fov };

    gsapCtxRef.current = gsap.context(() => {
      gsap.timeline()
        // 1. Rush toward center
        .to(camera.position, {
          x: 0, y: 0.5, z: 1.5,
          duration: 3.5,
          ease: "power4.inOut",
        })
        // 2. FOV ramp — "warp speed" feel
        .to(proxy, {
          fov: FOV_DIVE_PEAK,
          duration: 2.5,
          ease: "power3.in",
          onUpdate: () => {
            cam.fov = proxy.fov;
            cam.updateProjectionMatrix();
          },
        }, "<")
        // 3. Settle to immersive FOV
        .to(proxy, {
          fov: 75,
          duration: 1.2,
          ease: "power2.out",
          onUpdate: () => {
            cam.fov = proxy.fov;
            cam.updateProjectionMatrix();
          },
          onComplete: () => {
            setPhase("IMMERSIVE");
            setBloom(1.2);
          },
        });
    });
  }

  // ── Per-frame logic ───────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    const audio   = audioRef.current;
    const camDist = camera.position.length();

    // ── Audio timestamp → phase transitions ─────────────────────────────────
    if (audio && !audio.paused) {
      if (audio.currentTime >= CHORUS_START_SEC && phase === "ORBIT") {
        triggerDive();
      }
    }

    // ── Track whether we're inside the heart radius ────────────────────────
    setInside(camDist < HEART_RADIUS);

    // ── ORBIT phase: circular camera movement ──────────────────────────────
    if (phase === "ORBIT") {
      orbitAngleRef.current += ORBIT_SPEED * delta;
      const angle = orbitAngleRef.current;
      camera.position.x = Math.sin(angle) * ORBIT_RADIUS;
      camera.position.z = Math.cos(angle) * ORBIT_RADIUS;
      camera.position.y = ORBIT_Y + Math.sin(angle * 0.3) * 1.5;
      camera.lookAt(0, 0, 0);
    }

    // ── IMMERSIVE phase: slow inner drift ─────────────────────────────────
    if (phase === "IMMERSIVE") {
      const t = performance.now() * 0.001;
      const tx = Math.sin(t * DRIFT_SPEED) * DRIFT_AMP_X;
      const ty = Math.cos(t * DRIFT_SPEED * 0.7) * DRIFT_AMP_Y;
      camera.position.x += (tx - camera.position.x) * delta * 0.4;
      camera.position.y += (ty - camera.position.y) * delta * 0.4;
      camera.lookAt(0, 0, 0);
    }
  });

  // Expose audio element on the canvas DOM node so controls can call play/pause
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gl.domElement as any).__cinematicAudio = audioRef.current;
  }, [gl]);

  return null;
}
