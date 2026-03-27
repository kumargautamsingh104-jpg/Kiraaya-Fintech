import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TenancyService } from './tenancy.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { TenancyType } from '@prisma/client';

const tenancyService = new TenancyService();

const createTenancySchema = z.object({
  tenantPhone: z.string().min(10).max(13),
  propertyId: z.string().uuid(),
  unitIdentifier: z.string(),
  tenancyType: z.nativeEnum(TenancyType),
  monthlyRentPaise: z.number().int().positive(),
  securityDepositPaise: z.number().int().optional(),
  moveInDate: z.string().datetime(),
});

export class TenancyController {
  static async createTenancy(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const body = createTenancySchema.safeParse(await req.json());
      if (!body.success) return NextResponse.json({ success: false, error: body.error.errors }, { status: 400 });

      const result = await tenancyService.createTenancy({
        ...body.data,
        landlordId: authed.userId,
        moveInDate: new Date(body.data.moveInDate),
      });

      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  static async listTenancies(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const result = await tenancyService.getLandlordTenancies(authed.userId);
      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  static async getTenancy(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

      const result = await tenancyService.getTenancyById(id);
      if (!result) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      
      // Access check
      if (result.landlordId !== authed.userId && result.tenantId !== authed.userId) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }
}
