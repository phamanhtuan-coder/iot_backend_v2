import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.service';
import { LoginRequestBody, UserRegisterRequestBody, EmployeeRegisterRequestBody } from '../types/auth';
import {ErrorCodes, throwError} from "../utils/errors";
import {UserDeviceService} from "../services/user-device.service";
import NotificationService from "../services/notification.service";


// Define interface for logout multiple devices request body
interface LogoutMultipleDevicesRequest {
    userDeviceIds: number[] | string[]; // Can accept strings or numbers from client
}

class AuthController {
    private authService: AuthService;
    private userDeviceService: UserDeviceService;


    constructor() {
        this.authService = new AuthService();
        this.userDeviceService = new UserDeviceService();
    }

    /**
     * Đăng nhập tài khoản người dùng
     * @param req Request Express với thông tin đăng nhập trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    loginUser = async (req: Request, res: Response, next: NextFunction) => {
        const { username, password, rememberMe, deviceName, deviceId, deviceUuid } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.headers['user-agent'];

        try {
            // Thực hiện login
            const result = await this.authService.loginUser({
                username,
                password,
                rememberMe,
                deviceName,
                deviceId,
                deviceUuid,
                ipAddress
            });

            // Ensure userId exists before proceeding
            if (!result.userId) {
                throwError(ErrorCodes.UNAUTHORIZED, 'User ID not found in login result');
            }

            // Lấy thông tin thiết bị
            const devices = await this.userDeviceService.getUserDevices(result!.userId!);
            const currentDevice = devices.find(d => d.device_id === deviceId);

            // Tính toán thông tin response
            const maxDevices = 5;
            const response = {
                ...result,
                deviceInfo: {
                    current: currentDevice ? {
                        deviceId: currentDevice.device_id,
                        deviceName: currentDevice.device_name,
                        lastLogin: currentDevice.last_login,
                        ipAddress,
                        userAgent
                    } : null,
                    total: {
                        active: devices.length,
                        limit: maxDevices,
                        remaining: maxDevices - devices.length
                    }
                },
                devices: devices.map(device => ({
                    deviceId: device.device_id,
                    deviceName: device.device_name,
                    lastLogin: device.last_login,
                    isCurrentDevice: device.device_id === deviceId
                }))
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Đăng xuất khỏi một thiết bị
     * @param req Request Express với ID thiết bị trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    logoutUser = async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.userId;
        const userDeviceId = req.body.userDeviceId;
        const ipAddress = req.ip;

        if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
        if (!userDeviceId || !isNaN(userDeviceId)) {
            throwError(ErrorCodes.BAD_REQUEST, 'Valid UserDeviceID is required');
        }

        await this.userDeviceService.logoutDevice(userDeviceId, userId, ipAddress);

        // Lấy danh sách thiết bị còn lại sau khi logout
        const remainingDevices = await this.userDeviceService.getUserDevices(userId);

        // Trả về thông tin chi tiết sau khi logout
        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
            remainingDevices: {
                total: remainingDevices.length,
                active: remainingDevices.filter(d => !d.last_out || d.last_login > d.last_out).length,
                devices: remainingDevices.map(device => ({
                    deviceId: device.device_id,
                    deviceName: device.device_name,
                    lastLogin: device.last_login,
                    lastLogout: device.last_out,
                    status: !device.last_out || device.last_login > device.last_out ? 'active' : 'inactive'
                }))
            }
        });
    };

    /**
     * Đăng xuất khỏi nhiều thiết bị
     * @param req Request Express với danh sách ID thiết bị trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    logoutMultipleDevices = async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.userId;
        const { userDeviceIds } = req.body as LogoutMultipleDevicesRequest;
        const ipAddress = req.ip;

        if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
        if (!Array.isArray(userDeviceIds) || userDeviceIds.length === 0) {
            throwError(ErrorCodes.BAD_REQUEST, 'Valid array of UserDeviceIDs is required');
        }

        await this.userDeviceService.logoutDevices(userDeviceIds.map(id => id.toString()), userId, ipAddress);

        // Lấy danh sách thiết bị còn lại sau khi logout
        const remainingDevices = await this.userDeviceService.getUserDevices(userId);

        // Trả về thông tin chi tiết sau khi logout
        res.status(200).json({
            success: true,
            message: `Logged out from ${userDeviceIds.length} devices`,
            loggedOutDevices: userDeviceIds.length,
            remainingDevices: {
                total: remainingDevices.length,
                active: remainingDevices.filter(d => !d.last_out || d.last_login > d.last_out).length,
                devices: remainingDevices.map(device => ({
                    deviceId: device.device_id,
                    deviceName: device.device_name,
                    lastLogin: device.last_login,
                    lastLogout: device.last_out,
                    status: !device.last_out || device.last_login > device.last_out ? 'active' : 'inactive'
                }))
            }
        });
    };

    /**
     * Đăng xuất khỏi tất cả thiết bị
     * @param req Request Express
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    logoutAllDevices = async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.userId;
        const ipAddress = req.ip;

        if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');

        const result = await this.userDeviceService.logoutAllDevices(userId, ipAddress);

        const notificationService = new NotificationService();
        await notificationService.sendFCMNotificationToUser(
            userId,
            'Đăng xuất',
            'Bạn đã bị đăng xuất khỏi tất cả thiết bị',
            { type: 'FORCE_LOGOUT' }
        );
    
        res.status(204).send(result);
    };

    /**
     * Đăng nhập tài khoản nhân viên
     * @param req Request Express với thông tin đăng nhập trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    loginEmployee = async (req: Request, res: Response, next: NextFunction) => {
        const { username, password } = req.body;
        try {
            const result = await this.authService.loginEmployee({
                username,
                password
            },
                // req.ip || 'unknown', req.headers['user-agent'] || 'unknown'
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Làm mới token truy cập cho nhân viên
     * @param req Request Express với token làm mới trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    refreshEmployeeToken = async (req: Request, res: Response, next: NextFunction) => {
        const { refreshToken } = req.body;
        const accessToken = await this.authService.refreshEmployeeToken(refreshToken);
        res.json({ accessToken });
    };

    /**
     * Làm mới token truy cập
     * @param req Request Express với token làm mới trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    refreshToken = async (req: Request, res: Response, next: NextFunction) => {
        const { refreshToken } = req.body as { refreshToken: string };
        if (!refreshToken) throwError(ErrorCodes.BAD_REQUEST, 'Refresh token required');

        const accessToken = await this.authService.refreshToken(refreshToken);
        res.json({ accessToken });
    };

    /**
     * Đăng ký tài khoản người dùng mới
     * @param req Request Express với thông tin đăng ký trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    registerUser = async (req: Request, res: Response, next: NextFunction) => {
        const data = req.body as UserRegisterRequestBody;
        const token = await this.authService.registerUser(data);
        res.status(201).json(token );
    };

    /**
     * Đăng ký tài khoản nhân viên mới
     * @param req Request Express với thông tin đăng ký trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    registerEmployee = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const adminId = req.user?.userId || req.user?.employeeId;
            if (!adminId) throwError(ErrorCodes.UNAUTHORIZED, 'Admin not authenticated');

            const data = req.body as EmployeeRegisterRequestBody;
            const result = await this.authService.registerEmployee(data, adminId);
            res.status(201).json( result );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Đăng xuất tài khoản nhân viên
     * @param req Request Express
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    logoutEmployee = async (req: Request, res: Response, next: NextFunction) => {
        const employeeId = req.user?.employeeId;
        if (!employeeId) throwError(ErrorCodes.UNAUTHORIZED, 'Employee not authenticated');

        await this.authService.logoutEmployee(employeeId);
        res.status(204).send();
    };

    /**
     * Cập nhật token thiết bị
     * @param req Request Express với token thiết bị trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    /**
     * Cập nhật token thiết bị
     * @param req Request Express với token thiết bị trong body
     * @param res Response Express
     */
    updateDeviceToken = async (req: Request, res: Response) => {
        try {
            const { deviceToken, userDeviceId } = req.body;
            const accountId = req?.user?.userId || req?.user?.employeeId;

            if (!deviceToken) {
                return res.status(400).json({
                    error: 'Device token is required'
                });
            }

            if (!accountId) {
                return res.status(401).json({
                    error: 'User not authenticated'
                });
            }

            // Call service method instead of direct Prisma queries
            const result = await this.authService.updateDeviceToken(accountId, deviceToken, userDeviceId);

            if (result.success) {
                return res.json({
                    message: result.message,
                    deviceId: result.deviceId,
                    note: 'Push notifications are now enabled for this device'
                });
            } else {
                return res.status(404).json({
                    error: result.message
                });
            }
        } catch (error: any) {
            console.error('Update FCM token error:', error);
            res.status(500).json({
                error: error.message || 'Failed to update FCM token'
            });
        }
    }


