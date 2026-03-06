/** @vitest-environment jsdom */

import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RomanticExperiencePage } from "@/components/scene/RomanticExperiencePage";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/dynamic", () => ({
  default: () => function MockDynamicComponent() {
    return <div data-testid="scene-3d" />;
  },
}));

vi.mock("@/components/ui", () => ({
  Spinner: () => <div data-testid="spinner" />,
}));

vi.mock("@/components/scene", () => ({
  InstructionOverlay: () => <div data-testid="instruction-overlay" />,
}));

const galleryState = {
  status: "ready" as const,
  error: null as string | null,
  client: {
    id: "client-1",
    slug: "pasangan-a",
    name: "Pasangan A",
    sphere_color: "#e8a87c",
    floating_text: "Only For U",
    target_name: "Pendek.",
    particle_count: 50,
    music_url: "/shared.mp3",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  fetchPublicData: vi.fn(),
};

const cinematicState = {
  toggleZoom: vi.fn(),
  restartCinematic: vi.fn(),
  isStopped: false,
  stopCinematic: vi.fn(),
  resetCinematic: vi.fn(),
};

vi.mock("@/store/gallery-store", () => ({
  useGalleryStore: (selector: (state: typeof galleryState) => unknown) => selector(galleryState),
}));

vi.mock("@/store/cinematic-store", () => ({
  useCinematicStore: (selector: (state: typeof cinematicState) => unknown) =>
    selector(cinematicState),
}));

class MockAudio {
  static instances: MockAudio[] = [];

  readonly src: string;
  loop = false;
  currentTime = 0;
  duration = 0;
  readonly play = vi.fn().mockResolvedValue(undefined);
  readonly pause = vi.fn();
  private listeners = new Map<string, Set<() => void>>();

  constructor(src: string) {
    this.src = src;
    MockAudio.instances.push(this);
  }

  addEventListener(event: string, listener: () => void) {
    const listeners = this.listeners.get(event) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
  }

  removeEventListener(event: string, listener: () => void) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener();
    }
  }
}

class MockAudioContext {
  state: AudioContextState = "running";
  currentTime = 0;

  createMediaElementSource() {
    return {
      connect: vi.fn(),
    };
  }

  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
    };
  }

  close() {
    return Promise.resolve();
  }

  resume() {
    return Promise.resolve();
  }
}

describe("RomanticExperiencePage dynamic route behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockAudio.instances = [];
    galleryState.status = "ready";
    galleryState.error = null;
    galleryState.client = {
      id: "client-1",
      slug: "pasangan-a",
      name: "Pasangan A",
      sphere_color: "#e8a87c",
      floating_text: "Only For U",
      target_name: "Pendek.",
      particle_count: 50,
      music_url: "/shared.mp3",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    };
    galleryState.fetchPublicData.mockReset();
    cinematicState.toggleZoom.mockReset();
    cinematicState.restartCinematic.mockReset();
    cinematicState.stopCinematic.mockReset();
    cinematicState.resetCinematic.mockReset();
    cinematicState.isStopped = false;

    vi.stubGlobal("Audio", MockAudio as unknown as typeof Audio);
    vi.stubGlobal(
      "AudioContext",
      MockAudioContext as unknown as typeof AudioContext
    );
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("resets the start state and refetches when the slug changes", () => {
    const { rerender } = render(<RomanticExperiencePage slug="pasangan-a" />);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(cinematicState.toggleZoom).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Start Over" })).toBeTruthy();

    rerender(<RomanticExperiencePage slug="pasangan-b" />);

    expect(galleryState.fetchPublicData).toHaveBeenNthCalledWith(1, "pasangan-a");
    expect(galleryState.fetchPublicData).toHaveBeenNthCalledWith(2, "pasangan-b");
    expect(cinematicState.resetCinematic).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Start" })).toBeTruthy();
  });

  it("recreates audio per slug even when both clients use the same track", () => {
    const { rerender } = render(<RomanticExperiencePage slug="pasangan-a" />);

    expect(MockAudio.instances).toHaveLength(1);
    const firstAudio = MockAudio.instances[0];

    rerender(<RomanticExperiencePage slug="pasangan-b" />);

    expect(firstAudio.pause).toHaveBeenCalled();
    expect(MockAudio.instances).toHaveLength(2);

    const secondAudio = MockAudio.instances[1];
    secondAudio.duration = 60;
    secondAudio.currentTime = 58.2;

    act(() => {
      secondAudio.emit("timeupdate");
    });

    expect(screen.getByTestId("romantic-experience-root").style.filter).toBe(
      "blur(12px)"
    );
  });
});