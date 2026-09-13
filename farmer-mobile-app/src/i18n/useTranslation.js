import { translations } from './translations';

export const getTranslation = (langCode, key) => {
  if (!translations[langCode]) {
    // fallback to English if language not found
    return translations['en-IN'][key] || key;
  }
  
  return translations[langCode][key] || translations['en-IN'][key] || key;
};

// Custom hook to use in components
export const useTranslation = (language) => {
  return {
    t: (key) => getTranslation(language, key)
  };
};
