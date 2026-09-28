// Shared behaviour for Supplier Intelligence pages: mobile nav + cookie consent (same config as index.html).
import * as CookieConsent from 'https://cdn.jsdelivr.net/npm/vanilla-cookieconsent@3.1.0/dist/cookieconsent.esm.js';

const nav = document.querySelector('nav');
const burger = document.querySelector('.nav-hamburger');
if (nav && burger) {
  burger.addEventListener('click', () => nav.classList.toggle('nav-open'));
  nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('nav-open')));
}

function syncConsent() {
  if (typeof gtag === 'undefined') return;
  const v = CookieConsent.acceptedCategory('analytics') ? 'granted' : 'denied';
  gtag('consent', 'update', { analytics_storage: v, ad_storage: v, ad_user_data: v, ad_personalization: v });
}

CookieConsent.run({
  guiOptions: { consentModal: { layout: 'bar', position: 'bottom' } },
  onConsent: syncConsent,
  onChange: syncConsent,
  categories: {
    necessary: { enabled: true, readOnly: true },
    analytics: { autoClear: { cookies: [{ name: /^(_ga|_gid)/ }] } }
  },
  language: {
    default: 'en',
    translations: {
      en: {
        consentModal: {
          title: 'We use cookies',
          description: 'We use cookies to analyze site traffic and improve your experience.',
          acceptAllBtn: 'Accept All',
          acceptNecessaryBtn: 'Reject All',
          showPreferencesBtn: 'Manage Preferences'
        },
        preferencesModal: {
          title: 'Cookie Preferences',
          acceptAllBtn: 'Accept All',
          acceptNecessaryBtn: 'Reject All',
          savePreferencesBtn: 'Save Preferences',
          closeIconLabel: 'Close',
          sections: [
            { title: 'Necessary Cookies', description: 'Required for the website to function properly.', linkedCategory: 'necessary' },
            { title: 'Analytics Cookies', description: 'Help us understand how visitors use our site via Google Analytics. All data is anonymized.', linkedCategory: 'analytics' }
          ]
        }
      }
    }
  }
});
