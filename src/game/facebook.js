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
        cookie: false,
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

export function fbShare({ score, species }) {
  return new Promise((resolve, reject) => {
    if (!window.FB) return reject(new Error('Facebook SDK not ready'));
    const href = window.location.origin;
    const quote = `🐠 I evolved into a ${species} and scored ${score} points in Big Fish! Can you beat me? ${href}`;
    window.FB.ui({ method: 'share', href, quote }, (res) => resolve(res));
  });
}
