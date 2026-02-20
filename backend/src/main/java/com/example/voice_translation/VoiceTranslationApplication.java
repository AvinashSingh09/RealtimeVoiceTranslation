package com.example.voice_translation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class VoiceTranslationApplication {

	public static void main(String[] args) {
        // Load .env file from the root directory (parent of backend)
        try {
            io.github.cdimascio.dotenv.Dotenv dotenv = io.github.cdimascio.dotenv.Dotenv.configure()
                    .directory("../") // Look in the project root
                    .ignoreIfMissing()
                    .load();
            
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
        } catch (Exception e) {
            System.out.println("No .env file found or error loading it: " + e.getMessage());
        }

		SpringApplication.run(VoiceTranslationApplication.class, args);
	}

}
