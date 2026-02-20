package com.example.voice_translation.controller;

import com.example.voice_translation.dto.TranslationResponse;
import com.example.voice_translation.service.SpeechToTextService;
import com.example.voice_translation.service.TextToSpeechService;
import com.example.voice_translation.service.TranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/translate")
@CrossOrigin(origins = "*") // Allow all origins for development
public class TranslationController {

    @Autowired
    private SpeechToTextService speechToTextService;

    @Autowired
    private TranslationService translationService;

    @Autowired
    private TextToSpeechService textToSpeechService;

    @PostMapping
    public ResponseEntity<TranslationResponse> processAudio(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("sourceLang") String sourceLang,
            @RequestParam("targetLang") String targetLang) {

        try {
            // 1. Convert Speech to Text
            // Assuming 16000Hz or reliance on config in service for now.
            //Ideally sourceLang comes from partial dictation but for now full processing.
            String contentType = audioFile.getContentType();
            String originalText = speechToTextService.transcribe(audioFile.getBytes(), 16000, sourceLang, contentType);
            
            if (originalText == null || originalText.isEmpty()) {
                return ResponseEntity.ok(new TranslationResponse("", "", null));
            }

            // 2. Translate Text
            String translatedText = translationService.translateText(originalText, targetLang);

            // 3. Convert Text to Speech
            byte[] audioContent = textToSpeechService.convertTextToSpeech(translatedText, targetLang);

            return ResponseEntity.ok(new TranslationResponse(originalText, translatedText, audioContent));

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
