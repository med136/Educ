import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationFR from './locales/fr/translation.json';
import translationAR from './locales/ar/translation.json';

const resources = {
  fr: { translation: translationFR },
  ar: { translation: translationAR },
};

// Ajout d'une clé par défaut si absente
if (!resources.fr.translation.dashboard_summary) {
  resources.fr.translation.dashboard_summary = 'Synthèse de votre activité sur la plateforme.';
}
if (!resources.ar.translation.dashboard_summary) {
  resources.ar.translation.dashboard_summary = 'ملخص نشاطك على المنصة.';
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: localStorage.getItem('language') || 'ar',
    resources,
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
