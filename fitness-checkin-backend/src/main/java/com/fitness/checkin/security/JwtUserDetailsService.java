package com.fitness.checkin.security;

import com.fitness.checkin.entity.User;
import com.fitness.checkin.service.UserService;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * JWT用户详情服务
 * 实现UserDetailsService接口，用于加载用户信息
 * 
 * @author Kou
 * @version 1.0.0
 */
@Service
public class JwtUserDetailsService implements UserDetailsService {

    private final UserService userService;

    public JwtUserDetailsService(UserService userService) {
        this.userService = userService;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 这里username实际上是用户的openid或userId
        User user = userService.getUserByOpenid(username);
        
        if (user == null) {
            throw new UsernameNotFoundException("用户不存在: " + username);
        }

        // 创建Spring Security用户详情
        return new org.springframework.security.core.userdetails.User(
            user.getOpenid(),
            "",  // 微信登录不需要密码
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}