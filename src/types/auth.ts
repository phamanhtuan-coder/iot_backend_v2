import { JwtPayload } from 'jsonwebtoken';

export interface RefreshTokenPayload extends JwtPayload {
    userId?: string; // Thay number bằng string để khớp account_id
    employeeId?: string; // Thay number bằng string để khớp account_id
    type: 'refresh';
}

export interface LoginRequestBody {
    username: string;
    password: string;
    rememberMe?: boolean;
}

export interface TokenResponse {
    accessToken: string;
    refreshToken?: string;
    deviceUuid?: string; // Đổi từ 'any' thành 'string', thêm '?' vì không phải lúc nào cũng có
}

export interface UserJwtPayload extends JwtPayload {
    userId: string;
    username: string;
    role: string;
}

export interface EmployeeJwtPayload extends JwtPayload {
    employeeId: string;
    username: string; // Thay email thành username
    role: string;
}
export type AuthJwtPayload = UserJwtPayload | EmployeeJwtPayload;

// Bỏ enum EmployeeRole vì role giờ được lấy từ role_id trong bảng role
// Nếu vẫn muốn dùng enum, cần đồng bộ với dữ liệu trong bảng role
// export type EmployeeRole = 'ADMIN' | 'PRODUCTION' | 'TECHNICIAN' | 'RND' | 'EMPLOYEE';

export type UserRegisterRequestBody = {
    username: string; // Bắt buộc
    surname: string;
    lastname?: string;
    image?: string;
    phone?: string;
    email: string;
    birthdate?: string;
    gender?: boolean;
    password: string;
};

export type EmployeeRegisterRequestBody = {
    username: string; // Bắt buộc
    surname: string;
    lastname?: string;
    image?: string;
    email: string;
    password: string;
    birthdate?: string;
    gender?: boolean;
    phone?: string;
    status?: number;
    role: string;
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthJwtPayload;
        }
    }
}