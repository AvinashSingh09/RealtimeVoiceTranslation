package com.example.voice_translation.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rooms")
public class RoomEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    @Column(name = "voice_model", nullable = false)
    private String voiceModel;

    @Column(name = "voice_gender", nullable = false)
    private String voiceGender;

    @Column(name = "voice_prompt", columnDefinition = "TEXT")
    private String voicePrompt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Default Constructor for JPA
    public RoomEntity() {
    }

    public RoomEntity(UUID id, UUID adminId, String voiceModel, String voiceGender, String voicePrompt) {
        this.id = id;
        this.adminId = adminId;
        this.voiceModel = voiceModel;
        this.voiceGender = voiceGender;
        this.voicePrompt = voicePrompt;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getAdminId() { return adminId; }
    public void setAdminId(UUID adminId) { this.adminId = adminId; }

    public String getVoiceModel() { return voiceModel; }
    public void setVoiceModel(String voiceModel) { this.voiceModel = voiceModel; }

    public String getVoiceGender() { return voiceGender; }
    public void setVoiceGender(String voiceGender) { this.voiceGender = voiceGender; }

    public String getVoicePrompt() { return voicePrompt; }
    public void setVoicePrompt(String voicePrompt) { this.voicePrompt = voicePrompt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
