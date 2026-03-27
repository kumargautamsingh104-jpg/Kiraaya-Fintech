import { createTenancy, listTenancies, getTenancy } from '../../../../routes/tenancies';
export const POST = createTenancy;
export const GET = listTenancies;
// For specific GET by ID, we'd use a different route pattern, but this is the collection root.
