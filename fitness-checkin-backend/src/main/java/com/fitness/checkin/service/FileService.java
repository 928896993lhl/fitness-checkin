package com.fitness.checkin.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * 文件服务接口
 * 提供文件上传和访问相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
public interface FileService {

    /**
     * 上传文件
     * 
     * @param file 上传的文件
     * @return 文件访问URL
     * @throws IOException IO异常
     */
    String uploadFile(MultipartFile file) throws IOException;

    /**
     * 上传图片
     * 
     * @param file 上传的图片文件
     * @return 图片访问URL
     * @throws IOException IO异常
     */
    String uploadImage(MultipartFile file) throws IOException;

    /**
     * 删除文件
     * 
     * @param fileUrl 文件URL
     * @return 是否删除成功
     */
    boolean deleteFile(String fileUrl);

    /**
     * 检查文件是否存在
     * 
     * @param fileUrl 文件URL
     * @return 是否存在
     */
    boolean fileExists(String fileUrl);

    /**
     * 获取文件大小
     * 
     * @param fileUrl 文件URL
     * @return 文件大小（字节）
     */
    long getFileSize(String fileUrl);
}