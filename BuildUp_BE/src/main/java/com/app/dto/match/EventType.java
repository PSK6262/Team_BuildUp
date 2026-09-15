package com.app.dto.match;

import lombok.Data;

@Data
public class EventType {
    private Long eventTypeCode;        // [PK] 이벤트 유형 코드 식별자
    private String eventTypeName;      // 이벤트 유형 명칭 (골, 경고 등)
    private String eventIconUrl;       // 이벤트 표시 아이콘 URL
}
