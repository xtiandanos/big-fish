// Facebook SDK integration: login gating + score sharing.
// The App ID is public by design (it identifies the site to Facebook);
// override with VITE_FB_APP_ID if it ever changes.

const APP_ID = import.meta.env.VITE_FB_APP_ID || '1480583343995017';
const SDK_URL = 'https://connect.facebook.net/en_US/sdk.js';
const SDK_VERSION = 'v21.0';
const LOAD_TIMEOUT_MS = 8000;

let initPromise = null;

// --- Login persistence -------------------------------------------------
// FB SDK sessions rely on third-party cookies (facebook.com cookies set
// from our domain), which Safari/Brave block by default — so getLoginStatus
// reports "logged out" on every reload. Since our share flow needs no FB
// token (sharer popup), caching the profile locally is sufficient.
const CACHED_USER_KEY = 'bigfish_fb_user';

export function loadCachedUser() {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCachedUser(user) {
  try {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  } catch {
    // storage unavailable (private window etc.) — login just won't persist
  }
}

export function clearCachedUser() {
  try {
    localStorage.removeItem(CACHED_USER_KEY);
  } catch {
    // ignore
  }
}

export function isFacebookConfigured() {
  return Boolean(APP_ID);
}

function loadSdk() {
  return new Promise((resolve, reject) => {
    if (window.FB) return resolve(window.FB);

    const timer = setTimeout(
      () => reject(new Error('Facebook SDK timed out')),
      LOAD_TIMEOUT_MS
    );

    // fbAsyncInit must be defined before the SDK script loads
    window.fbAsyncInit = () => {
      clearTimeout(timer);
      window.FB.init({
        appId: APP_ID,
        version: SDK_VERSION,
        cookie: true, // persist login across reloads
        xfbml: false,
        status: true,
      });
      resolve(window.FB);
    };

    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Facebook SDK blocked or unavailable'));
    };
    document.head.appendChild(script);
  });
}

// Resolves 'logged-in' | 'logged-out' | 'unavailable'
export async function initFacebook() {
  if (!APP_ID) return 'unavailable';
  if (!initPromise) {
    initPromise = loadSdk()
      .then(
        () =>
          new Promise((resolve) => {
            window.FB.getLoginStatus(resolve, true);
          })
      )
      .then((res) => (res.status === 'connected' ? 'logged-in' : 'logged-out'))
      .catch(() => 'unavailable');
  }
  return initPromise;
}

// Must be called from a direct user gesture (popup blockers).
export function fbLogin() {
  return new Promise((resolve, reject) => {
    if (!window.FB) return reject(new Error('Facebook SDK not ready'));
    window.FB.login(
      (res) => resolve(res.status === 'connected' ? 'logged-in' : 'logged-out'),
      { scope: 'public_profile' }
    );
  });
}

// Basic profile for the header: name + square avatar (public_profile only).
export function fbMe() {
  return new Promise((resolve, reject) => {
    if (!window.FB) return reject(new Error('Facebook SDK not ready'));
    window.FB.api('/me', { fields: 'name,picture.type(square)' }, (res) => {
      if (res && !res.error) {
        resolve({
          id: res.id,
          name: res.name,
          pictureUrl: res.picture?.data?.url,
        });
      } else {
        reject(res?.error || new Error('Could not load profile'));
      }
    });
  });
}

export function fbLogout() {
  return new Promise((resolve) => {
    if (!window.FB) return resolve('logged-out');
    window.FB.logout(() => resolve('logged-out'));
  });
}

// Share the brag. FB's platform policy forbids pre-filling post text via
// their dialogs, so:
//  - mobile → native share sheet (navigator.share): FB receives the full
//    brag text + link, prefilled, policy-compliantly.
//  - desktop → copy the brag message to the clipboard and open the sharer
//    popup; the player pastes it into the composer (one paste).
// Returns 'shared' | 'copied' | 'cancelled' | 'none'.
export async function shareOnFacebook({ score, species, playerName }) {
  const scoreText = Number(score).toLocaleString('en-US');
  const text = playerName
    ? `🐠 ${playerName} scored ${scoreText} points as a ${species} in Big Fish! Think you can beat them? 🎮`
    : `🐠 I scored ${scoreText} points as a ${species} in Big Fish! Think you can beat me? 🎮`;

  // The link carries ?score=&species=&name= — edge middleware rewrites the
  // OG tags so the post's preview card shows logo + score too.
  const params = new URLSearchParams({ score: String(score), species });
  if (playerName) params.set('name', playerName);
  const shareUrl = `${window.location.origin}/?${params.toString()}`;

  // Native share sheet only on phones — desktop Safari also implements
  // navigator.share, but its macOS share sheet has no Facebook target,
  // so desktop always uses the clipboard + sharer flow instead.
  const isMobileLike =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    navigator.userAgentData?.mobile;
  if (isMobileLike && navigator.share) {
    try {
      await navigator.share({ title: 'Big Fish 🐠', text, url: shareUrl });
      return 'shared';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled';
      // share sheet unavailable for this target — fall through to sharer
    }
  }

  // Desktop: the Feed Dialog officially supports `quote` (prefilled message
  // box) — unlike sharer.php where FB dropped quote support. Needs the app's
  // redirect URI whitelisted; we also copy the brag to the clipboard as a
  // fallback either way.
  const composed = `${text}\n${shareUrl}`;
  let copied = true;
  try {
    await navigator.clipboard.writeText(composed);
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = composed;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      copied = document.execCommand('copy');
      ta.remove();
    } catch {
      copied = false;
    }
  }

  // Feed Dialog (with prefilled quote) is only usable on production —
  // FB rejects bare "localhost" in App Domains. Local dev falls back to
  // the sharer popup + clipboard paste.
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(
    window.location.hostname
  );
  const shareWindowFeatures =
    'width=640,height=580,toolbar=no,menubar=no,noopener';
  const popup = isLocal
    ? window.open(
        'https://www.facebook.com/sharer/sharer.php?u=' +
          encodeURIComponent(shareUrl),
        'fbshare',
        shareWindowFeatures
      )
    : window.open(
        'https://www.facebook.com/dialog/feed' +
          '?app_id=' +
          encodeURIComponent(APP_ID) +
          '&link=' +
          encodeURIComponent(shareUrl) +
          '&quote=' +
          encodeURIComponent(text) +
          '&redirect_uri=' +
          encodeURIComponent(window.location.origin + '/'),
        'fbshare',
        shareWindowFeatures
      );
  if (!popup) {
    // popup blocked — plain sharer in a new tab as last resort
    window.open(
      'https://www.facebook.com/sharer/sharer.php?u=' +
        encodeURIComponent(shareUrl),
      '_blank'
    );
  }
  return copied ? 'copied' : 'none';
}
