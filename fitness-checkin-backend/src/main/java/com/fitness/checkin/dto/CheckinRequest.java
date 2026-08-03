package com.fitness.checkin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 打卡请求DTO
 * 
 * @author Kou
 * @version 1.0.0
 */
@Data
public class CheckinRequest {

    /**
     * 计划ID
     */
    @NotNull(message = "计划ID不能为空")
    private Long planId;

    /**
     * 运动时长（分钟）
     */
    @NotNull(message = "运动时长不能为空")
    @Min(value = 1, message = "运动时长不能小于1分钟")
    private Integer duration;

    /**
     * 运动类型
     */
    @NotBlank(message = "运动类型不能为空")
    @Size(max = 50, message = "运动类型长度不能超过50个字符")
    private String exerciseType;

    /**
     * 打卡照片URL
     */
    @Size(max = 500, message = "照片URL长度不能超过500个字符")
    private String photoUrl;

    /**
     * 备注
     */
    @Size(max = 500, message = "备注长度不能超过500个字符")
    private String remark;
}