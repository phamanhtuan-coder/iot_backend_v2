import { Request, Response, NextFunction } from 'express';
import { ProductionTrackingService } from '../services/production-tracking.service';
import { ErrorCodes, throwError } from '../utils/errors';
import { ProductionTrackingApproveInput, ProductionTrackingApproveTestedInput, ProductionTrackingCancelInput, ProductionTrackingNextStageInput, ProductionTrackingRejectForQCInput, ProductionTrackingResponsePhaseChangeInput, ProductionTrackingSerialUpdateInput } from '../types/production-tracking';

export class ProductionTrackingController {
    private productionTrackingService: ProductionTrackingService;

    constructor() {
        this.productionTrackingService = new ProductionTrackingService();
    }

    ApproveProductionSerial = async (req: Request, res: Response, next: NextFunction) => {
        const result = await this.productionTrackingService.ApproveProductionSerial(req.body as ProductionTrackingApproveInput, req.body.employeeId);

        res.status(200).json(result);
    }

    getProductionTrackingByProductionBatchId = async(req: Request, res: Response, next: NextFunction) => {
        const result = await this.productionTrackingService.getProductionTrackingByProductionBatchId(req.params.production_batch_id);

        res.status(200).json(result);
    }

    RejectProductionSerial = async(req: Request, res: Response, next: NextFunction) => {
        const result = await this.productionTrackingService.RejectProductionSerial(req.body as ProductionTrackingRejectForQCInput, req.body.employeeId);

        res.status(200).json(result);
    }

    UpdateProductionSerial = async (req: Request, res: Response, next: NextFunction) => {
        console.log('update production serial', req.body);
        const result = await this.productionTrackingService.UpdateProductionSerial(req.body as ProductionTrackingSerialUpdateInput, req.body.employeeId);

        res.status(200).json(result);
    }   

    CancelProductionSerial = async (req: Request, res: Response, next: NextFunction) => {
        const result = await this.productionTrackingService.CancelProductionSerial(req.body as ProductionTrackingCancelInput, req.body.employeeId);

        res.status(200).json(result);
    }

    ApproveTestedSerial = async (req: Request, res: Response, next: NextFunction) => {
        const result = await this.productionTrackingService.ApproveTestedSerial(req.body as ProductionTrackingApproveTestedInput, req.body.employeeId);
        console.log('approve tested serial', result);
        res.status(200).json(result);
    }

    getSerialWithNeedFirmwareInProgress = async (req: Request, res: Response, next: NextFunction) => {
        const { type, planning_id, batch_id } = req.params;

        const result = await this.productionTrackingService.getSerialWithNeedFirmwareInProgress(type, planning_id, batch_id);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    }
}