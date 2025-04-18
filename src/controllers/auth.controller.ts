import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.service';
import { LoginRequestBody, UserRegisterRequestBody, EmployeeRegisterRequestBody } from '../types/auth';
import {ErrorCodes, throwError} from "../utils/errors";
import {UserDeviceService} from "../services/user-device.service";

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

    loginUser = async (req: Request, res: Response, next: NextFunction) => {
        const { username, password, rememberMe, deviceName, deviceId, deviceUuid } = req.body; // Thay email thành username, bỏ fcmToken
        const ipAddress = req.ip;
        try {
            const tokens = await this.authService.loginUser({ username, password, rememberMe, deviceName, deviceId, deviceUuid, ipAddress });
            res.json(tokens);
        } catch (error) {
            next(error);
        }
    };

    // Logout single device
    logoutUser = async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.userId;
        const userDeviceId = parseInt(req.body.userDeviceId, 10);
        const ipAddress = req.ip;

        if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
        if (!userDeviceId || isNaN(userDeviceId)) {
            throwError(ErrorCodes.BAD_REQUEST, 'Valid UserDeviceID is required');
        }

        await this.userDeviceService.logoutDevice(userDeviceId, userId, ipAddress);
        res.status(204).send();
    };

    // Logout multiple devices
    logoutMultipleDevices = async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.userId;
        const { userDeviceIds } = req.body as LogoutMultipleDevicesRequest; // Type the body
        const ipAddress = req.ip;

        if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
        if (!Array.isArray(userDeviceIds) || userDeviceIds.length === 0 || userDeviceIds.some(id => isNaN(parseInt(id.toString())))) {
            throwError(ErrorCodes.BAD_REQUEST, 'Valid array of UserDeviceIDs is required');
        }

        await this.userDeviceService.logoutDevices(userDeviceIds.map(id => parseInt(id.toString())), userId, ipAddress);
        res.status(204).send();
    };

    // Logout all devices
    logoutAllDevices = async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.userId;
        const ipAddress = req.ip;

        if (!userId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');

        await this.userDeviceService.logoutAllDevices(userId, ipAddress);
        res.status(204).send();
    };

    loginEmployee = async (req: Request, res: Response, next: NextFunction) => {
        const { username, password } = req.body;
        try {
            const tokens = await this.authService.loginEmployee({ username, password });
            res.json(tokens);
        } catch (error) {
            next(error);
        }
    };


    refreshEmployeeToken = async (req: Request, res: Response, next: NextFunction) => {
        const { refreshToken } = req.body;
        const accessToken = await this.authService.refreshEmployeeToken(refreshToken);
        res.json({ accessToken });
    };

    refreshToken = async (req: Request, res: Response, next: NextFunction) => {
        const { refreshToken } = req.body as { refreshToken: string };
        if (!refreshToken) throwError(ErrorCodes.BAD_REQUEST, 'Refresh token required');

        const accessToken = await this.authService.refreshToken(refreshToken);
        res.json({ accessToken });
    };

    registerUser = async (req: Request, res: Response, next: NextFunction) => {
        const data = req.body as UserRegisterRequestBody;
        const token = await this.authService.registerUser(data);
        res.status(201).json({ token });
    };


    logoutEmployee = async (req: Request, res: Response, next: NextFunction) => {
        const employeeId = req.user?.employeeId;
        if (!employeeId) throwError(ErrorCodes.UNAUTHORIZED, 'Employee not authenticated');

        await this.authService.logoutEmployee(employeeId);
        res.status(204).send();
    };

    updateDeviceToken = async (req: Request, res: Response, next: NextFunction) => {
        const { deviceToken } = req.body;
        const accountId = req.user?.userId || req.user?.employeeId;
        if (!accountId) throwError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
        if (!deviceToken) throwError(ErrorCodes.BAD_REQUEST, 'Device token is required');

        try {
            const result = await this.authService.updateDeviceToken(accountId, deviceToken);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            next(error);
        }
    };
}

export default AuthController;