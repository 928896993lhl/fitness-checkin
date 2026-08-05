package com.fitness.checkin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 创建圈子请求DTO
 * 
 * @author Kou
 * @version 1.0.0
 */
@Data
public class CreateCircleRequest {

    /**
     * 圈子名称
     */
    @NotBlank(message = "圈子名称不能为空")
    @Size(min = 2, max = 50, message = "圈子名称长度必须在2-50个字符之间")
    private String name;

    /**
     * 圈子描述
     */
    @Size(max = 200, message = "圈子描述长度不能超过200个字符")
    private String description;

    /**
     * 最大成员数（2-50）
     */
    @Min(value = 2, message = "最大成员数不能小于2")
    @Max(value = 50, message = "最大成员数不能超过50")
    private Integer maxMembers = 50;
}