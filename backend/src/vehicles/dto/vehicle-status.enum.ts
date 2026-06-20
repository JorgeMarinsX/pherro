// Shared vehicle status enum — imported by both create + update DTOs so the
// admin can create an INACTIVE draft and the validators stay symmetric.
export enum VehicleStatusInput {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
