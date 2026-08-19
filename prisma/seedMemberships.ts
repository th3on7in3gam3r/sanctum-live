export const SEED_ORG_ID = 'org_miracle_center_kampala';

export const SEED_MEMBERSHIPS: Array<{
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'PRAYER_LEADER' | 'TECHNICAL_ADMIN';
}> = [
  { id: 'user_pastor_kenneth', name: 'Pastor Kenneth', email: 'kenneth@miraclecenter.org', role: 'OWNER' },
  { id: 'user_admin_grace', name: 'Grace Nakato', email: 'grace@miraclecenter.org', role: 'ADMIN' },
  { id: 'user_leader_robert', name: 'Pastor Robert K.', email: 'robert@miraclecenter.org', role: 'PRAYER_LEADER' },
  { id: 'user_leader_emmanuel', name: 'Elder Emmanuel T.', email: 'emmanuel@miraclecenter.org', role: 'PRAYER_LEADER' },
  { id: 'user_leader_sarah', name: 'Sarah Prayer Leader', email: 'sarah@miraclecenter.org', role: 'PRAYER_LEADER' },
  { id: 'user_tech_daniel', name: 'Daniel Technical', email: 'daniel@miraclecenter.org', role: 'TECHNICAL_ADMIN' },
];
