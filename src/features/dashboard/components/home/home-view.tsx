import { formatDay } from '@/features/booking/booking-rules';
import { PageHeader } from '../page-header';
import { JobsCard } from './jobs-card';
import { BookingLinkCard } from './booking-link-card';
import { StatTiles } from './stat-tiles';
import { PopularCard } from './popular-card';
import type { JobsOverview } from '../../jobs';
import type { DashboardMetrics, PopularDisplays } from '../../types';

export interface HomeViewProps {
  firstName?: string;
  slug: string;
  bookingUrl: string;
  bookingOpen: boolean;
  /** Notices above the jobs: billing banner, setup checklist (each renders nothing when all is well) */
  notices: React.ReactNode;
  jobs: JobsOverview;
  metrics: DashboardMetrics;
  popular: PopularDisplays | null;
}

/**
 * The dashboard home. Work first (what's going up and coming down), the
 * booking link next, numbers last. Data comes in as props so /lab can
 * render it without a database.
 */
export function HomeView({ firstName, slug, bookingUrl, bookingOpen, notices, jobs, metrics, popular }: HomeViewProps) {
  return (
    <>
      <PageHeader title={firstName ? `Hi, ${firstName}` : 'Home'} description={formatDay(jobs.today)} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-6">
          {notices}
          <JobsCard overview={jobs} slug={slug} />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-6">
          <BookingLinkCard url={bookingUrl} open={bookingOpen} />
          <StatTiles metrics={metrics} slug={slug} />
          <PopularCard popular={popular} slug={slug} />
        </div>
      </div>
    </>
  );
}
