package com.example.voice_translation.service;

import com.example.voice_translation.model.RoomConfig;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoomService {
    
    // In-memory store for room configurations
    private final ConcurrentHashMap<String, RoomConfig> rooms = new ConcurrentHashMap<>();

    public RoomConfig createRoom(RoomConfig config) {
        // Generate a random 8-character room ID if not provided
        if (config.getRoomId() == null || config.getRoomId().trim().isEmpty()) {
            config.setRoomId(UUID.randomUUID().toString().substring(0, 8));
        }
        
        rooms.put(config.getRoomId(), config);
        return config;
    }

    public RoomConfig getRoom(String roomId) {
        return rooms.get(roomId);
    }
}