    async testFCMStatus(req: Request, res: Response) {
        try {
            const accountId = req?.user?.account_id;
            const notificationService = new NotificationService();

            const fcmAvailable = await notificationService.testFCMConnection();
            const userTokens = await notificationService.getUserFCMTokens(accountId);

            res.json({
                fcm_service_available: fcmAvailable,
                user_devices_with_tokens: userTokens.length,
                devices: userTokens.map(d => ({
                    device_name: d.device_name,
                    has_valid_token: !!d.device_token,
                    last_login: d.last_login
                }))
            });
        } catch (error: any) {
            res.status(500).json({
                error: 'Failed to check FCM status',
                details: error.message
            });
        }
    }

    /**
     * Kiểm tra trạng thái xác thực email
     * @param req Request Express với email trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    checkEmailVerification = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            const result = await this.authService.checkEmailVerification(email);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Xác thực email người dùng
     * @param req Request Express với email trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            const result = await this.authService.verifyEmail(email);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Cập nhật thông tin người dùng
     * @param req Request Express với thông tin cập nhật trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    updateUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;
            if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');

            console.log('Request body size:', JSON.stringify(req.body).length);
            if (req.body.image) {
                console.log('Base64 image size:', req.body.image.length);
            }

            const result = await this.authService.updateUser(userId, req.body);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Khôi phục mật khẩu
     * @param req Request Express với email và mật khẩu mới trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    recoveryPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, newPassword } = req.body;
            const result = await this.authService.recoveryPassword(email, newPassword);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    changePassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;
            if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');

            const { currentPassword, newPassword } = req.body;
            const result = await this.authService.changePassword(userId, currentPassword, newPassword);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Lấy thông tin khách hàng đăng nhập
     * @param req Request Express với email và mật khẩu mới trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    getMe = async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.userId;
        if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');

        try {
            const result = await this.authService.getMe(userId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getMeEmployee = async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.employeeId || req.user?.userId;
        if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
        const result = await this.authService.getMeEmployee(userId);
        res.json(result);
    };  

    updateProfileEmployee = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.employeeId || req.user?.userId;
            if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');

            const result = await this.authService.updateProfileEmployee(userId, req.body);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    changePasswordEmployee = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.employeeId || req.user?.userId;
            if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');

            const { currentPassword, newPassword, confirmPassword } = req.body;
            const result = await this.authService.changePasswordEmployee(userId, currentPassword, newPassword, confirmPassword);
            res.status(result.status_code).json(result);
        } catch (error) {
            next(error);
        }
    };
}

export default AuthController;
