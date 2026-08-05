package com.fitness.checkin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 打卡请求DTO
 * 宽松打卡：planId/circleId 均可空；duration 全局 1-480
 * 
 * @author Kou
 * @version 1.0.0
 */
@Data
public class CheckinRequest {

    /**
     * 计划ID（可空：宽松打卡不依赖计划；传 null/省略，禁止传空字符串）
     */
    private Long planId;

    /**
     * 圈子ID（可空：宽松打卡可关联圈子；非空时后端校验用户是该圈成员）
     */
    private Long circleId;

    /**
     * 运动时长（分钟），全局 1-480
     */
    @NotNull(message = "运动时长不能为空")
    @Min(value = 1, message = "运动时长不能小于1分钟")
    @Max(value = 480, message = "运动时长不能超过480分钟")
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
