package com.fitness.checkin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 登录请求DTO
 * 
 * @author Kou
 * @version 1.0.0
 */
@Data
public class LoginRequest {

    /**
     * 微信登录code
     */
    @NotBlank(message = "登录code不能为空")
    private String code;

    /**
     * 用户昵称（可选）
     */
    private String nickname;

    /**
     * 用户头像URL（可选）
     */
    private String avatarUrl;
}