package com.fitness.checkin.controller;

import com.fitness.checkin.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 健康检查控制器
 * 用于服务状态检查
 * 
 * @author Kou
 * @version 1.0.0
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    /**
     * 健康检查接口
     * 
     * @return 服务状态
     */
    @GetMapping
    public Result<?> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("timestamp", LocalDateTime.now());
        status.put("service", "fitness-checkin-backend");
        status.put("version", "1.0.0");
        
        return Result.success(status);
    }
}