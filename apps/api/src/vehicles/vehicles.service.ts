import { Injectable } from '@nestjs/common';
import { VehicleStatus, type Vehicle } from '@prisma/client';

import { PrismaService } from '../prisma.service';

export interface VehicleListQuery {
  page?: number;
  pageSize?: number;
  series?: string;
  /** 透传客户端的 status 入参用于校验；实际过滤始终强制为 PUBLISHED（见 FR-9.5）。 */
  status?: string;
}

export interface VehicleListResult {
  items: Vehicle[];
  total: number;
  page: number;
  pageSize: number;
}

/** 对外公开接口只暴露已发布车型：与 status 查询参数取值无关，合规口径见 requirement-compare.md FR-9.5。 */
const PUBLISHED_STATUS = VehicleStatus.PUBLISHED;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: VehicleListQuery): Promise<VehicleListResult> {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    const where = {
      status: PUBLISHED_STATUS,
      ...(query.series ? { series: query.series } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getBySlug(slug: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findFirst({
      where: { slug, status: PUBLISHED_STATUS },
    });
  }
}
