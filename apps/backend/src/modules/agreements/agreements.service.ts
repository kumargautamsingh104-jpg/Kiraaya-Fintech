import { db } from '../../lib/db';
import { AgreementStatus } from '@prisma/client';

export class AgreementsService {
  async createDraft(tenancyId: string, templateVersion: string, customClauses?: string) {
    const tenancy = await db.tenancy.findUnique({
      where: { id: tenancyId },
    });

    if (!tenancy) throw new Error('Tenancy not found');

    const agreement = await db.rentalAgreement.create({
      data: {
        tenancyId,
        templateVersion,
        customClauses,
        status: AgreementStatus.draft,
        agreementFeePaise: templateVersion.startsWith('KA') ? 49900 : 59900, // PRD §6.1
      },
    });

    return agreement;
  }

  async getAgreementByTenancy(tenancyId: string) {
    const agreement = await db.rentalAgreement.findUnique({
      where: { tenancyId },
    });
    return agreement;
  }

  async initiateDigio(agreementId: string) {
    const agreement = await db.rentalAgreement.findUnique({
      where: { id: agreementId },
      include: { tenancy: { include: { tenant: true, landlord: true } } },
    });

    if (!agreement) throw new Error('Agreement not found');

    // MOCK Digio integration for Phase 1
    // In real prod: call Digio API to create document and get digioDocumentId
    const digioDocumentId = `did_${Math.random().toString(36).substring(7)}`;

    await db.rentalAgreement.update({
      where: { id: agreementId },
      data: {
        digioDocumentId,
        status: AgreementStatus.pending_sign_landlord,
      },
    });

    return { digioDocumentId, status: AgreementStatus.pending_sign_landlord };
  }

  async executeAgreement(agreementId: string) {
    const agreement = await db.rentalAgreement.findUnique({
      where: { id: agreementId },
    });

    if (!agreement) throw new Error('Agreement not found');

    // Final execution status
    const executedAgreement = await db.rentalAgreement.update({
      where: { id: agreementId },
      data: {
        status: AgreementStatus.executed,
        executedAt: new Date(),
        expiryDate: new Date(Date.now() + 11 * 30 * 24 * 60 * 60 * 1000), // 11 months default
      },
    });

    return executedAgreement;
  }
}
