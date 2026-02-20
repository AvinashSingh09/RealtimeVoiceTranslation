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

@Component
public class RealtimeTranslationHandler extends AbstractWebSocketHandler {

    private final SpeechToTextService sttService;
    private final TranslationService translationService;
    private final TextToSpeechService ttsService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    // Per-session state
    private final Map<String, SessionState> sessions = new ConcurrentHashMap<>();

    public RealtimeTranslationHandler(SpeechToTextService stt, TranslationService tl, TextToSpeechService tts) {
        this.sttService = stt;
        this.translationService = tl;
        this.ttsService = tts;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String sid = session.getId();
        System.out.println("WS Connected: " + sid);
        String[] params = parseParams(session);
        sessions.put(sid, new SessionState(params[0], params[1], params[2], params[3], params[4]));
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
            System.err.println("handleTextMessage error: " + e.getMessage());
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        try {
            String sid = session.getId();
            SessionState state = sessions.get(sid);
            if (state == null) return;

            // Lazily initialize STT stream on first audio chunk
            if (state.stream == null) initSttStream(session, state);

            if (state.stream != null) {
                sttService.sendAudio(state.stream, message.getPayload().array());
            }
        } catch (Exception e) {
            // Swallow errors to prevent Tomcat from closing the WebSocket
            System.err.println("handleBinaryMessage error: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String sid = session.getId();
        System.out.println("WS Closed (" + status + "): " + sid);
        sessions.remove(sid);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        System.err.println("WS transport error (" + session.getId() + "): " + exception.getMessage());
    }

    private void initSttStream(WebSocketSession session, SessionState state) {
        String sid = session.getId();
        System.out.println("Starting STT stream: " + sid);

        ClientStream<StreamingRecognizeRequest> stream =
                sttService.startStreaming(state.sourceLang, new SpeechToTextService.StreamCallbacks() {
                    @Override
                    public void onTranscript(String transcript) {
                        state.pending.incrementAndGet();
                        executor.submit(() -> {
                            processTranscript(session, state, transcript);
                            if (state.pending.decrementAndGet() == 0 && state.sttDone.get()) {
                                sendText(session, "STREAM_COMPLETE");
                            }
                        });
                    }

                    @Override
                    public void onComplete() {
                        System.out.println("STT complete: " + sid);
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
    }

    private void processTranscript(WebSocketSession session, SessionState state, String transcript) {
        try {
            System.out.println("Transcript: " + transcript);
            sendText(session, "TRANSCRIPT:" + transcript);

            String translated = translationService.translateText(transcript, state.targetLang);
            System.out.println("Translated: " + translated);
            sendText(session, "TRANSLATION:" + translated);

            byte[] audio = ttsService.convertTextToSpeech(translated, state.targetLang, state.voiceModel, state.voiceGender, state.prompt);
            sendBinary(session, audio);
        } catch (Exception e) {
            System.err.println("Processing error: " + e.getMessage());
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

    private String[] parseParams(WebSocketSession session) {
        String src = "en-US", tgt = "es-ES", voice = "Standard", gender = "NEUTRAL", prompt = "";
        String query = session.getUri().getQuery();
        if (query != null) for (String p : query.split("&")) {
            String[] kv = p.split("=");
            if (kv.length == 2) {
                if ("source".equals(kv[0])) src = kv[1];
                if ("target".equals(kv[0])) tgt = kv[1];
                if ("voice".equals(kv[0])) voice = kv[1];
                if ("gender".equals(kv[0])) gender = kv[1];
                if ("prompt".equals(kv[0])) prompt = kv[1];
            }
        }
        return new String[]{src, tgt, voice, gender, prompt};
    }

    /** Encapsulates all per-session state to avoid NPE from concurrent map access */
    private static class SessionState {
        final String sourceLang;
        final String targetLang;
        final String voiceModel;
        final String voiceGender;
        final String prompt;
        final AtomicInteger pending = new AtomicInteger(0);
        final AtomicBoolean sttDone = new AtomicBoolean(false);
        volatile ClientStream<StreamingRecognizeRequest> stream;

        SessionState(String sourceLang, String targetLang, String voiceModel, String voiceGender, String prompt) {
            this.sourceLang = sourceLang;
            this.targetLang = targetLang;
            this.voiceModel = voiceModel;
            this.voiceGender = voiceGender;
            this.prompt = prompt != null ? java.net.URLDecoder.decode(prompt, java.nio.charset.StandardCharsets.UTF_8) : "";
        }
    }
}
