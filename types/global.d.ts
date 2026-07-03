/// <reference types="@tarojs/taro" />

declare namespace Taro {
  interface AppConfig {
    pages: string[];
    window?: Record<string, unknown>;
  }
  interface PageConfig {
    navigationBarTitleText?: string;
  }
}

declare module '*.scss';
declare module '*.json' {
  const value: unknown;
  export default value;
}

declare const process: {
  env: {
    NODE_ENV: string;
    TARO_ENV: 'h5' | 'weapp' | 'swan' | 'alipay' | 'tt' | 'qq' | 'jd' | 'harmony' | 'rn';
  };
};
