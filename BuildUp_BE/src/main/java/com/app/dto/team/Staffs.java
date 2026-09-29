package com.app.dto.team;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Staffs {
    private Long staffId;
    private String name;
    private String nameKor;
    private String nationality;
    private String nationalityKor;
    private Long teamId;
    private Long staffRoleId;
    private String roleName;
}
