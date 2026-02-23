package com.example.voice_translation.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Document(collection = "rooms")
public class RoomEntity {

    @Id
    private String id;

    @Field("admin_id")
    private String adminId;

    @Field("voice_model")
    private String voiceModel;

    @Field("voice_gender")
    private String voiceGender;

    @Field("voice_prompt")
    private String voicePrompt;

    @Field("created_at")
    private Instant createdAt;

    public RoomEntity() {
        this.createdAt = Instant.now();
    }

    public RoomEntity(String id, String adminId, String voiceModel, String voiceGender, String voicePrompt) {
        this.id = id;
        this.adminId = adminId;
        this.voiceModel = voiceModel;
        this.voiceGender = voiceGender;
        this.voicePrompt = voicePrompt;
        this.createdAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public String getVoiceModel() { return voiceModel; }
    public void setVoiceModel(String voiceModel) { this.voiceModel = voiceModel; }

    public String getVoiceGender() { return voiceGender; }
    public void setVoiceGender(String voiceGender) { this.voiceGender = voiceGender; }

    public String getVoicePrompt() { return voicePrompt; }
    public void setVoicePrompt(String voicePrompt) { this.voicePrompt = voicePrompt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
