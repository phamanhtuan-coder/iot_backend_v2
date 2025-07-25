import { Request, Response, NextFunction } from 'express';
import FirmwareService from '../services/firmware.service';
import { ErrorCodes, throwError } from '../utils/errors';

class FirmwareController {
    private firmwareService: FirmwareService;

    constructor() {
        this.firmwareService = new FirmwareService();
    }

    /**
     * Tạo firmware mới
     * @param req Request Express với dữ liệu firmware trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    createFirmware = async (req: Request, res: Response, next: NextFunction) => {
        const employeeId = req.user?.employeeId;
        console.log("nhân viên", employeeId)
        if (!employeeId) throwError(ErrorCodes.UNAUTHORIZED, 'Employee not authenticated');

        try {
            const firmware = await this.firmwareService.createFirmware(req.body, employeeId);
            res.status(201).json(firmware);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Cập nhật thông tin firmware
     * @param req Request Express với ID firmware trong params và dữ liệu cập nhật trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    updateFirmware = async (req: Request, res: Response, next: NextFunction) => {
        const employeeId = req.user?.employeeId;
        if (!employeeId) throwError(ErrorCodes.UNAUTHORIZED, 'Employee not authenticated');

        try {
            const { firmwareId } = req.params;
            const firmware = await this.firmwareService.updateFirmware(firmwareId, req.body, employeeId);
            res.json(firmware);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Xóa firmware
     * @param req Request Express với ID firmware trong params
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    deleteFirmware = async (req: Request, res: Response, next: NextFunction) => {
        const employeeId = req.user?.employeeId;
        if (!employeeId) throwError(ErrorCodes.UNAUTHORIZED, 'Employee not authenticated');

        try {
            const { firmwareId } = req.params;
            const response = await this.firmwareService.deleteFirmware(firmwareId, employeeId);
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Lấy thông tin firmware theo ID
     * @param req Request Express với ID firmware trong params
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    getFirmwareById = async (req: Request, res: Response, next: NextFunction) => {
        const employeeId = req.user?.employeeId;
        if (!employeeId) throwError(ErrorCodes.UNAUTHORIZED, 'Employee not authenticated');

        try {
            const { firmwareId } = req.params;
            const firmware = await this.firmwareService.getFirmwareById(firmwareId);
            res.status(200).json(firmware);
        } catch (error) {
            console.log("err",error)
            next(error);
        }
    };

    /**
     * Lấy danh sách tất cả firmware
     * @param req Request Express
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    getFirmwares = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const firmwares = await this.firmwareService.getFirmwares();
            res.json(firmwares);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Lấy danh sách firmware theo template ID
     * @param req Request Express với template ID trong params
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    getFirmwaresByTemplateId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { templateId } = req.params;
            const firmwares = await this.firmwareService.getFirmwaresByTemplateId(templateId);
            res.json(firmwares);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Xác nhận firmware bởi tester
     * @param req Request Express với ID firmware trong params và kết quả kiểm tra trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    confirmFirmwareByTester = async (req: Request, res: Response, next: NextFunction) => {
        const employeeId = req.user?.employeeId;
        if (!employeeId) throwError(ErrorCodes.UNAUTHORIZED, 'Employee not authenticated');

        try {
            const response = await this.firmwareService.confirmFirmwareByTester(req.body.firmwareId, employeeId, req.body.testResult);
            console.log("response",response)
            res.status(200).json(response);
        } catch (error) {
            console.log("err",error)
            next(error);
        }
    };

    /**
     * Xác nhận firmware bởi RD
     * @param req Request Express với ID firmware trong params và kết quả kiểm tra trong body
     * @param res Response Express
     * @param next Middleware tiếp theo
     */
    confirmFirmwareByRD = async (req: Request, res: Response, next: NextFunction) => {
        const employeeId = req.user?.employeeId;
        if (!employeeId) throwError(ErrorCodes.UNAUTHORIZED, 'Employee not authenticated');

        try {
            const response = await this.firmwareService.confirmFirmwareByRD(req.body.firmwareId, employeeId, req.body.testResult);
            
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    getLatestVersionFirmwaresByTemplate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const latestVersionFirmwares = await this.firmwareService.getLatestVersionFirmwaresByTemplate();
            res.json(latestVersionFirmwares);
        } catch (error) {
            next(error);
        }
    };
}

export default FirmwareController;

