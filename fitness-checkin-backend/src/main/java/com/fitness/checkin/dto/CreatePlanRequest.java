package com.fitness.checkin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * 创建计划请求DTO
 * 
 * @author Kou
 * @version 1.0.0
 */
@Data
public class CreatePlanRequest {

    /**
     * 圈子ID
     */
    @NotNull(message = "圈子ID不能为空")
    private Long circleId;

    /**
     * 计划名称
     */
    @NotBlank(message = "计划名称不能为空")
    @Size(min = 2, max = 50, message = "计划名称长度必须在2-50个字符之间")
    private String name;

    /**
     * 计划描述
     */
    @Size(max = 200, message = "计划描述长度不能超过200个字符")
    private String description;

    /**
     * 开始日期
     */
    @NotNull(message = "开始日期不能为空")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    /**
     * 结束日期
     */
    @NotNull(message = "结束日期不能为空")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    /**
     * 总时长目标（分钟）
     */
    @Min(value = 0, message = "总时长目标不能小于0")
    private Integer totalDurationGoal = 0;

    /**
     * 每日时长目标（分钟）
     */
    @Min(value = 1, message = "每日时长目标不能小于1分钟")
    private Integer dailyDurationGoal = 30;

    /**
     * 圈子总目标（分钟）
     */
    @Min(value = 0, message = "圈子总目标不能小于0")
    private Integer circleTotalGoal = 0;

    /**
     * 每次打卡最小时间（分钟）
     */
    @Min(value = 1, message = "每次打卡最小时间不能小于1分钟")
    private Integer minDurationPerCheckin = 10;
}