package com.fitness.checkin.security;

import com.fitness.checkin.service.UserService;
import com.fitness.checkin.util.JwtUtil;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

/**
 * JWT认证提供者
 * 处理JWT令牌的验证和认证
 * 
 * @author Kou
 * @version 1.0.0
 */
@Component
public class JwtAuthenticationProvider implements AuthenticationProvider {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationProvider(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String token = (String) authentication.getCredentials();
        
        if (token == null || token.isEmpty()) {
            return null;
        }

        // 验证令牌
        if (!jwtUtil.validateToken(token)) {
            return null;
        }

        // 从令牌中获取用户名
        String username = jwtUtil.getUsernameFromToken(token);
        
        // 加载用户详情
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        
        // 创建认证令牌
        return new UsernamePasswordAuthenticationToken(
            userDetails, 
            token, 
            userDetails.getAuthorities()
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}