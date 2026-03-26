import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditRepository {
  static async log(actorId: string, action: string, entityType: string, entityId: string, payload: any) {
    // Postgres trigger handles IMMUTABILITY (no delete on events_log)
    return await prisma.eventsLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        payload: JSON.stringify(payload),
      },
    });
  }
}
