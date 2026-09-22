package com.app.service.custom;
import com.app.dto.custom.CustomTeams;
import com.app.dto.custom.AiMatches;

public interface CustomService {
    AiMatches playAiMatch(AiMatches.Request request);
    CustomTeams findByUserId(Long userId);
    CustomTeams save(Long userId, CustomTeams team);
}
