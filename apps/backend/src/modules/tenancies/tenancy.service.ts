import { db } from '../../lib/db';
import { TenancyStatus, TenancyType, UserRole } from '@prisma/client';

export class TenancyService {
  async createTenancy(data: {
    landlordId: string;
    tenantPhone: string;
    propertyId: string;
    unitIdentifier: string;
    tenancyType: TenancyType;
    monthlyRentPaise: number;
    securityDepositPaise?: number;
    moveInDate: Date;
  }) {
    // 1. Ensure tenant user exists, or create one
    let tenant = await db.user.findUnique({ where: { phone: data.tenantPhone } });
    if (!tenant) {
      tenant = await db.user.create({
        data: {
          phone: data.tenantPhone,
          role: UserRole.tenant,
        },
      });
    }

    // 2. Create the tenancy
    const tenancy = await db.tenancy.create({
      data: {
        tenantId: tenant.id,
        landlordId: data.landlordId,
        propertyId: data.propertyId,
        unitIdentifier: data.unitIdentifier,
        tenancyType: data.tenancyType,
        monthlyRentPaise: BigInt(data.monthlyRentPaise),
        securityDepositPaise: data.securityDepositPaise ? BigInt(data.securityDepositPaise) : null,
        moveInDate: data.moveInDate,
        status: TenancyStatus.active,
      },
      include: {
        tenant: true,
        property: true,
      },
    });

    return tenancy;
  }

  async getLandlordTenancies(landlordId: string) {
    return db.tenancy.findMany({
      where: { landlordId },
      include: {
        tenant: true,
        property: true,
      },
    });
  }

  async getTenancyById(id: string) {
    return db.tenancy.findUnique({
      where: { id },
      include: {
        tenant: true,
        property: true,
        rentPayments: true,
        agreement: true,
      },
    });
  }

  async getPropertyTenancies(propertyId: string) {
    return db.tenancy.findMany({
      where: { propertyId },
      include: {
        tenant: true,
      },
    });
  }
}
