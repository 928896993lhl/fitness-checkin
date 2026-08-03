/// <reference types="@tarojs/taro" />

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.styl';

declare namespace NodeJS {
  interface ProcessEnv {
    /** NODE 内置环境变量, 会影响到最终构建生成产物 */
    NODE_ENV: 'development' | 'production',
    /** 当前构建的平台 */
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'qq' | 'jd' | 'harmony-hybrid',
  }
}

// 微信小程序云开发类型声明
declare namespace WechatMiniprogram {
  namespace Cloud {
    interface CallFunctionResult {
      result: any;
      errMsg: string;
    }
  }
}

// Taro 全局类型扩展
declare module '@tarojs/taro' {
  interface TaroStatic {
    cloud: {
      init: (config: { env: string; traceUser?: boolean }) => void;
      callFunction: (config: { name: string; data?: any }) => Promise<WechatMiniprogram.Cloud.CallFunctionResult>;
      database: () => any;
      uploadFile: (config: { cloudPath: string; filePath: string }) => Promise<any>;
      getTempFileURL: (config: { fileList: string[] }) => Promise<any>;
    };
  }
}
