/* Mohamed & Nada Wedding - extracted from index.html for maintainability */

(function () {
  const splash = document.getElementById('splash');
  const doorContainer = document.getElementById('door-container');
  const modeContainer = document.getElementById('mode-container');
  const bookContainer = document.getElementById('book-container');
  const backToModeButton = document.getElementById('back-to-mode');
  const invitationContent = document.getElementById('invitation-content');
  const music = document.getElementById('music');
  const musicButton = document.getElementById('music-toggle');
  const SPLASH_TOTAL_MS = 4000;
  const SPLASH_LEAVE_MS = 850;
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
  let splashDismissed = false;
  let splashTimer = null;

  function ensureBodyLocked() {
    document.body.classList.add('is-locked');
    document.body.classList.add('pre-open');
  }

  function hideInvitationContent() {
    if (invitationContent) invitationContent.hidden = true;
  }

  function showInvitationContent() {
    if (invitationContent) invitationContent.hidden = false;
  }

  window.dismissSplash = function dismissSplash(immediate = false) {
    ensureBodyLocked();
    startExperience();

    if (splashDismissed) return;
    splashDismissed = true;

    if (splashTimer) {
      window.clearTimeout(splashTimer);
      splashTimer = null;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!splash || immediate || prefersReducedMotion) {
      if (splash) splash.hidden = true;
      if (modeContainer) modeContainer.hidden = false;
      if (backToModeButton) backToModeButton.hidden = true;
      return;
    }

    splash.classList.add('splash--leaving');
    window.setTimeout(() => {
      if (splash) splash.hidden = true;
      if (modeContainer) modeContainer.hidden = false;
      if (backToModeButton) backToModeButton.hidden = true;
    }, SPLASH_LEAVE_MS);
  };

  function scheduleAutoSplash() {
    if (!splash || splash.hidden) return;
    // Total splash duration is 4 seconds.
    // We start the leaving animation so it finishes exactly at 4s.
    const startLeavingAt = Math.max(0, SPLASH_TOTAL_MS - SPLASH_LEAVE_MS);
    splashTimer = window.setTimeout(() => window.dismissSplash(false), startLeavingAt);
  }

  function startExperience() {
    // Initialize non-music experience bits.
    setMusicButtonState();

    if (!afterOpenInitialized) {
      afterOpenInitialized = true;
      initAfterOpen();
    }
  }

  function startMusic() {
    // Start music only after an explicit user action (e.g., opening the invitation).
    safelyPlayMusic();
    setMusicButtonState();
  }

  function unlockBody() {
    document.body.classList.remove('is-locked');
    document.body.classList.remove('pre-open');
  }

  window.chooseIntro = function chooseIntro(mode) {
    ensureBodyLocked();

    if (modeContainer) {
      modeContainer.hidden = true;
    }

    if (backToModeButton) {
      backToModeButton.hidden = false;
    }

    if (mode === 'katb') {
      hideInvitationContent();
      if (doorContainer) {
        doorContainer.hidden = true;
      }
      if (bookContainer) {
        bookContainer.hidden = false;
        bookContainer.classList.remove('is-open');
        bookContainer.classList.remove('intro-dismiss');
      }

      const introBook = document.getElementById('intro-book');
      if (introBook && typeof introBook.focus === 'function') introBook.focus();
      return;
    }

    // invitation
    hideInvitationContent();
    if (bookContainer) {
      bookContainer.hidden = true;
      bookContainer.classList.remove('is-open');
      bookContainer.classList.remove('intro-dismiss');
    }
    if (doorContainer) {
      doorContainer.hidden = false;
      doorContainer.classList.remove('open');
      doorContainer.style.display = '';
    }
  };

  window.returnToMode = function returnToMode() {
    ensureBodyLocked();

    hideInvitationContent();

    if (backToModeButton) {
      backToModeButton.hidden = true;
    }

    if (modeContainer) {
      modeContainer.hidden = false;
    }

    if (bookContainer) {
      bookContainer.hidden = true;
      bookContainer.classList.remove('is-open');
      bookContainer.classList.remove('intro-dismiss');
    }

    if (doorContainer) {
      doorContainer.hidden = true;
      doorContainer.classList.remove('open');
      doorContainer.style.display = '';
    }

    if (music) {
      try {
        music.pause();
      } catch {
        // ignore
      }
    }
    setMusicButtonState();
  };

  window.openBook = function openBook() {
    if (!bookContainer) return;

    const introBook = document.getElementById('intro-book');
    const isOpen = bookContainer.classList.contains('is-open');

    if (!isOpen) {
      bookContainer.classList.add('is-open');
      if (introBook) introBook.setAttribute('aria-expanded', 'true');
      return;
    }

    // Second tap: close the book
    bookContainer.classList.remove('is-open');
    if (introBook) introBook.setAttribute('aria-expanded', 'false');
  };

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

    doorContainer.hidden = false;

    doorContainer.classList.add('open');

    // Make the invitation content available behind the doors (no flash before this).
    showInvitationContent();

    // Keep invitation behavior the same, but don't tie music to splash.
    startExperience();
    startMusic();

    setTimeout(() => {
      doorContainer.style.display = 'none';
      unlockBody();
    }, 2000);
  };

  window.toggleMute = function toggleMute() {
    if (!music || !musicAvailable) return;

    // If user taps the music button, treat it as a user intent to start playback.
    if (music.paused) {
      startMusic();
    }

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

  hideInvitationContent();
  scheduleAutoSplash();

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
