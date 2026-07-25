export const publicConfig = {
  appName: 'NeoFit AI',
  legalOperatorName: process.env.NEXT_PUBLIC_LEGAL_OPERATOR_NAME?.trim() || 'NeoFit AI',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || '',
  privacyEffectiveDate: process.env.NEXT_PUBLIC_PRIVACY_EFFECTIVE_DATE?.trim() || '2026-07-25',
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || '',
};
