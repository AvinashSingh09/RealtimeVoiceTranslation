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

@Service
public class TextToSpeechService {

    private final TextToSpeechClient textToSpeechClient;
    private final GoogleCredentials credentials;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TextToSpeechService(TextToSpeechClient textToSpeechClient, GoogleCredentials credentials) {
        this.textToSpeechClient = textToSpeechClient;
        this.credentials = credentials;
    }

    public byte[] convertTextToSpeech(String text, String languageCode) throws IOException {
        return convertTextToSpeech(text, languageCode, "Standard", "NEUTRAL", "");
    }

    public byte[] convertTextToSpeech(String text, String languageCode, String voiceModel, String gender, String prompt) throws IOException {
        if (voiceModel != null && voiceModel.startsWith("gemini")) {
            return generateWithGeminiREST(text, languageCode, voiceModel, gender, prompt);
        }

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

        SynthesizeSpeechResponse response = textToSpeechClient.synthesizeSpeech(
                input, voiceBuilder.build(), audioConfig);

        return response.getAudioContent().toByteArray();
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
        voice.put("model_name", voiceModel);
        voice.put("name", (speakerAlias == null || speakerAlias.trim().isEmpty() || speakerAlias.equals("NEUTRAL")) ? "Kore" : speakerAlias);
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
        System.out.println("Calling Gemini TTS REST API for model: " + voiceModel + " speaker: " + voice.get("name") + " project: " + projectId);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            String audioContentBase64 = root.path("audioContent").asText();
            return Base64.getDecoder().decode(audioContentBase64);
        } else {
            throw new IOException("Failed to call Gemini TTS API: " + response.getStatusCode() + " - " + response.getBody());
        }
    }
}
