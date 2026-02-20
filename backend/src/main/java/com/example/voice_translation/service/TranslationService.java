package com.example.voice_translation.service;

import com.google.cloud.translate.Translate;
import com.google.cloud.translate.TranslateOptions;
import com.google.cloud.translate.Translation;
import org.springframework.stereotype.Service;

@Service
public class TranslationService {

    private final Translate translate;

    public TranslationService(Translate translate) {
        this.translate = translate;
    }

    /**
     * Translates the given text to the target language.
     *
     * @param originalText       The text to translate.
     * @param targetLanguageCode The target language code (e.g., "es").
     * @return The translated text.
     */
    public String translateText(String originalText, String targetLanguageCode) {
        Translation translation = translate.translate(
                originalText,
                Translate.TranslateOption.targetLanguage(targetLanguageCode));

        return translation.getTranslatedText();
    }
}
