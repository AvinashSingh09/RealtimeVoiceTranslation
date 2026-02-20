package com.example.voice_translation.service;

import com.google.api.gax.rpc.BidiStreamingCallable;
import com.google.api.gax.rpc.ClientStream;
import com.google.api.gax.rpc.ResponseObserver;
import com.google.api.gax.rpc.StreamController;
import com.google.cloud.speech.v2.AutoDetectDecodingConfig;
import com.google.cloud.speech.v2.RecognitionConfig;
import com.google.cloud.speech.v2.RecognizerName;
import com.google.cloud.speech.v2.SpeechClient;
import com.google.cloud.speech.v2.StreamingRecognitionConfig;
import com.google.cloud.speech.v2.StreamingRecognizeRequest;
import com.google.cloud.speech.v2.StreamingRecognizeResponse;
import com.google.protobuf.ByteString;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class SpeechToTextService {

    private final SpeechClient speechClient;
    private final String projectId = "gen-lang-client-0732328931";

    public SpeechToTextService(SpeechClient speechClient) {
        this.speechClient = speechClient;
    }

    public SpeechClient streamingRecognizeClient() {
        return speechClient;
    }

    public String transcribe(byte[] audioData, int sampleRateHertz, String languageCode, String contentType) {
        try {
            com.google.cloud.speech.v2.RecognizeRequest request = com.google.cloud.speech.v2.RecognizeRequest.newBuilder()
                    .setConfig(com.google.cloud.speech.v2.RecognitionConfig.newBuilder()
                            .setAutoDecodingConfig(com.google.cloud.speech.v2.AutoDetectDecodingConfig.newBuilder().build())
                            .addLanguageCodes(languageCode)
                            .setModel("chirp_3")
                            .build())
                    .setRecognizer(RecognizerName.of(projectId, "asia-south1", "_").toString())
                    .setContent(ByteString.copyFrom(audioData))
                    .build();

            com.google.cloud.speech.v2.RecognizeResponse response = speechClient.recognize(request);
            StringBuilder sb = new StringBuilder();
            response.getResultsList().forEach(r -> {
                if (r.getAlternativesCount() > 0) {
                    sb.append(r.getAlternativesList().get(0).getTranscript());
                }
            });
            return sb.toString();
        } catch (Exception e) {
            System.err.println("Transcription error: " + e.getMessage());
            return "";
        }
    }

    public interface StreamCallbacks {
        void onTranscript(String transcript);
        void onComplete();
        void onError(Throwable t);
    }

    public ClientStream<StreamingRecognizeRequest> startStreaming(
            String languageCode, StreamCallbacks callbacks) {

        ResponseObserver<StreamingRecognizeResponse> responseObserver = buildObserver(callbacks);

        BidiStreamingCallable<StreamingRecognizeRequest, StreamingRecognizeResponse> callable =
                speechClient.streamingRecognizeCallable();

        ClientStream<StreamingRecognizeRequest> requestStream = callable.splitCall(responseObserver);
        requestStream.send(buildConfigRequest(languageCode));
        return requestStream;
    }

    public void sendAudio(ClientStream<StreamingRecognizeRequest> stream, byte[] audioData) {
        StreamingRecognizeRequest request = StreamingRecognizeRequest.newBuilder()
                .setAudio(ByteString.copyFrom(audioData))
                .setRecognizer(RecognizerName.of(projectId, "asia-south1", "_").toString())
                .build();
        stream.send(request);
    }

    private StreamingRecognizeRequest buildConfigRequest(String languageCode) {
        AutoDetectDecodingConfig decodingConfig = AutoDetectDecodingConfig.newBuilder().build();

        RecognitionConfig config = RecognitionConfig.newBuilder()
                .setAutoDecodingConfig(decodingConfig)
                .addLanguageCodes(languageCode)
                .setModel("chirp_3")
                .build();

        StreamingRecognitionConfig streamingConfig = StreamingRecognitionConfig.newBuilder()
                .setConfig(config)
                .build();

        return StreamingRecognizeRequest.newBuilder()
                .setRecognizer(RecognizerName.of(projectId, "asia-south1", "_").toString())
                .setStreamingConfig(streamingConfig)
                .build();
    }

    private ResponseObserver<StreamingRecognizeResponse> buildObserver(StreamCallbacks callbacks) {
        return new ResponseObserver<>() {
            @Override
            public void onStart(StreamController controller) {}

            @Override
            public void onResponse(StreamingRecognizeResponse response) {
                response.getResultsList().forEach(result -> {
                    if (result.getIsFinal() && result.getAlternativesCount() > 0) {
                        callbacks.onTranscript(result.getAlternativesList().get(0).getTranscript());
                    }
                });
            }

            @Override
            public void onError(Throwable t) {
                System.err.println("STT Stream Error: " + t.getMessage());
                callbacks.onError(t);
            }

            @Override
            public void onComplete() {
                System.out.println("STT Stream Completed");
                callbacks.onComplete();
            }
        };
    }
}
