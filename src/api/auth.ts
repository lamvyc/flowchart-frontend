import service from './request';

// 根据你的后端简报，定义 User 和 Token 的类型
export interface User {
  id: number;
  username: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

/**
 * 用户注册 API
 * @param data {username, password}
 */
export function register(data: unknown): Promise<User> {
  return service({
    url: '/auth/register',
    method: 'post',
    data,
  });
}

/**
 * 用户登录 API
 * @param data FormData 格式，包含 'username' 和 'password'
 */
export function login(data: FormData): Promise<LoginResponse> {
  return service({
    url: '/auth/login',
    method: 'post',
    data,
    // 重点：FastAPI 的 OAuth2PasswordRequestForm 需要 'x-www-form-urlencoded' 格式
    // 使用 FormData 会让 axios 自动设置这个 Content-Type
  });
}

/**
 * 获取当前用户信息 API
 */
export function getMe(): Promise<User> {
  return service({
    url: '/users/me',
    method: 'get',
  });
}
