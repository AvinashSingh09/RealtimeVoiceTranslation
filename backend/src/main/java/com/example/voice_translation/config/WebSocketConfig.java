package com.example.voice_translation.config;

import com.example.voice_translation.handler.RealtimeTranslationHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final RealtimeTranslationHandler realtimeTranslationHandler;

    public WebSocketConfig(RealtimeTranslationHandler realtimeTranslationHandler) {
        this.realtimeTranslationHandler = realtimeTranslationHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(realtimeTranslationHandler, "/ws/translate")
                .setAllowedOrigins("*");
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean createWebSocketContainer() {
        var container = new org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean();
        container.setMaxSessionIdleTimeout(300000L);  // 5 min
        container.setMaxBinaryMessageBufferSize(128 * 1024);  // 128KB
        container.setMaxTextMessageBufferSize(64 * 1024);
        return container;
    }
}
