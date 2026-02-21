package com.example.voice_translation.service;

import com.google.cloud.texttospeech.v1.*;
import com.google.protobuf.ByteString;
import org.springframework.stereotype.Service;

import java.io.IOException;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Collections;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.client.HttpStatusCodeException;

@Service
public class TextToSpeechService {

    private final TextToSpeechClient textToSpeechClient;
    private final GoogleCredentials credentials;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, byte[]> audioCache = new ConcurrentHashMap<>();

    public TextToSpeechService(TextToSpeechClient textToSpeechClient, GoogleCredentials credentials) {
        this.textToSpeechClient = textToSpeechClient;
        this.credentials = credentials;
    }

    public byte[] convertTextToSpeech(String text, String languageCode) throws IOException {
        return convertTextToSpeech(text, languageCode, "Standard", "NEUTRAL", "");
    }

    public byte[] convertTextToSpeech(String text, String languageCode, String voiceModel, String gender, String prompt) throws IOException {
        String cacheKey = text + "|" + languageCode + "|" + voiceModel + "|" + gender + "|" + prompt;
        if (audioCache.containsKey(cacheKey)) {
            return audioCache.get(cacheKey);
        }

        byte[] audioData;
        if (voiceModel != null && (voiceModel.startsWith("gemini") || voiceModel.toLowerCase().contains("chirp"))) {
            audioData = generateWithGeminiREST(text, languageCode, voiceModel, gender, prompt);
        } else {
            SynthesisInput input = SynthesisInput.newBuilder().setText(text).build();

            SsmlVoiceGender ssmlGender = switch (gender != null ? gender : "NEUTRAL") {
                case "MALE" -> SsmlVoiceGender.MALE;
                case "FEMALE" -> SsmlVoiceGender.FEMALE;
                default -> SsmlVoiceGender.NEUTRAL;
            };

            VoiceSelectionParams.Builder voiceBuilder = VoiceSelectionParams.newBuilder()
                    .setLanguageCode(languageCode)
                    .setSsmlGender(ssmlGender);

            // Construct voice name like "en-US-Neural2-A" (F) or "en-US-Neural2-B" (M)
            if (voiceModel != null && !voiceModel.isEmpty() && !"Standard".equals(voiceModel)) {
                String suffix = ssmlGender == SsmlVoiceGender.MALE ? "-B" : "-A";
                voiceBuilder.setName(languageCode + "-" + voiceModel + suffix);
            }

            AudioConfig audioConfig = AudioConfig.newBuilder()
                    .setAudioEncoding(AudioEncoding.MP3)
                    .build();

            try {
                SynthesizeSpeechResponse response = textToSpeechClient.synthesizeSpeech(
                        input, voiceBuilder.build(), audioConfig);
                audioData = response.getAudioContent().toByteArray();
            } catch (Exception e) {
                System.err.println("Voice " + voiceBuilder.getName() + " not found, falling back to Standard for " + languageCode);
                
                // Fallback attempt with just the language code (auto-assigns standard default)
                VoiceSelectionParams fallbackVoice = VoiceSelectionParams.newBuilder()
                    .setLanguageCode(languageCode)
                    .setSsmlGender(ssmlGender)
                    .build();
                
                try {
                    SynthesizeSpeechResponse fallbackResponse = textToSpeechClient.synthesizeSpeech(
                            input, fallbackVoice, audioConfig);
                    audioData = fallbackResponse.getAudioContent().toByteArray();
                } catch (Exception fallbackErr) {
                    throw new IOException("TTS Failed even on fallback: " + fallbackErr.getMessage());
                }
            }
        }

        audioCache.put(cacheKey, audioData);
        if (audioCache.size() > 1000) audioCache.clear();
        return audioData;
    }

    private byte[] generateWithGeminiREST(String text, String languageCode, String voiceModel, String speakerAlias, String prompt) throws IOException {
        credentials.refreshIfExpired();
        String token = credentials.getAccessToken().getTokenValue();

        // Get project ID from the service account credentials (not ServiceOptions which returns wrong project)
        String projectId = (credentials instanceof ServiceAccountCredentials)
                ? ((ServiceAccountCredentials) credentials).getProjectId()
                : null;

        Map<String, Object> body = new HashMap<>();
        
        Map<String, String> input = new HashMap<>();
        input.put("text", text);
        if (prompt != null && !prompt.trim().isEmpty()) {
            input.put("prompt", prompt);
        }
        body.put("input", input);

        Map<String, String> voice = new HashMap<>();
        voice.put("languageCode", languageCode);
        
        // Chirp-3-HD requires different voice name formats than Gemini
        if (voiceModel.toLowerCase().contains("chirp")) {
            voice.put("name", languageCode + "-journey-D");
        } else {
            voice.put("model_name", voiceModel);
            voice.put("name", (speakerAlias == null || speakerAlias.trim().isEmpty() || speakerAlias.equals("NEUTRAL")) ? "Kore" : speakerAlias);
        }

        body.put("voice", voice);

        Map<String, String> audioConfig = new HashMap<>();
        audioConfig.put("audioEncoding", "MP3");
        body.put("audioConfig", audioConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        if (projectId != null) {
            headers.set("x-goog-user-project", projectId);
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        String url = "https://texttospeech.googleapis.com/v1/text:synthesize";
        
        int maxRetries = 4;
        long backoffDelay = 1000;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (attempt == 1) {
                    System.out.println("Calling Gemini TTS REST API for model: " + voiceModel + " speaker: " + voice.get("name") + " project: " + projectId);
                }
                ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    String audioContentBase64 = root.path("audioContent").asText();
                    return Base64.getDecoder().decode(audioContentBase64);
                }
            } catch (HttpStatusCodeException e) {
                if (e.getRawStatusCode() == 429 && attempt < maxRetries) {
                    System.err.println("Gemini TTS 429 Rate Limit. Retrying in " + backoffDelay + "ms (Attempt " + attempt + ")");
                    try { Thread.sleep(backoffDelay); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                    backoffDelay *= 2;
                } else {
                    throw new IOException("Failed to call Gemini TTS API: " + e.getRawStatusCode() + " - " + e.getResponseBodyAsString());
                }
            } catch (Exception e) {
                if (attempt == maxRetries) {
                    throw new IOException("Failed to call Gemini TTS API: " + e.getMessage(), e);
                }
                try { Thread.sleep(backoffDelay); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                backoffDelay *= 2;
            }
        }
        throw new IOException("Failed to call Gemini TTS API after retries");
    }
}
