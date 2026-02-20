package com.example.voice_translation.dto;

public class TranslationResponse {
    private String originalText;
    private String translatedText;
    private byte[] audioContent;

    public TranslationResponse(String originalText, String translatedText, byte[] audioContent) {
        this.originalText = originalText;
        this.translatedText = translatedText;
        this.audioContent = audioContent;
    }

    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    public String getTranslatedText() {
        return translatedText;
    }

    public void setTranslatedText(String translatedText) {
        this.translatedText = translatedText;
    }

    public byte[] getAudioContent() {
        return audioContent;
    }

    public void setAudioContent(byte[] audioContent) {
        this.audioContent = audioContent;
    }
}
