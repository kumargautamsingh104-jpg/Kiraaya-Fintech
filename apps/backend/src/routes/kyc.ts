// Re-export KYC route handlers — these are implemented inline in kyc.controller.ts
// which lives at ../modules/auth/kyc.controller relative to this routes/ directory
export { verifyPanRoute, initAadhaarRoute } from '../modules/auth/kyc.controller';
