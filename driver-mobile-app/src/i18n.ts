import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import en from './locales/en.json';
import ur from './locales/ur.json';
import ar from './locales/ar.json';
import so from './locales/so.json';
import bn from './locales/bn.json';
import tr from './locales/tr.json';
import ro from './locales/ro.json';
import pl from './locales/pl.json';

const STORE_LANGUAGE_KEY = 'settings.lang';

const languageDetectorPlugin = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async function (callback: (lang: string) => void) {
    try {
      const language = await AsyncStorage.getItem(STORE_LANGUAGE_KEY);
      if (language) {
        return callback(language);
      } else {
        return callback('en');
      }
    } catch (error) {
      console.log('Error reading language', error);
      return callback('en');
    }
  },
  cacheUserLanguage: async function (language: string) {
    try {
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
      
      const isRTL = language === 'ar' || language === 'ur';
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
        // Note: For RTL changes to fully apply visually across all components, 
        // the user typically needs to restart the app. We can prompt this in the UI.
      }
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

const resources = {
  en: { translation: en },
  ur: { translation: ur },
  ar: { translation: ar },
  so: { translation: so },
  bn: { translation: bn },
  tr: { translation: tr },
  ro: { translation: ro },
  pl: { translation: pl }
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources,
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
