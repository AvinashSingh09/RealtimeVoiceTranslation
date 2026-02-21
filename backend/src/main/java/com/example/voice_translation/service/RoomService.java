package com.example.voice_translation.service;

import com.example.voice_translation.model.RoomConfig;
import com.example.voice_translation.model.RoomEntity;
import com.example.voice_translation.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class RoomService {
    
    private final RoomRepository roomRepository;

    @Autowired
    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public RoomConfig createRoom(RoomConfig config) {
        if (config.getRoomId() == null || config.getRoomId().isEmpty()) {
            config.setRoomId(UUID.randomUUID().toString());
        }
        
        UUID uuidId = UUID.fromString(config.getRoomId());
        
        // Get or Create
        RoomEntity entity = roomRepository.findById(uuidId)
                .orElse(new RoomEntity());
        
        if (entity.getId() == null) {
            entity.setId(uuidId);
        }
        
        entity.setVoiceModel(config.getVoiceModel());
        entity.setVoiceGender(config.getVoiceGender());
        entity.setVoicePrompt(config.getVoicePrompt());
        
        roomRepository.save(entity);
        return config;
    }

    public RoomConfig getRoom(String roomId) {
        try {
            UUID uuidId = UUID.fromString(roomId);
            Optional<RoomEntity> entityOpt = roomRepository.findById(uuidId);
            if (entityOpt.isPresent()) {
                RoomEntity entity = entityOpt.get();
                return new RoomConfig(
                    entity.getId().toString(),
                    entity.getVoiceModel(),
                    entity.getVoiceGender(),
                    entity.getVoicePrompt()
                );
            }
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid Room ID format: " + roomId);
        }
        return null;
    }
}
