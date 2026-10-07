package com.app.common;

import lombok.Getter;

/**
 * 나만의 팀 AI 대전 쿨타임 제한 예외 (30초 쿨타임 미충족 시 발생)
 */
@Getter
public class CustomCooldownException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /** 남은 대기 시간 (초) */
    private final int remainingSeconds;

    public CustomCooldownException(int remainingSeconds) {
        super("AI 대전은 30초에 한 번만 진행할 수 있습니다. (남은 시간: " + remainingSeconds + "초)");
        this.remainingSeconds = remainingSeconds;
    }

    public CustomCooldownException(int remainingSeconds, String message) {
        super(message);
        this.remainingSeconds = remainingSeconds;
    }
}
