package com.example.voice_translation.service;

import com.google.api.gax.rpc.BidiStreamingCallable;
import com.google.api.gax.rpc.ClientStream;
import com.google.api.gax.rpc.ResponseObserver;
import com.google.api.gax.rpc.StreamController;
import com.google.cloud.speech.v1.RecognitionConfig;
import com.google.cloud.speech.v1.SpeechClient;
import com.google.cloud.speech.v1.StreamingRecognitionConfig;
import com.google.cloud.speech.v1.StreamingRecognizeRequest;
import com.google.cloud.speech.v1.StreamingRecognizeResponse;
import com.google.protobuf.ByteString;
import org.springframework.stereotype.Service;

@Service
public class SpeechToTextService {

    private final SpeechClient speechClient;

    public SpeechToTextService(SpeechClient speechClient) {
        this.speechClient = speechClient;
    }

    public String transcribe(byte[] audioData, int sampleRate, String languageCode, String contentType)
            throws java.io.IOException {
        com.google.protobuf.ByteString audioBytes = com.google.protobuf.ByteString.copyFrom(audioData);
        com.google.cloud.speech.v1.RecognitionConfig.AudioEncoding encoding = mapEncoding(contentType);

        com.google.cloud.speech.v1.RecognitionConfig.Builder cb = com.google.cloud.speech.v1.RecognitionConfig.newBuilder()
                .setEncoding(encoding).setLanguageCode(languageCode);
        if (encoding == com.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.MP3) cb.setSampleRateHertz(16000);

        com.google.cloud.speech.v1.RecognitionAudio audio = com.google.cloud.speech.v1.RecognitionAudio.newBuilder()
                .setContent(audioBytes).build();
        com.google.cloud.speech.v1.RecognizeResponse resp = speechClient.recognize(cb.build(), audio);

        StringBuilder sb = new StringBuilder();
        resp.getResultsList().forEach(r -> {
            if (r.getAlternativesCount() > 0) sb.append(r.getAlternativesList().get(0).getTranscript());
        });
        return sb.toString();
    }

    private com.google.cloud.speech.v1.RecognitionConfig.AudioEncoding mapEncoding(String ct) {
        if (ct == null) return com.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.ENCODING_UNSPECIFIED;
        return switch (ct) {
            case "audio/webm", "audio/ogg" -> com.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS;
            case "audio/mpeg", "audio/mp3" -> com.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.MP3;
            case "audio/flac" -> com.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.FLAC;
            case "audio/wav" -> com.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16;
            default -> com.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.ENCODING_UNSPECIFIED;
        };
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
                .setAudioContent(ByteString.copyFrom(audioData))
                .build();
        stream.send(request);
    }

    private StreamingRecognizeRequest buildConfigRequest(String languageCode) {
        RecognitionConfig config = RecognitionConfig.newBuilder()
                .setEncoding(RecognitionConfig.AudioEncoding.WEBM_OPUS)
                .setLanguageCode(languageCode)
                .setSampleRateHertz(48000)
                .build();

        StreamingRecognitionConfig streamingConfig = StreamingRecognitionConfig.newBuilder()
                .setConfig(config)
                .setInterimResults(false)
                .build();

        return StreamingRecognizeRequest.newBuilder()
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
