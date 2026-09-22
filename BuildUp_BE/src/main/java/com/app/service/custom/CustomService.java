package com.app.service.custom;
import com.app.dto.custom.CustomTeams;

public interface CustomService {
    CustomTeams findByUserId(Long userId);
    CustomTeams save(Long userId, CustomTeams team);
}
