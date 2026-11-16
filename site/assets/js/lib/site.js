/** Site-wide constants, shared by the page build (Node) and the browser. */

export const SITE_URL = 'https://brainbuzzgame.com';
export const SITE_NAME = 'BrainBuzz';
export const APP_NAME = 'BrainBuzz: Daily Challenge';

/** Official Play listing (applicationId com.app.dailybrainchallenge in the Android project). */
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.app.dailybrainchallenge';
/** The four-colour Google Play triangle, for every Google Play button. */
export const PLAY_LOGO = '<svg class="play-logo" viewBox="0 0 24 26" aria-hidden="true" focusable="false">'
  + '<path d="M1.3.7 13.6 13 1.3 25.3c-.4-.3-.6-.9-.6-1.5V2.2c0-.6.2-1.2.6-1.5z" fill="#4285f4"/>'
  + '<path d="M17.7 8.9 13.6 13 1.3.7c.5-.4 1.3-.5 2.1-.1z" fill="#34a853"/>'
  + '<path d="M17.7 17.1 3.4 25.4c-.8.4-1.6.3-2.1-.1L13.6 13z" fill="#ea4335"/>'
  + '<path d="M22.3 11.5c1.1.6 1.1 2.4 0 3l-4.6 2.6-4.1-4.1 4.1-4.1z" fill="#fbbc04"/></svg>';
/** Developer page, as linked from the app's Settings → More Apps. */
export const PLAY_DEV_URL = 'https://play.google.com/store/apps/dev?id=8676474932665421959';
/** The Android app's privacy policy, as listed on Google Play. */
export const APP_PRIVACY_URL = 'https://sites.google.com/view/brainbuzzprivacypolicy/home';
/** Developer contact email shown on the Play listing. */
export const CONTACT_EMAIL = 'gtech10926@gmail.com';

/**
 * Play link tagged with where it was clicked. Google Play passes the referrer to the
 * Play Console acquisition reports, so you can see which page sends installs.
 */
export function playUrl(placement) {
  const referrer = `utm_source=brainbuzzgame.com&utm_medium=website&utm_campaign=${placement}`;
  return `${PLAY_URL}&referrer=${encodeURIComponent(referrer)}`;
}

export const TAGLINE = 'Think Today. Better Tomorrow.';
export const DISCLAIMER =
  "BrainBuzz games are puzzles for enjoyment and practice. They are not a medical or scientific tool and aren't proven to raise IQ.";
