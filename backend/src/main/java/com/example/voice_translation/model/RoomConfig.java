package com.example.voice_translation.model;

public class RoomConfig {
    private String roomId;
    private String voiceModel;
    private String voiceGender; // Used as speakerAlias for Gemini
    private String voicePrompt;
    
    public RoomConfig() {
    }

    public RoomConfig(String roomId, String voiceModel, String voiceGender, String voicePrompt) {
        this.roomId = roomId;
        this.voiceModel = voiceModel;
        this.voiceGender = voiceGender;
        this.voicePrompt = voicePrompt;
    }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getVoiceModel() { return voiceModel; }
    public void setVoiceModel(String voiceModel) { this.voiceModel = voiceModel; }

    public String getVoiceGender() { return voiceGender; }
    public void setVoiceGender(String voiceGender) { this.voiceGender = voiceGender; }

    public String getVoicePrompt() { return voicePrompt; }
    public void setVoicePrompt(String voicePrompt) { this.voicePrompt = voicePrompt; }
}
