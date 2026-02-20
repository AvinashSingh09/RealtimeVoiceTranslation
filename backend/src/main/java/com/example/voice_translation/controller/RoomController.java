package com.example.voice_translation.controller;

import com.example.voice_translation.model.RoomConfig;
import com.example.voice_translation.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*") // Allow frontend to call APIs directly
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity<RoomConfig> createRoom(@RequestBody RoomConfig config) {
        RoomConfig createdRoom = roomService.createRoom(config);
        return ResponseEntity.ok(createdRoom);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomConfig> getRoom(@PathVariable String roomId) {
        RoomConfig config = roomService.getRoom(roomId);
        if (config == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(config);
    }
}
