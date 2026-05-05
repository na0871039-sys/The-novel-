import { useState, useEffect } from 'react';
import { translateText } from '../services/translationService';
import { useLanguage } from '../contexts/LanguageContext';

export function useTranslation(text: string | undefined) {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState(text || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text) {
      setTranslated('');
      return;
    }

    if (language.code === 'en') {
      setTranslated(text);
      return;
    }

    const performTranslation = async () => {
      setLoading(true);
      const result = await translateText(text, language.name);
      setTranslated(result);
      setLoading(false);
    };

    performTranslation();
  }, [text, language.code]);

  return { translated, loading };
}
