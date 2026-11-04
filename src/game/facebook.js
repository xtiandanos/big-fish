// Facebook SDK integration: login gating + score sharing.
// The App ID is public by design (it identifies the site to Facebook);
// override with VITE_FB_APP_ID if it ever changes.

const APP_ID = import.meta.env.VITE_FB_APP_ID || '1480583343995017';
const SDK_URL = 'https://connect.facebook.net/en_US/sdk.js';
const SDK_VERSION = 'v21.0';
const LOAD_TIMEOUT_MS = 8000;

let initPromise = null;

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

// Share via the classic sharer popup. The shared URL carries
// ?score=&species=&name= query params; edge middleware rewrites the page's
// Open Graph tags for that URL, so the post's link-preview card shows the
// app logo + the player's score (FB forbids pre-filling post text).
export function shareOnFacebook({ score, species, playerName }) {
  const params = new URLSearchParams({
    score: String(score),
    species,
  });
  if (playerName) params.set('name', playerName);
  const shareUrl = `${window.location.origin}/?${params.toString()}`;
  const quote = `🐠 I scored ${score} points in Big Fish! Can you beat me?`;
  const url =
    'https://www.facebook.com/sharer/sharer.php?u=' +
    encodeURIComponent(shareUrl) +
    '&quote=' +
    encodeURIComponent(quote);
  window.open(
    url,
    'fbshare',
    'width=640,height=580,toolbar=no,menubar=no,noopener'
  );
}
