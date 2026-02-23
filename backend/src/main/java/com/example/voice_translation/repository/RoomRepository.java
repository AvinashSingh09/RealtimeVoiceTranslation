package com.example.voice_translation.repository;

import com.example.voice_translation.model.RoomEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends MongoRepository<RoomEntity, String> {
}
