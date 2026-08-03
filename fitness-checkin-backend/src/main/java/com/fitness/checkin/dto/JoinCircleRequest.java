package com.fitness.checkin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 加入圈子请求DTO
 * 
 * @author Kou
 * @version 1.0.0
 */
@Data
public class JoinCircleRequest {

    /**
     * 邀请码
     */
    @NotBlank(message = "邀请码不能为空")
    @Size(min = 8, max = 8, message = "邀请码长度必须为8个字符")
    private String inviteCode;
}