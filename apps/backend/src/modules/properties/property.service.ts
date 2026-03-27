import { db } from '../../lib/db';
import { City } from '@prisma/client';
import { encrypt } from '@kiraaya/security';

export class PropertyService {
  async createProperty(landlordId: string, data: {
    name: string;
    address: string;
    city: City;
    state: string;
    totalUnits: number;
  }) {
    return db.property.create({
      data: {
        landlordId,
        name: data.name,
        addressEncrypted: encrypt(data.address),
        city: data.city,
        state: data.state,
        totalUnits: data.totalUnits,
      },
    });
  }

  async getLandlordProperties(landlordId: string) {
    return db.property.findMany({
      where: { landlordId },
      include: {
        _count: {
          select: { tenancies: true },
        },
      },
    });
  }
}
