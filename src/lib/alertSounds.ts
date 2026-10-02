export type AlertSoundType = "chime" | "radar" | "bell" | "pulse" | "siren" | "mute";

export interface AlertSoundOption {
  id: AlertSoundType;
  label: string;
  description: string;
  icon: string;
}

export const ALERT_SOUND_OPTIONS: AlertSoundOption[] = [
  {
    id: "chime",
    label: "Modern Chime",
    description: "Gentle two-tone melodic chime (Default)",
    icon: "ri-music-2-line",
  },
  {
    id: "bell",
    label: "Crystal Bell",
    description: "Rich harmonic crystal notification ding",
    icon: "ri-notification-3-line",
  },
  {
    id: "radar",
    label: "Sonar Radar",
    description: "Resonant submarine ping for high priority",
    icon: "ri-radar-line",
  },
  {
    id: "pulse",
    label: "Digital Pulse",
    description: "Crisp double-tick futuristic pulse",
    icon: "ri-pulse-line",
  },
  {
    id: "siren",
    label: "Urgent Warning",
    description: "Distinct alert warning tone",
    icon: "ri-alarm-warning-line",
  },
  {
    id: "mute",
    label: "Muted / Silent",
    description: "Visual banner only, no audio output",
    icon: "ri-volume-mute-line",
  },
];

export const getStoredAlertSound = (): AlertSoundType => {
  try {
    const sound = localStorage.getItem("hrm_announcement_alert_sound");
    if (sound && ["chime", "radar", "bell", "pulse", "siren", "mute"].includes(sound)) {
      return sound as AlertSoundType;
    }
  } catch {
    // fallback
  }
  return "chime";
};

export const setStoredAlertSound = (sound: AlertSoundType) => {
  try {
    localStorage.setItem("hrm_announcement_alert_sound", sound);
  } catch {
    // ignore
  }
};

export const getStoredAlertVolume = (): number => {
  try {
    const vol = localStorage.getItem("hrm_announcement_alert_volume");
    if (vol) {
      const num = Number(vol);
      if (!Number.isNaN(num) && num >= 0 && num <= 1) return num;
    }
  } catch {
    // fallback
  }
  return 0.7; // default 70% volume
};

export const setStoredAlertVolume = (volume: number) => {
  try {
    localStorage.setItem("hrm_announcement_alert_volume", String(Math.max(0, Math.min(1, volume))));
  } catch {
    // ignore
  }
};

/**
 * Synthesizes high-fidelity alert audio using Web Audio API without external audio file dependencies.
 */
export function playAnnouncementAlertSound(
  soundType?: AlertSoundType,
  volumeOverride?: number
) {
  const type = soundType || getStoredAlertSound();
  if (type === "mute") return;

  const volume = typeof volumeOverride === "number" ? volumeOverride : getStoredAlertVolume();
  if (volume <= 0.01) return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    if (type === "chime") {
      // 2-tone melodic chime (A5 880Hz -> D6 1174Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1174.66, now + 0.12);
      gain2.gain.setValueAtTime(0.4, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.5);
    } else if (type === "bell") {
      // Crystal bell with rich harmonics
      [523.25, 1046.5, 1567.98].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now);
        const amp = idx === 0 ? 0.4 : 0.15;
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65 - idx * 0.1);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.7);
      });
    } else if (type === "radar") {
      // Sonar sonar resonant pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === "pulse") {
      // Sci-fi digital double pulse
      [0, 0.08].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(i === 0 ? 1200 : 1600, now + delay);
        gain.gain.setValueAtTime(0.3, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    } else if (type === "siren") {
      // Attention warning modulation
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.15);
      osc.frequency.linearRampToValueAtTime(750, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {
    // audio failure silent recovery
  }
}
