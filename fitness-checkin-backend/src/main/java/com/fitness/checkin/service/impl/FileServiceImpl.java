package com.fitness.checkin.service.impl;

import com.fitness.checkin.common.BusinessException;
import com.fitness.checkin.service.FileService;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.RandomStringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 文件服务实现类
 * 实现文件上传和访问相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
@Service
public class FileServiceImpl implements FileService {

    private static final Logger logger = LoggerFactory.getLogger(FileServiceImpl.class);

    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = new HashSet<>(
            Arrays.asList("jpg", "jpeg", "png", "gif", "bmp", "webp")
    );

    private static final Set<String> ALLOWED_FILE_EXTENSIONS = new HashSet<>(
            Arrays.asList("jpg", "jpeg", "png", "gif", "bmp", "webp", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx")
    );

    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    @Value("${fitness.upload.path}")
    private String uploadPath;

    @Value("${fitness.upload.url-prefix}")
    private String urlPrefix;

    @Override
    public String uploadFile(MultipartFile file) throws IOException {
        // 验证文件
        validateFile(file, ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE);

        // 生成文件名
        String fileName = generateFileName(file.getOriginalFilename());
        
        // 创建目录结构
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        Path uploadDir = Paths.get(uploadPath, datePath);
        Files.createDirectories(uploadDir);

        // 保存文件
        Path filePath = uploadDir.resolve(fileName);
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
        }

        // 返回访问URL
        String relativePath = datePath + "/" + fileName;
        String fileUrl = urlPrefix + relativePath;
        
        logger.info("文件上传成功: {}", fileUrl);
        return fileUrl;
    }

    @Override
    public String uploadImage(MultipartFile file) throws IOException {
        // 验证图片
        validateFile(file, ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE);

        // 生成文件名
        String fileName = generateFileName(file.getOriginalFilename());
        
        // 创建目录结构
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        Path uploadDir = Paths.get(uploadPath, datePath);
        Files.createDirectories(uploadDir);

        // 保存文件
        Path filePath = uploadDir.resolve(fileName);
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
        }

        // 返回访问URL
        String relativePath = datePath + "/" + fileName;
        String fileUrl = urlPrefix + relativePath;
        
        logger.info("图片上传成功: {}", fileUrl);
        return fileUrl;
    }

    @Override
    public boolean deleteFile(String fileUrl) {
        try {
            // 从URL中提取相对路径
            String relativePath = fileUrl.replace(urlPrefix, "");
            Path filePath = Paths.get(uploadPath, relativePath);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                logger.info("文件删除成功: {}", fileUrl);
                return true;
            }
            return false;
        } catch (IOException e) {
            logger.error("文件删除失败: {}", fileUrl, e);
            return false;
        }
    }

    @Override
    public boolean fileExists(String fileUrl) {
        try {
            String relativePath = fileUrl.replace(urlPrefix, "");
            Path filePath = Paths.get(uploadPath, relativePath);
            return Files.exists(filePath);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public long getFileSize(String fileUrl) {
        try {
            String relativePath = fileUrl.replace(urlPrefix, "");
            Path filePath = Paths.get(uploadPath, relativePath);
            if (Files.exists(filePath)) {
                return Files.size(filePath);
            }
            return 0;
        } catch (IOException e) {
            logger.error("获取文件大小失败: {}", fileUrl, e);
            return 0;
        }
    }

    /**
     * 验证文件
     * 
     * @param file           上传的文件
     * @param allowedExtensions 允许的扩展名
     * @param maxSize        最大文件大小
     */
    private void validateFile(MultipartFile file, Set<String> allowedExtensions, long maxSize) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("文件不能为空");
        }

        // 检查文件大小
        if (file.getSize() > maxSize) {
            throw BusinessException.badRequest("文件大小超过限制");
        }

        // 检查文件扩展名
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw BusinessException.badRequest("文件名不能为空");
        }

        String extension = FilenameUtils.getExtension(originalFilename).toLowerCase();
        if (!allowedExtensions.contains(extension)) {
            throw BusinessException.badRequest("不支持的文件类型");
        }
    }

    /**
     * 生成唯一文件名
     * 
     * @param originalFilename 原始文件名
     * @return 新文件名
     */
    private String generateFileName(String originalFilename) {
        String extension = FilenameUtils.getExtension(originalFilename);
        String randomStr = RandomStringUtils.randomAlphanumeric(16);
        String timestamp = String.valueOf(System.currentTimeMillis());
        return timestamp + "_" + randomStr + "." + extension;
    }
}