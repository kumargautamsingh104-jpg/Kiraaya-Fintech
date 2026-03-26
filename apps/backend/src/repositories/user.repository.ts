import { PrismaClient, User } from '@prisma/client';
import { encrypt, decrypt } from '../common/security';

const prisma = new PrismaClient();

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;

    // Transparent decryption of PII
    return {
      ...user,
      nameEncrypted: user.nameEncrypted ? decrypt(user.nameEncrypted) : null,
      panEncrypted: user.panEncrypted ? decrypt(user.panEncrypted) : null,
    };
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return null;

    return {
      ...user,
      nameEncrypted: user.nameEncrypted ? decrypt(user.nameEncrypted) : null,
      panEncrypted: user.panEncrypted ? decrypt(user.panEncrypted) : null,
    };
  }

  async create(data: Partial<User>): Promise<User> {
    // Transparent encryption of PII
    const encryptedData = {
      ...data,
      nameEncrypted: data.nameEncrypted ? encrypt(data.nameEncrypted) : undefined,
      panEncrypted: data.panEncrypted ? encrypt(data.panEncrypted) : undefined,
    } as any;

    return await prisma.user.create({ data: encryptedData });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const encryptedData = {
      ...data,
      nameEncrypted: data.nameEncrypted ? encrypt(data.nameEncrypted) : undefined,
      panEncrypted: data.panEncrypted ? encrypt(data.panEncrypted) : undefined,
    } as any;

    return await prisma.user.update({
      where: { id },
      data: encryptedData,
    });
  }
}
