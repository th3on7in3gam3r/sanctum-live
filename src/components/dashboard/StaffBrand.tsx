import React from 'react';
import { BrandLockup } from '@plcc/brand/BrandLockup';
import { SanctumLogo } from '../common/SanctumLogo';
import { churchSiteUrl, isChurchMode } from '../../lib/appMode';

export const StaffBrand: React.FC<{ size?: 'sm' | 'md' | 'lg'; variant?: 'full' | 'mark' }> = ({
  size = 'sm',
  variant = 'full',
}) => {
  const lockupSize = size === 'lg' ? 'lg' : size === 'md' ? 'md' : 'sm';
  const lockupVariant = variant === 'mark' ? 'mark' : 'full';
  if (!isChurchMode()) return <SanctumLogo size={lockupSize} showTagline={lockupVariant === 'full' && lockupSize !== 'sm'} />;
  return <BrandLockup size={lockupSize} variant={lockupVariant} href={churchSiteUrl()} />;
};
