package com.example.voice_translation.handler;

import com.example.voice_translation.service.SpeechToTextService;
import com.example.voice_translation.service.TextToSpeechService;
import com.example.voice_translation.service.TranslationService;
import com.google.api.gax.rpc.ClientStream;
import com.google.cloud.speech.v1.StreamingRecognizeRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CompletableFuture;
import com.google.api.gax.rpc.StreamController;
import com.google.api.gax.rpc.ResponseObserver;
import com.google.cloud.speech.v1.StreamingRecognitionResult;
import com.google.cloud.speech.v1.StreamingRecognitionConfig;
import com.google.cloud.speech.v1.StreamingRecognizeResponse;
import com.google.protobuf.ByteString;

@Component
public class RealtimeTranslationHandler extends AbstractWebSocketHandler {

    private final SpeechToTextService sttService;
    private final TranslationService translationService;
    private final TextToSpeechService ttsService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    // Per-session and Room state
    private final Map<String, SessionState> sessions = new ConcurrentHashMap<>();
    private final Map<String, List<WebSocketSession>> rooms = new ConcurrentHashMap<>();

    public RealtimeTranslationHandler(SpeechToTextService stt, TranslationService tl, TextToSpeechService tts) {
        this.sttService = stt;
        this.translationService = tl;
        this.ttsService = tts;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String sid = session.getId();
        SessionState state = parseParams(session);
        sessions.put(sid, state);
        
        // Add session to room group
        rooms.computeIfAbsent(state.roomId, k -> new CopyOnWriteArrayList<>()).add(session);
        System.out.println("WS Connected: " + sid + " | Role: " + state.role + " | Room: " + state.roomId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            if ("END_OF_AUDIO".equals(message.getPayload())) {
                String sid = session.getId();
                System.out.println("End of audio: " + sid);
                SessionState state = sessions.get(sid);
                if (state != null && state.stream != null) {
                    try { state.stream.closeSend(); } catch (Exception e) {
                        System.err.println("Error closing stream: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error handling text message: " + e.getMessage());
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        SessionState state = sessions.get(session.getId());
        if (state == null || !"speaker".equals(state.role)) {
            // Only 'speaker' roles should be sending audio up to the server.
            return; 
        }

        try {
            if (state.stream == null) {
                initSttStream(session, state);
            }
            StreamingRecognizeRequest request = StreamingRecognizeRequest.newBuilder()
                    .setAudioContent(ByteString.copyFrom(message.getPayload()))
                    .build();
            state.stream.send(request);
        } catch (Exception e) {
            System.err.println("Error handling binary message: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String sid = session.getId();
        SessionState state = sessions.remove(sid);
        if (state != null) {
            List<WebSocketSession> roomSessions = rooms.get(state.roomId);
            if (roomSessions != null) {
                roomSessions.remove(session);
                if (roomSessions.isEmpty()) rooms.remove(state.roomId);
            }
            if (state.stream != null) {
                try { state.stream.closeSend(); } catch (Exception ignored) {}
            }
        }
        System.out.println("WS Disconnected: " + sid);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        System.err.println("WS transport error (" + session.getId() + "): " + exception.getMessage());
    }

    private void initSttStream(WebSocketSession session, SessionState state) {
        System.out.println("Initializing STT stream for session " + session.getId());
        ClientStream<StreamingRecognizeRequest> stream = sttService.streamingRecognizeClient()
                .streamingRecognizeCallable()
                .splitCall(new ResponseObserver<StreamingRecognizeResponse>() {
                    @Override
                    public void onStart(StreamController controller) {}

                    @Override
                    public void onResponse(StreamingRecognizeResponse response) {
                        for (StreamingRecognitionResult result : response.getResultsList()) {
                            if (result.getIsFinal()) {
                                String transcript = result.getAlternatives(0).getTranscript();
                                processTranscriptForRoom(session, state, transcript);
                            }
                        }
                    }

                    @Override
                    public void onComplete() {
                        System.out.println("STT stream complete for " + session.getId());
                        state.sttDone.set(true);
                        if (state.pending.get() == 0) sendText(session, "STREAM_COMPLETE");
                    }

                    @Override
                    public void onError(Throwable t) {
                        System.err.println("STT error: " + t.getMessage());
                        state.sttDone.set(true);
                        if (state.pending.get() == 0) sendText(session, "STREAM_COMPLETE");
                    }
                });

        state.stream = stream;
        
        // Send the config request first
        StreamingRecognitionConfig recognitionConfig = StreamingRecognitionConfig.newBuilder()
                .setConfig(sttService.getRecognitionConfig(state.sourceLang))
                .setInterimResults(false)
                .build();
        stream.send(StreamingRecognizeRequest.newBuilder()
                .setStreamingConfig(recognitionConfig).build());
    }

    private void processTranscriptForRoom(WebSocketSession speakerSession, SessionState speakerState, String transcript) {
        try {
            System.out.println("Room " + speakerState.roomId + " Transcript: " + transcript);
            // 1. Send Transcript back to speaker
            sendText(speakerSession, "TRANSCRIPT:" + transcript);

            // 2. Broadcast to all Listeners in the room
            List<WebSocketSession> roomSessions = rooms.get(speakerState.roomId);
            if (roomSessions == null) return;

            for (WebSocketSession listenerSession : roomSessions) {
                SessionState listenerState = sessions.get(listenerSession.getId());
                if (listenerState == null || !"listener".equals(listenerState.role)) continue;
                
                speakerState.pending.incrementAndGet();
                
                // Do the translation and TTS asynchronously so one slow listener doesn't block the loop
                CompletableFuture.runAsync(() -> {
                    try {
                        String translated = translationService.translateText(transcript, listenerState.targetLang);
                        sendText(listenerSession, "TRANSLATION:" + translated);

                        byte[] audio = ttsService.convertTextToSpeech(
                                translated, listenerState.targetLang, 
                                listenerState.voiceModel, listenerState.voiceGender, listenerState.prompt);
                        
                        sendBinary(listenerSession, audio);
                    } catch (Exception e) {
                        System.err.println("Listener processing error: " + e.getMessage());
                    } finally {
                        if (speakerState.pending.decrementAndGet() == 0 && speakerState.sttDone.get()) {
                            sendText(speakerSession, "STREAM_COMPLETE");
                        }
                    }
                });
            }
        } catch (Exception e) {
            System.err.println("Room Broadcasting error: " + e.getMessage());
        }
    }

    private void sendText(WebSocketSession session, String text) {
        try {
            if (session.isOpen()) synchronized (session) { session.sendMessage(new TextMessage(text)); }
        } catch (IOException e) { System.err.println("Send error: " + e.getMessage()); }
    }

    private void sendBinary(WebSocketSession session, byte[] data) {
        try {
            if (session.isOpen()) synchronized (session) { session.sendMessage(new BinaryMessage(data)); }
        } catch (IOException e) { System.err.println("Send error: " + e.getMessage()); }
    }

    private SessionState parseParams(WebSocketSession session) {
        String role = "speaker", roomId = "default";
        String src = "en-US", tgt = "en-US", voice = "Standard", gender = "NEUTRAL", prompt = "";
        
        String query = session.getUri().getQuery();
        if (query != null) {
            for (String p : query.split("&")) {
                String[] kv = p.split("=");
                if (kv.length == 2) {
                    if ("roomId".equals(kv[0])) roomId = kv[1];
                    if ("role".equals(kv[0])) role = kv[1];
                    if ("source".equals(kv[0])) src = kv[1];
                    if ("target".equals(kv[0])) tgt = kv[1];
                    if ("voice".equals(kv[0])) voice = kv[1];
                    if ("gender".equals(kv[0])) gender = kv[1];
                    if ("prompt".equals(kv[0])) prompt = kv[1];
                }
            }
        }
        return new SessionState(roomId, role, src, tgt, voice, gender, prompt);
    }

    /** Encapsulates all per-session state */
    private static class SessionState {
        final String roomId;
        final String role;
        final String sourceLang;
        final String targetLang;
        final String voiceModel;
        final String voiceGender;
        final String prompt;
        final AtomicInteger pending = new AtomicInteger(0);
        final AtomicBoolean sttDone = new AtomicBoolean(false);
        volatile ClientStream<StreamingRecognizeRequest> stream;

        SessionState(String roomId, String role, String sourceLang, String targetLang, String voiceModel, String voiceGender, String prompt) {
            this.roomId = roomId;
            this.role = role;
            this.sourceLang = sourceLang;
            this.targetLang = targetLang;
            this.voiceModel = voiceModel;
            this.voiceGender = voiceGender;
            this.prompt = prompt != null ? java.net.URLDecoder.decode(prompt, java.nio.charset.StandardCharsets.UTF_8) : "";
        }
    }
}
