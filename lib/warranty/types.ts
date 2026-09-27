export type WarrantyStatus =
  | 'UNDER_WARRANTY'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'AWAITING_ISSUANCE'
  | 'NO_WARRANTY';

export interface WarrantyInfo {
  status: WarrantyStatus;
  label: string;
  badgeClass: string;
  badgeBorderClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
  issuedAt: string | null;
  endsAt: string | null;
  formattedIssuedAt: string | null;
  formattedEndsAt: string | null;
  daysRemaining: number | null;
  isRepasse: boolean;
  months: number;
}
