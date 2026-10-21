/** Site-wide constants, shared by the page build (Node) and the browser. */

export const SITE_URL = 'https://brainbuzzgame.com';
export const SITE_NAME = 'BrainBuzz';
export const APP_NAME = 'BrainBuzz: Daily Challenge';

/** Official Play listing (applicationId com.app.dailybrainchallenge in the Android project). */
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.app.dailybrainchallenge';
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
