import { PrismaClient } from '@prisma/client';
import { ErrorCodes, throwError } from '../utils/errors';
import {Space} from "../types/space";
import prisma from "../config/database";

class SpaceService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma
    }

    async createSpace(input: {
        houseId: number;
        space_name: string;
        icon_name?: string;
        icon_color?: string;
        space_description?: string;
    }): Promise<Space> {
        const { houseId, space_name, icon_name, icon_color, space_description } = input;

        // Check if house exists
        const house = await this.prisma.houses.findFirst({
            where: { house_id: houseId, is_deleted: false }
        });

        if (!house) {
            throwError(ErrorCodes.NOT_FOUND, 'House not found');
        }

        const now = new Date();

        const space = await this.prisma.spaces.create({
            data: {
                house_id: houseId,
                space_name,
                icon_name,
                icon_color,
                space_description,
                created_at: now,
                updated_at: now
            },
        });

        return {
            ...space,
            house_id: space.house_id,
            space_name: space.space_name,
            icon_name: space.icon_name || null,
            icon_color: space.icon_color || null,
            space_description: space.space_description || null,
            created_at: space.created_at || null,
            updated_at: space.updated_at || null,
            is_deleted: space.is_deleted || null,
        };
    }

    async getSpacesByHouse(houseId: number): Promise<Space[]> {
        const spaces = await this.prisma.spaces.findMany({
            where: { house_id: houseId, is_deleted: false },
        });

        return spaces.map((space) => ({
            ...space,
            house_id: space!.house_id || null,
            space_name: space!.space_name,
            icon_name: space!.icon_name || null,
            icon_color: space!.icon_color || null,
            space_description: space!.space_description || null,
            created_at: space!.created_at || null,
            updated_at: space!.updated_at || null,
            is_deleted: space!.is_deleted || null,
        }));
    }

    async getSpaceById(spaceId: number): Promise<Space> {
        const space = await this.prisma.spaces.findFirst({
            where: { space_id: spaceId, is_deleted: false },
        });
       if (!space) throwError(ErrorCodes.NOT_FOUND, 'Space not found');

            return {
                ...space,
                space_id: space!.space_id,
                house_id: space!.house_id || null,
                space_name: space!.space_name,
                icon_name: space!.icon_name || null,
                icon_color: space!.icon_color || null,
                space_description: space!.space_description || null,
                created_at: space!.created_at || null,
                updated_at: space!.updated_at || null,
                is_deleted: space!.is_deleted || null,
            };
    }

    async updateSpace(spaceId: number, input: {
        space_name: string;
        icon_name?: string;
        icon_color?: string;
        space_description?: string;
    }): Promise<Space> {
        const space = await this.prisma.spaces.update({
            where: { space_id: spaceId },
            data: {
                ...input,
                updated_at: new Date()
            },
        });

        return {
            ...space,
            house_id: space!.house_id || null,
            space_name: space!.space_name,
            icon_name: space!.icon_name || null,
            icon_color: space!.icon_color || null,
            space_description: space!.space_description || null,
            created_at: space!.created_at || null,
            updated_at: space!.updated_at || null,
            is_deleted: space!.is_deleted || null,
        };
    }

    async deleteSpace(spaceId: number): Promise<void> {
        await this.prisma.spaces.update({
            where: { space_id: spaceId },
            data: { is_deleted: true, updated_at: new Date() },
        });
    }

    async getSpaceName(spaceId: number): Promise<string> {
        const space = await this.prisma.spaces.findFirst({
            where: { space_id: spaceId, is_deleted: false },
            select: { space_name: true },
        });
        if (!space) throwError(ErrorCodes.NOT_FOUND, 'Space not found');
        return space!.space_name;
    }
}

export default SpaceService;