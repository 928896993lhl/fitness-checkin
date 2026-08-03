package com.fitness.checkin.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web配置类
 * 配置静态资源映射等
 * 
 * @author Kou
 * @version 1.0.0
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${fitness.upload.path}")
    private String uploadPath;

    /**
     * 配置静态资源映射
     * 将上传的文件映射到 /files/ 路径
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 本地文件系统映射
        String location = "file:" + uploadPath;
        if (!location.endsWith("/")) {
            location += "/";
        }
        registry.addResourceHandler("/files/**")
                .addResourceLocations(location);
    }
}