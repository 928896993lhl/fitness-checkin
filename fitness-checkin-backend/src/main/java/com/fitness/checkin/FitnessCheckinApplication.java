package com.fitness.checkin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 健身打卡小程序后端启动类
 * 
 * @author Kou
 * @version 1.0.0
 */
@SpringBootApplication
@MapperScan("com.fitness.checkin.mapper")
@EnableScheduling
public class FitnessCheckinApplication {

    public static void main(String[] args) {
        SpringApplication.run(FitnessCheckinApplication.class, args);
    }
}