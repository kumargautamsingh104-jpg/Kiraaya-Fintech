import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PropertyService } from './property.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { City } from '@prisma/client';

const propertyService = new PropertyService();

const createPropertySchema = z.object({
  name: z.string().min(3),
  address: z.string().min(10),
  city: z.nativeEnum(City),
  state: z.string(),
  totalUnits: z.number().int().positive(),
});

export class PropertyController {
  static async createProperty(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const body = createPropertySchema.safeParse(await req.json());
      if (!body.success) return NextResponse.json({ success: false, error: body.error.errors }, { status: 400 });

      const result = await propertyService.createProperty(authed.userId, body.data);
      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  static async listProperties(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const result = await propertyService.getLandlordProperties(authed.userId);
      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }
}
