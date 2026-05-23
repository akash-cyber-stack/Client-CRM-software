let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

async function unlockAudioContext() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // ignore if browser blocks autoplay
    }
  }
}

if (typeof window !== 'undefined') {
  const unlock = () => {
    void unlockAudioContext();
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
}

/** Pleasant CRM alert tone — works on desktop & mobile browsers */
export function playNotificationSound() {
  try {
    void unlockAudioContext();
    const ctx = getCtx();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1174.66, now + 0.08);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch {
    // ignore if audio blocked
  }
}

export function showDesktopNotification({ title, body, tag, onClick }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;

  const n = new Notification(title, {
    body,
    tag: tag || title,
    icon: '/vite.svg',
    requireInteraction: false,
  });

  n.onclick = () => {
    window.focus();
    n.close();
    onClick?.();
  };

  setTimeout(() => n.close(), 8000);
  return n;
}
