import { PrismaClient, Tenancy } from '@prisma/client';
import { encrypt, decrypt } from '../common/security';

const prisma = new PrismaClient();

export class TenancyRepository {
  async findById(id: string): Promise<Tenancy | null> {
    const tenancy = await prisma.tenancy.findUnique({
      where: { id },
      include: { property: true },
    });
    if (!tenancy) return null;

    return tenancy;
  }

  async findActiveByTenant(tenantId: string): Promise<Tenancy[]> {
    return await prisma.tenancy.findMany({
      where: { tenantId, status: 'active' },
      include: { property: true },
    });
  }

  async create(data: Partial<Tenancy>): Promise<Tenancy> {
    return await prisma.tenancy.create({
      data: data as any,
    });
  }

  async updateStatus(id: string, status: 'active' | 'closed' | 'disputed'): Promise<Tenancy> {
    return await prisma.tenancy.update({
      where: { id },
      data: { status },
    });
  }
}
