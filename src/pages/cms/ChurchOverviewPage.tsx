import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cmsApi } from '../../services/api/cmsApi';
import { CmsPageHeader } from './CmsDrawer';

export const ChurchOverviewPage: React.FC = () => {
  const { organization } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      cmsApi.listPages(organization.id),
      cmsApi.listAnnouncements(organization.id),
      cmsApi.listEvents(organization.id),
      cmsApi.listSermons(organization.id),
    ])
      .then(([pages, announcements, events, sermons]) => {
        const sample = [
          ...pages.pages,
          ...announcements.announcements,
          ...events.events,
          ...sermons.sermons,
        ].filter((row) => row.isPlaceholder).length;
        setCount(sample);
      })
      .catch((err: Error) => setError(err.message));
  }, [organization.id]);

  const label = count === 1 ? '1 sample item left to replace' : `${count ?? 0} sample items left to replace`;

  return (
    <div className="space-y-5">
      <CmsPageHeader title="Church" description="Website pages, gatherings, sermons, and announcements." />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <p className="text-lg font-semibold text-ink">
        {count === null && !error ? 'Counting sample items…' : label}
      </p>
    </div>
  );
};
