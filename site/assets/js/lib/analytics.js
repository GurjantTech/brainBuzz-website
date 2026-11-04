/**
 * Firebase Analytics for the website (Firebase project brainbuzz-c42b2, web app "BrainBuzzWebsite").
 *
 * The site has no bundler, so the Firebase modular SDK is loaded from Google's CDN with dynamic import():
 * nothing is downloaded until initAnalytics() runs, and a blocked or failed load never affects the page.
 * Analytics logs page views, sessions and users on its own; logAnalyticsEvent() adds the site's game events
 * (web_game_start, web_game_complete, web_level_limit). The web_ prefix keeps them apart from the Android
 * app's game_start / game_complete, which share this Firebase project.
 *
 * It runs only on the live site, so local builds, previews and tests never send data. The page's CSP
 * trusts these imports through 'strict-dynamic' (they come from main.js, which the hashed loader adds).
 */

const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/12.4.0';

/** The BrainBuzzWebsite web app's config, from Firebase Console → Project settings → Your apps. */
const firebaseConfig = {
  apiKey: 'AIzaSyDzgg1_0wsDxFD2EhqQNKepyHc7Rli_gHo',
  authDomain: 'brainbuzz-c42b2.firebaseapp.com',
  projectId: 'brainbuzz-c42b2',
  storageBucket: 'brainbuzz-c42b2.firebasestorage.app',
  messagingSenderId: '1017806074532',
  appId: '1:1017806074532:web:c8c7ee2091865db949ac31',
  measurementId: 'G-176L2M8HHG',
};

const LIVE_HOSTS = ['brainbuzzgame.com', 'www.brainbuzzgame.com'];

let started = null;
let logEventFn = null;

/**
 * Starts Firebase and Analytics once per page; later calls return the same promise.
 * Resolves to the Analytics instance, or null when analytics is off, unsupported or blocked.
 */
export function initAnalytics() {
  if (!started) {
    started = load().catch((e) => {
      console.warn('Firebase Analytics unavailable:', e && e.message ? e.message : e);
      return null;
    });
  }
  return started;
}

async function load() {
  if (!LIVE_HOSTS.includes(location.hostname)) return null;
  if (!firebaseConfig.apiKey || !firebaseConfig.appId) return null;
  const [{ initializeApp, getApps, getApp }, { getAnalytics, isSupported, logEvent }] = await Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`),
    import(`${FIREBASE_SDK}/firebase-analytics.js`),
  ]);
  // isSupported() is false when cookies or IndexedDB are unavailable (private modes, blocked storage).
  if (!(await isSupported())) return null;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  logEventFn = (name, params) => logEvent(analytics, name, params);
  return analytics;
}

/**
 * Logs one Analytics event. Never throws and never waits: if Analytics isn't ready yet it starts it and logs
 * once it is; when Analytics is off, unsupported or blocked, the event is dropped.
 */
export function logAnalyticsEvent(name, params = {}) {
  try {
    if (logEventFn) { logEventFn(name, params); return; }
    initAnalytics().then(() => { try { if (logEventFn) logEventFn(name, params); } catch (e) { /* dropped */ } });
  } catch (e) { /* analytics unavailable */ }
}
