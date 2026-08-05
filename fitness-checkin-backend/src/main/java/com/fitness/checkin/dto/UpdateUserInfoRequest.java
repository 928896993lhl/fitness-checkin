package com.fitness.checkin.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新用户信息请求DTO
 * 部分字段更新：nickname / avatarUrl 均可选，但至少提供一个字段
 *
 * @author Kou
 * @version 1.0.0
 */
@Data
public class UpdateUserInfoRequest {

    /**
     * 昵称（可选，2-20个字符；空字符串由 @Size 拦截）
     */
    @Size(min = 2, max = 20, message = "昵称长度必须在2-20个字符之间")
    private String nickname;

    /**
     * 头像URL（可选；传空字符串表示清空头像）
     */
    @Size(max = 500, message = "头像URL长度不能超过500个字符")
    private String avatarUrl;
}
