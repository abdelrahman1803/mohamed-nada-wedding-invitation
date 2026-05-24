/* Mohamed & Nada Wedding - extracted from index.html for maintainability */

(function () {
  const doorContainer = document.getElementById('door-container');
  const music = document.getElementById('music');
  const musicButton = document.getElementById('music-toggle');
  const MUSIC_START_SECONDS = 35;
  const EVENT = {
    title: 'Mohamed & Nada Wedding',
    location: 'Villa Mianda',
    mapsUrl: 'https://maps.app.goo.gl/D5zLSAQnT8EdVdQH9',
    start: new Date('July 2, 2026 20:00:00'),
  };
  let musicAvailable = true;
  let afterOpenInitialized = false;
  let startPositionApplied = false;
  let playAttempted = false;
  let consecutiveNoSourceChecks = 0;

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function toICSLocalDateTime(date) {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const hours = pad2(date.getHours());
    const minutes = pad2(date.getMinutes());
    const seconds = pad2(date.getSeconds());
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  }

  function toICSUTCStamp(date) {
    const year = date.getUTCFullYear();
    const month = pad2(date.getUTCMonth() + 1);
    const day = pad2(date.getUTCDate());
    const hours = pad2(date.getUTCHours());
    const minutes = pad2(date.getUTCMinutes());
    const seconds = pad2(date.getUTCSeconds());
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  function escapeICSText(text) {
    return String(text)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  function buildReminderICS() {
    const uid = `mohamed-nada-${EVENT.start.getTime()}@invitation`;
    const dtstamp = toICSUTCStamp(new Date());
    const dtstart = toICSLocalDateTime(EVENT.start);
    const description = `Wedding Invitation\\nLocation: ${EVENT.location}\\nMap: ${EVENT.mapsUrl}`;

    // Reminders requested:
    // - 2 days before
    // - 1 day before
    // - same day 6 AM  (event 8 PM => 14 hours before)
    // - same day 12 PM (event 8 PM => 8 hours before)
    const alarms = [
      '-P2D',
      '-P1D',
      '-PT14H',
      '-PT8H',
    ].flatMap((trigger) => [
      'BEGIN:VALARM',
      `TRIGGER:${trigger}`,
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICSText(`${EVENT.title} reminder`)}`,
      'END:VALARM',
    ]);

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'PRODID:-//MohamedNada//Invitation//EN',
      'BEGIN:VEVENT',
      `UID:${escapeICSText(uid)}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `SUMMARY:${escapeICSText(EVENT.title)}`,
      `LOCATION:${escapeICSText(EVENT.location)}`,
      `DESCRIPTION:${escapeICSText(description)}`,
      `URL:${escapeICSText(EVENT.mapsUrl)}`,
      'STATUS:CONFIRMED',
      ...alarms,
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].join('\r\n');
  }

  function downloadICSFile(filename, contents) {
    const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.saveToCalendarWithReminders = function saveToCalendarWithReminders() {
    try {
      const ics = buildReminderICS();
      downloadICSFile('Mohamed-Nada-Wedding-Reminders.ics', ics);
    } catch {
      // ignore
    }
  };

  function markMusicUnavailable() {
    musicAvailable = false;

    if (music) {
      try {
        music.pause();
      } catch {
        // ignore
      }
    }

    if (musicButton) {
      musicButton.disabled = true;
      musicButton.setAttribute('aria-disabled', 'true');
      musicButton.setAttribute('aria-pressed', 'false');
      musicButton.setAttribute('aria-label', 'Music unavailable');
      musicButton.title = 'Music unavailable';
    }
  }

  function tryApplyStartPosition() {
    if (!music || startPositionApplied) return;

    try {
      const duration = music.duration;

      // If duration is unknown/Infinity (streaming), just attempt the target.
      let targetTime = MUSIC_START_SECONDS;
      if (Number.isFinite(duration) && duration > 0) {
        targetTime = Math.min(MUSIC_START_SECONDS, Math.max(0, duration - 0.25));
      }

      music.currentTime = targetTime;
      startPositionApplied = true;
    } catch {
      // Some browsers may throw until the media is seekable.
    }
  }

  function safelyPlayMusic() {
    if (!music || !musicAvailable) return;

    playAttempted = true;

    // If metadata is already available, try to start from the requested second.
    if (!startPositionApplied && music.readyState >= 1) {
      tryApplyStartPosition();
    }

    const playPromise = music.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise
        .catch(() => {
          // Autoplay can be blocked OR the media can be missing/unplayable.
          // If the browser reports an error on the <audio>, we disable the button.
          setMusicButtonState();
        })
        .finally(() => {
          setMusicButtonState();
        });
    }

    const postPlayCheck = () => {
      if (!musicAvailable) return;

      // If we have any metadata/data, assume the source is fine.
      if (music.readyState >= 1) {
        consecutiveNoSourceChecks = 0;
        setMusicButtonState();
        return;
      }

      // NO_SOURCE can be transient with preload=none and remote URLs.
      // Only treat it as real failure after multiple checks and only after a play attempt.
      if (playAttempted && music.networkState === 3 /* NETWORK_NO_SOURCE */) {
        consecutiveNoSourceChecks += 1;
      } else {
        consecutiveNoSourceChecks = 0;
      }

      if (consecutiveNoSourceChecks >= 3) {
        markMusicUnavailable();
        return;
      }

      setMusicButtonState();
    };

    window.setTimeout(postPlayCheck, 200);
    window.setTimeout(postPlayCheck, 1200);
    window.setTimeout(postPlayCheck, 2500);
  }

  function setMusicButtonState() {
    if (!musicButton || !music) return;

    // If the browser reports an actual error, stop advertising controls.
    if (music.error) {
      markMusicUnavailable();
      return;
    }

    if (!musicAvailable) {
      musicButton.setAttribute('aria-pressed', 'false');
      musicButton.setAttribute('aria-label', 'Music unavailable');
      musicButton.classList.remove('is-muted');
      return;
    }

    const isMuted = Boolean(music.muted);
    musicButton.setAttribute('aria-pressed', String(isMuted));
    musicButton.setAttribute('aria-label', isMuted ? 'Unmute' : 'Mute');
    musicButton.classList.toggle('is-muted', isMuted);
  }

  window.openDoors = function openDoors() {
    if (!doorContainer) return;

    doorContainer.classList.add('open');

    // Start music after user interaction (more reliable than autoplay).
    safelyPlayMusic();
    setMusicButtonState();

    if (!afterOpenInitialized) {
      afterOpenInitialized = true;
      initAfterOpen();
    }

    setTimeout(() => {
      doorContainer.style.display = 'none';
      document.body.classList.remove('is-locked');
      document.body.classList.remove('pre-open');
    }, 2000);
  };

  window.toggleMute = function toggleMute() {
    if (!music || !musicAvailable) return;

    music.muted = !music.muted;
    setMusicButtonState();
  };

  // Backwards compatibility (older markup might still call toggleMusic)
  window.toggleMusic = window.toggleMute;

  // MUSIC defaults
  if (music) {
    music.volume = 0.25;

    // Start from second 35 when metadata is ready.
    music.addEventListener('loadedmetadata', tryApplyStartPosition);

    music.addEventListener('play', setMusicButtonState);
    music.addEventListener('pause', setMusicButtonState);
    music.addEventListener('error', () => {
      // Missing file, bad format, or blocked file:// access.
      markMusicUnavailable();
    });
  }
  setMusicButtonState();

  function initAfterOpen() {
    // COUNTDOWN
    const weddingDate = new Date('July 2, 2026 20:00:00').getTime();

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    function updateCountdown() {
      const now = Date.now();
      const distance = Math.max(0, weddingDate - now);

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(days);
      if (hoursEl) hoursEl.textContent = String(hours);
      if (minutesEl) minutesEl.textContent = String(minutes);
      if (secondsEl) secondsEl.textContent = String(seconds);
    }

    updateCountdown();
    window.setInterval(updateCountdown, 1000);

    // SCROLL EFFECT (IntersectionObserver for performance)
    const fadeElements = document.querySelectorAll('.fade');
    if (fadeElements.length) {
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('show');
                io.unobserve(entry.target);
              }
            });
          },
          { root: null, rootMargin: '0px 0px -100px 0px', threshold: 0.01 }
        );

        fadeElements.forEach((el) => io.observe(el));
      } else {
        // Fallback to scroll handler
        const onScroll = () => {
          fadeElements.forEach((el) => {
            const top = el.getBoundingClientRect().top;
            if (top < window.innerHeight - 100) {
              el.classList.add('show');
            }
          });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }
    }
  }
})();
