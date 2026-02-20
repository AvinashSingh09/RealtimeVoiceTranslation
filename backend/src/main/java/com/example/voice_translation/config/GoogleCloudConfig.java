package com.example.voice_translation.config;

import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.speech.v2.SpeechClient;
import com.google.cloud.speech.v2.SpeechSettings;
import com.google.cloud.texttospeech.v1.TextToSpeechClient;
import com.google.cloud.texttospeech.v1.TextToSpeechSettings;
import com.google.cloud.translate.Translate;
import com.google.cloud.translate.TranslateOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class GoogleCloudConfig {

    @Value("${GOOGLE_APPLICATION_CREDENTIALS:}")
    private String credentialsPath;

    @Bean
    public GoogleCredentials googleCredentials() throws IOException {
        if (credentialsPath != null && !credentialsPath.isEmpty()) {
            return GoogleCredentials.fromStream(new FileInputStream(credentialsPath))
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");
        }
        return GoogleCredentials.getApplicationDefault()
                .createScoped("https://www.googleapis.com/auth/cloud-platform");
    }

    @Bean
    public SpeechClient speechClient(GoogleCredentials credentials) throws IOException {
        SpeechSettings settings = SpeechSettings.newBuilder()
                .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
                .setEndpoint("asia-south1-speech.googleapis.com:443")
                .build();
        return SpeechClient.create(settings);
    }

    @Bean
    public TextToSpeechClient textToSpeechClient() throws IOException {
        if (credentialsPath != null && !credentialsPath.isEmpty()) {
            GoogleCredentials credentials = GoogleCredentials.fromStream(new FileInputStream(credentialsPath));
            TextToSpeechSettings settings = TextToSpeechSettings.newBuilder()
                    .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
                    .build();
            return TextToSpeechClient.create(settings);
        }
        return TextToSpeechClient.create();
    }

    @Bean
    public Translate translateService() throws IOException {
        if (credentialsPath != null && !credentialsPath.isEmpty()) {
            GoogleCredentials credentials = GoogleCredentials.fromStream(new FileInputStream(credentialsPath));
            return TranslateOptions.newBuilder()
                    .setCredentials(credentials)
                    .build()
                    .getService();
        }
        return TranslateOptions.getDefaultInstance().getService();
    }
}
