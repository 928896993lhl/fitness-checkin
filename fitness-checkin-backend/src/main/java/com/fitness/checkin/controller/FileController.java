package com.fitness.checkin.controller;

import com.fitness.checkin.common.Result;
import com.fitness.checkin.service.FileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * 文件控制器
 * 处理文件上传和访问相关的请求
 * 
 * @author Kou
 * @version 1.0.0
 */
@RestController
@RequestMapping("/files")
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    /**
     * 上传文件
     * 
     * @param file 上传的文件
     * @return 文件访问URL
     */
    @PostMapping("/upload")
    public Result<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String fileUrl = fileService.uploadFile(file);
            return Result.success(Map.of("url", fileUrl));
        } catch (IOException e) {
            logger.error("文件上传失败", e);
            return Result.error("文件上传失败");
        }
    }

    /**
     * 上传图片
     * 
     * @param file 上传的图片文件
     * @return 图片访问URL
     */
    @PostMapping("/upload-image")
    public Result<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = fileService.uploadImage(file);
            return Result.success(Map.of("url", imageUrl));
        } catch (IOException e) {
            logger.error("图片上传失败", e);
            return Result.error("图片上传失败");
        }
    }

    /**
     * 删除文件
     * 
     * @param fileUrl 文件URL
     * @return 删除结果
     */
    @DeleteMapping
    public Result<?> deleteFile(@RequestParam String fileUrl) {
        boolean deleted = fileService.deleteFile(fileUrl);
        if (deleted) {
            return Result.success();
        } else {
            return Result.error("文件删除失败");
        }
    }

    /**
     * 检查文件是否存在
     * 
     * @param fileUrl 文件URL
     * @return 是否存在
     */
    @GetMapping("/exists")
    public Result<?> fileExists(@RequestParam String fileUrl) {
        boolean exists = fileService.fileExists(fileUrl);
        return Result.success(Map.of("exists", exists));
    }

    /**
     * 获取文件信息
     * 
     * @param fileUrl 文件URL
     * @return 文件信息
     */
    @GetMapping("/info")
    public Result<?> getFileInfo(@RequestParam String fileUrl) {
        boolean exists = fileService.fileExists(fileUrl);
        if (!exists) {
            return Result.notFound();
        }

        long size = fileService.getFileSize(fileUrl);
        return Result.success(Map.of(
                "url", fileUrl,
                "exists", true,
                "size", size
        ));
    }
}