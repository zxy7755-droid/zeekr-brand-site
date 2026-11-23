import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import type { Vehicle } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { RESOURCE_ROUTES } from '../contract';
import { VehiclesService } from './vehicles.service';

const STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

interface ErrorBody {
  status: number;
  title: string;
  detail: string;
  traceId: string;
}

interface VehicleDto {
  id: string;
  slug: string;
  name: string;
  series: string;
  tagline: string | null;
  priceMin: number | null;
  priceMax: number | null;
  rangeKm: number | null;
  batteryKwh: number | null;
  zeroToHundred: number | null;
  seats: number | null;
  driveType: string | null;
  imageKey: string | null;
  badge: string | null;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface VehicleHighlight {
  label: string;
  value: string;
}

interface VehicleDetailDto extends VehicleDto {
  highlights: VehicleHighlight[];
  galleryKeys: string[];
}

@Controller(RESOURCE_ROUTES.vehicles)
export class VehiclesController {
  private readonly logger = new Logger(VehiclesController.name);

  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  async list(
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
    @Query('series') series?: string,
    @Query('status') statusRaw?: string,
  ): Promise<{ items: VehicleDto[]; total: number; page: number; pageSize: number }> {
    const startedAt = Date.now();
    let outcome: 'success' | 'error' = 'error';
    try {
      const page = this.parseIntParam(pageRaw, 'page', 1, 1);
      const pageSize = this.parseIntParam(pageSizeRaw, 'pageSize', 20, 1, 100);

      if (statusRaw !== undefined && !STATUS_VALUES.includes(statusRaw as (typeof STATUS_VALUES)[number])) {
        throw new BadRequestException(
          this.errorBody(400, 'Bad Request', `status 取值无效：${statusRaw}`),
        );
      }

      const result = await this.vehicles.list({ page, pageSize, series, status: statusRaw });

      const response = {
        items: result.items.map((v) => this.toVehicleDto(v)),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      };
      outcome = 'success';
      return response;
    } finally {
      this.logRequest(startedAt, outcome);
    }
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string): Promise<VehicleDetailDto> {
    const vehicle = await this.vehicles.getBySlug(slug);
    if (!vehicle) {
      throw new NotFoundException(this.errorBody(404, 'Not Found', `车型不存在: ${slug}`));
    }
    return this.toVehicleDetailDto(vehicle);
  }

  private parseIntParam(
    raw: string | undefined,
    name: string,
    fallback: number,
    min: number,
    max: number = Number.MAX_SAFE_INTEGER,
  ): number {
    if (raw === undefined) {
      return fallback;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < min || n > max) {
      throw new BadRequestException(this.errorBody(400, 'Bad Request', `${name} 取值无效：${raw}`));
    }
    return n;
  }

  private errorBody(status: number, title: string, detail: string): ErrorBody {
    return { status, title, detail, traceId: randomUUID() };
  }

  /**
   * GET /vehicles 的结构化请求日志：每次调用恰好一条，只输出四个字段，
   * 不含 query / 请求头 / Cookie / 手机号等噪声或 PII。日志自身异常不得影响主响应。
   */
  private logRequest(startedAt: number, result: 'success' | 'error'): void {
    try {
      this.logger.log(
        JSON.stringify({
          method: 'GET',
          path: `/${RESOURCE_ROUTES.vehicles}`,
          durationMs: Math.max(0, Date.now() - startedAt),
          result,
        }),
      );
    } catch {
      // 日志失败不得影响主响应
    }
  }

  private toVehicleDto(v: Vehicle): VehicleDto {
    return {
      id: v.id,
      slug: v.slug,
      name: v.name,
      series: v.series,
      tagline: v.tagline,
      priceMin: v.priceMin,
      priceMax: v.priceMax,
      rangeKm: v.rangeKm,
      batteryKwh: v.batteryKwh,
      zeroToHundred: v.zeroToHundred,
      seats: v.seats,
      driveType: v.driveType,
      imageKey: v.imageKey,
      badge: v.badge,
      sortOrder: v.sortOrder,
      status: v.status,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    };
  }

  /** highlights/galleryKeys 为 VehicleDetail 的可选展示字段，仅由已持久字段衍生，不新增持久化字段。 */
  private toVehicleDetailDto(v: Vehicle): VehicleDetailDto {
    const highlights: VehicleHighlight[] = [];
    if (v.rangeKm != null) {
      highlights.push({ label: '续航', value: `${v.rangeKm} km` });
    }
    if (v.batteryKwh != null) {
      highlights.push({ label: '电池容量', value: `${v.batteryKwh} kWh` });
    }
    if (v.badge) {
      highlights.push({ label: '标签', value: v.badge });
    }

    return {
      ...this.toVehicleDto(v),
      highlights,
      galleryKeys: v.imageKey ? [v.imageKey] : [],
    };
  }
}
