import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { lazy, Suspense } from 'react';

// ── Site layout ────────────────────────────────────────────────────────────
import SiteLayout from '@/components/site/SiteLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import BibleLayout from '@/components/bible/BibleLayout';

// ── Site pages ─────────────────────────────────────────────────────────────
const HomePage = lazy(() => import('@/nextjs-app/(site)/page'));
const AboutPage = lazy(() => import('@/nextjs-app/(site)/about/page'));
const BlogPage = lazy(() => import('@/nextjs-app/(site)/blog/page'));
const CampaignsPage = lazy(() => import('@/nextjs-app/(site)/campaigns/page'));
const CampaignDetailPage = lazy(() => import('@/nextjs-app/(site)/campaigns/[id]/page'));
const ContactPage = lazy(() => import('@/nextjs-app/(site)/contact/page'));
const EventsPage = lazy(() => import('@/nextjs-app/(site)/events/page'));
const EventDetailPage = lazy(() => import('@/nextjs-app/(site)/events/[id]/page'));
const FormsPage = lazy(() => import('@/nextjs-app/(site)/forms/[slug]/page'));
const GalleryPage = lazy(() => import('@/nextjs-app/(site)/gallery/page'));
const GivePage = lazy(() => import('@/nextjs-app/(site)/give/page'));
const GiveSuccessPage = lazy(() => import('@/nextjs-app/(site)/give/success/page'));
const GroupsPage = lazy(() => import('@/nextjs-app/(site)/groups/page'));
const GroupDetailPage = lazy(() => import('@/nextjs-app/(site)/groups/[id]/page'));
const LeadershipPage = lazy(() => import('@/nextjs-app/(site)/leadership/page'));
const LivePage = lazy(() => import('@/nextjs-app/(site)/live/page'));
const MembershipPage = lazy(() => import('@/nextjs-app/(site)/membership/page'));
const MinistriesPage = lazy(() => import('@/nextjs-app/(site)/ministries/page'));
const MinistryDetailPage = lazy(() => import('@/nextjs-app/(site)/ministries/[id]/page'));
const PastorPage = lazy(() => import('@/nextjs-app/(site)/pastor/page'));
const PortalPage = lazy(() => import('@/nextjs-app/(site)/portal/page'));
const PortalDirectoryPage = lazy(() => import('@/nextjs-app/(site)/portal/directory/page'));
const PortalEventsPage = lazy(() => import('@/nextjs-app/(site)/portal/events/page'));
const PortalGivingPage = lazy(() => import('@/nextjs-app/(site)/portal/giving/page'));
const PortalGroupsPage = lazy(() => import('@/nextjs-app/(site)/portal/groups/page'));
const PortalLoginPage = lazy(() => import('@/nextjs-app/(site)/portal/login/page'));
const PortalProfilePage = lazy(() => import('@/nextjs-app/(site)/portal/profile/page'));
const PortalVerifyMagicPage = lazy(() => import('@/nextjs-app/(site)/portal/verify-magic/page'));
const PrayerPage = lazy(() => import('@/nextjs-app/(site)/prayer/page'));
const PrivacyPage = lazy(() => import('@/nextjs-app/(site)/privacy/page'));
const SermonsPage = lazy(() => import('@/nextjs-app/(site)/sermons/page'));
const SermonDetailPage = lazy(() => import('@/nextjs-app/(site)/sermons/[id]/page'));
const TermsPage = lazy(() => import('@/nextjs-app/(site)/terms/page'));
const TestimoniesPage = lazy(() => import('@/nextjs-app/(site)/testimonies/page'));
const VisitPage = lazy(() => import('@/nextjs-app/(site)/visit/page'));
const VolunteerPage = lazy(() => import('@/nextjs-app/(site)/volunteer/page'));

// ── Admin pages ────────────────────────────────────────────────────────────
const AdminPage = lazy(() => import('@/nextjs-app/admin/page'));
const AdminDashboardPage = lazy(() => import('@/nextjs-app/admin/dashboard/page'));
const AdminLoginPage = lazy(() => import('@/nextjs-app/admin/login/page'));
const AdminAttendancePage = lazy(() => import('@/nextjs-app/admin/attendance/page'));
const AdminAuditLogPage = lazy(() => import('@/nextjs-app/admin/audit-log/page'));
const AdminBlogPage = lazy(() => import('@/nextjs-app/admin/blog/page'));
const AdminBroadcastsPage = lazy(() => import('@/nextjs-app/admin/broadcasts/page'));
const AdminCampaignsPage = lazy(() => import('@/nextjs-app/admin/campaigns/page'));
const AdminContactInfoPage = lazy(() => import('@/nextjs-app/admin/contact-info/page'));
const AdminContactMessagesPage = lazy(() => import('@/nextjs-app/admin/contact-messages/page'));
const AdminContentBlocksPage = lazy(() => import('@/nextjs-app/admin/content-blocks/page'));
const AdminDonationsPage = lazy(() => import('@/nextjs-app/admin/donations/page'));
const AdminEventsPage = lazy(() => import('@/nextjs-app/admin/events/page'));
const AdminFormsPage = lazy(() => import('@/nextjs-app/admin/forms/page'));
const AdminFundsPage = lazy(() => import('@/nextjs-app/admin/funds/page'));
const AdminGalleryPage = lazy(() => import('@/nextjs-app/admin/gallery/page'));
const AdminGivingPage = lazy(() => import('@/nextjs-app/admin/giving/page'));
const AdminGroupsPage = lazy(() => import('@/nextjs-app/admin/groups/page'));
const AdminImagesPage = lazy(() => import('@/nextjs-app/admin/images/page'));
const AdminLeadersPage = lazy(() => import('@/nextjs-app/admin/leaders/page'));
const AdminMemberApplicationsPage = lazy(() => import('@/nextjs-app/admin/member-applications/page'));
const AdminMembersPage = lazy(() => import('@/nextjs-app/admin/members/page'));
const AdminMinistriesPage = lazy(() => import('@/nextjs-app/admin/ministries/page'));
const AdminNewsletterPage = lazy(() => import('@/nextjs-app/admin/newsletter/page'));
const AdminNoticesPage = lazy(() => import('@/nextjs-app/admin/notices/page'));
const AdminOfferingsPage = lazy(() => import('@/nextjs-app/admin/offerings/page'));
const AdminPeoplePage = lazy(() => import('@/nextjs-app/admin/people/page'));
const AdminPledgesPage = lazy(() => import('@/nextjs-app/admin/pledges/page'));
const AdminPortfolioPage = lazy(() => import('@/nextjs-app/admin/portfolio/page'));
const AdminPrayerRequestsPage = lazy(() => import('@/nextjs-app/admin/prayer-requests/page'));
const AdminProfilePage = lazy(() => import('@/nextjs-app/admin/profile/page'));
const AdminReportsPage = lazy(() => import('@/nextjs-app/admin/reports/page'));
const AdminRsvpsPage = lazy(() => import('@/nextjs-app/admin/rsvps/page'));
const AdminSermonsPage = lazy(() => import('@/nextjs-app/admin/sermons/page'));
const AdminServicesPage = lazy(() => import('@/nextjs-app/admin/services/page'));
const AdminServiceTimesPage = lazy(() => import('@/nextjs-app/admin/service-times/page'));
const AdminSettingsPage = lazy(() => import('@/nextjs-app/admin/settings/page'));
const AdminTeamPage = lazy(() => import('@/nextjs-app/admin/team/page'));
const AdminTestimoniesPage = lazy(() => import('@/nextjs-app/admin/testimonies/page'));
const AdminThemePage = lazy(() => import('@/nextjs-app/admin/theme/page'));
const AdminTodosPage = lazy(() => import('@/nextjs-app/admin/todos/page'));
const AdminUsersPage = lazy(() => import('@/nextjs-app/admin/users/page'));
const AdminVersesPage = lazy(() => import('@/nextjs-app/admin/verses/page'));
const AdminVolunteersPage = lazy(() => import('@/nextjs-app/admin/volunteers/page'));

// ── Bible pages ────────────────────────────────────────────────────────────
const BiblePage = lazy(() => import('@/nextjs-app/bible/page'));
const BibleBookPage = lazy(() => import('@/nextjs-app/bible/[book]/page'));

// ── Agent demo ─────────────────────────────────────────────────────────────
const AgentDemoPage = lazy(() => import('@/nextjs-app/agent-demo/page'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* ── Admin routes ── */}
        <Route path="/admin/login"><AdminLayout><AdminLoginPage /></AdminLayout></Route>
        <Route path="/admin/dashboard"><AdminLayout><AdminDashboardPage /></AdminLayout></Route>
        <Route path="/admin/attendance"><AdminLayout><AdminAttendancePage /></AdminLayout></Route>
        <Route path="/admin/audit-log"><AdminLayout><AdminAuditLogPage /></AdminLayout></Route>
        <Route path="/admin/blog"><AdminLayout><AdminBlogPage /></AdminLayout></Route>
        <Route path="/admin/broadcasts"><AdminLayout><AdminBroadcastsPage /></AdminLayout></Route>
        <Route path="/admin/campaigns"><AdminLayout><AdminCampaignsPage /></AdminLayout></Route>
        <Route path="/admin/contact-info"><AdminLayout><AdminContactInfoPage /></AdminLayout></Route>
        <Route path="/admin/contact-messages"><AdminLayout><AdminContactMessagesPage /></AdminLayout></Route>
        <Route path="/admin/content-blocks"><AdminLayout><AdminContentBlocksPage /></AdminLayout></Route>
        <Route path="/admin/donations"><AdminLayout><AdminDonationsPage /></AdminLayout></Route>
        <Route path="/admin/events"><AdminLayout><AdminEventsPage /></AdminLayout></Route>
        <Route path="/admin/forms"><AdminLayout><AdminFormsPage /></AdminLayout></Route>
        <Route path="/admin/funds"><AdminLayout><AdminFundsPage /></AdminLayout></Route>
        <Route path="/admin/gallery"><AdminLayout><AdminGalleryPage /></AdminLayout></Route>
        <Route path="/admin/giving"><AdminLayout><AdminGivingPage /></AdminLayout></Route>
        <Route path="/admin/groups"><AdminLayout><AdminGroupsPage /></AdminLayout></Route>
        <Route path="/admin/images"><AdminLayout><AdminImagesPage /></AdminLayout></Route>
        <Route path="/admin/leaders"><AdminLayout><AdminLeadersPage /></AdminLayout></Route>
        <Route path="/admin/member-applications"><AdminLayout><AdminMemberApplicationsPage /></AdminLayout></Route>
        <Route path="/admin/members"><AdminLayout><AdminMembersPage /></AdminLayout></Route>
        <Route path="/admin/ministries"><AdminLayout><AdminMinistriesPage /></AdminLayout></Route>
        <Route path="/admin/newsletter"><AdminLayout><AdminNewsletterPage /></AdminLayout></Route>
        <Route path="/admin/notices"><AdminLayout><AdminNoticesPage /></AdminLayout></Route>
        <Route path="/admin/offerings"><AdminLayout><AdminOfferingsPage /></AdminLayout></Route>
        <Route path="/admin/people"><AdminLayout><AdminPeoplePage /></AdminLayout></Route>
        <Route path="/admin/pledges"><AdminLayout><AdminPledgesPage /></AdminLayout></Route>
        <Route path="/admin/portfolio"><AdminLayout><AdminPortfolioPage /></AdminLayout></Route>
        <Route path="/admin/prayer-requests"><AdminLayout><AdminPrayerRequestsPage /></AdminLayout></Route>
        <Route path="/admin/profile"><AdminLayout><AdminProfilePage /></AdminLayout></Route>
        <Route path="/admin/reports"><AdminLayout><AdminReportsPage /></AdminLayout></Route>
        <Route path="/admin/rsvps"><AdminLayout><AdminRsvpsPage /></AdminLayout></Route>
        <Route path="/admin/sermons"><AdminLayout><AdminSermonsPage /></AdminLayout></Route>
        <Route path="/admin/services"><AdminLayout><AdminServicesPage /></AdminLayout></Route>
        <Route path="/admin/service-times"><AdminLayout><AdminServiceTimesPage /></AdminLayout></Route>
        <Route path="/admin/settings"><AdminLayout><AdminSettingsPage /></AdminLayout></Route>
        <Route path="/admin/team"><AdminLayout><AdminTeamPage /></AdminLayout></Route>
        <Route path="/admin/testimonies"><AdminLayout><AdminTestimoniesPage /></AdminLayout></Route>
        <Route path="/admin/theme"><AdminLayout><AdminThemePage /></AdminLayout></Route>
        <Route path="/admin/todos"><AdminLayout><AdminTodosPage /></AdminLayout></Route>
        <Route path="/admin/users"><AdminLayout><AdminUsersPage /></AdminLayout></Route>
        <Route path="/admin/verses"><AdminLayout><AdminVersesPage /></AdminLayout></Route>
        <Route path="/admin/volunteers"><AdminLayout><AdminVolunteersPage /></AdminLayout></Route>
        <Route path="/admin"><AdminLayout><AdminPage /></AdminLayout></Route>

        {/* ── Bible routes ── */}
        <Route path="/bible/:book"><BibleLayout><BibleBookPage /></BibleLayout></Route>
        <Route path="/bible"><BibleLayout><BiblePage /></BibleLayout></Route>

        {/* ── Agent demo ── */}
        <Route path="/agent-demo"><AgentDemoPage /></Route>

        {/* ── Portal routes (inside site layout) ── */}
        <Route path="/portal/login"><SiteLayout><PortalLoginPage /></SiteLayout></Route>
        <Route path="/portal/verify-magic"><SiteLayout><PortalVerifyMagicPage /></SiteLayout></Route>
        <Route path="/portal/directory"><SiteLayout><PortalDirectoryPage /></SiteLayout></Route>
        <Route path="/portal/events"><SiteLayout><PortalEventsPage /></SiteLayout></Route>
        <Route path="/portal/giving"><SiteLayout><PortalGivingPage /></SiteLayout></Route>
        <Route path="/portal/groups"><SiteLayout><PortalGroupsPage /></SiteLayout></Route>
        <Route path="/portal/profile"><SiteLayout><PortalProfilePage /></SiteLayout></Route>
        <Route path="/portal"><SiteLayout><PortalPage /></SiteLayout></Route>

        {/* ── Site routes ── */}
        <Route path="/about"><SiteLayout><AboutPage /></SiteLayout></Route>
        <Route path="/blog"><SiteLayout><BlogPage /></SiteLayout></Route>
        <Route path="/campaigns/:id"><SiteLayout><CampaignDetailPage /></SiteLayout></Route>
        <Route path="/campaigns"><SiteLayout><CampaignsPage /></SiteLayout></Route>
        <Route path="/contact"><SiteLayout><ContactPage /></SiteLayout></Route>
        {/* @ts-ignore */}
        <Route path="/events/:id"><SiteLayout><EventDetailPage /></SiteLayout></Route>
        <Route path="/events"><SiteLayout><EventsPage /></SiteLayout></Route>
        <Route path="/forms/:slug"><SiteLayout><FormsPage /></SiteLayout></Route>
        <Route path="/gallery"><SiteLayout><GalleryPage /></SiteLayout></Route>
        <Route path="/give/success"><SiteLayout><GiveSuccessPage /></SiteLayout></Route>
        <Route path="/give"><SiteLayout><GivePage /></SiteLayout></Route>
        <Route path="/groups/:id"><SiteLayout><GroupDetailPage /></SiteLayout></Route>
        <Route path="/groups"><SiteLayout><GroupsPage /></SiteLayout></Route>
        <Route path="/leadership"><SiteLayout><LeadershipPage /></SiteLayout></Route>
        <Route path="/live"><SiteLayout><LivePage /></SiteLayout></Route>
        <Route path="/membership"><SiteLayout><MembershipPage /></SiteLayout></Route>
        <Route path="/ministries/:id"><SiteLayout><MinistryDetailPage /></SiteLayout></Route>
        <Route path="/ministries"><SiteLayout><MinistriesPage /></SiteLayout></Route>
        <Route path="/pastor"><SiteLayout><PastorPage /></SiteLayout></Route>
        <Route path="/prayer"><SiteLayout><PrayerPage /></SiteLayout></Route>
        <Route path="/privacy"><SiteLayout><PrivacyPage /></SiteLayout></Route>
        <Route path="/sermons/:id"><SiteLayout><SermonDetailPage /></SiteLayout></Route>
        <Route path="/sermons"><SiteLayout><SermonsPage /></SiteLayout></Route>
        <Route path="/terms"><SiteLayout><TermsPage /></SiteLayout></Route>
        <Route path="/testimonies"><SiteLayout><TestimoniesPage /></SiteLayout></Route>
        <Route path="/visit"><SiteLayout><VisitPage /></SiteLayout></Route>
        <Route path="/volunteer"><SiteLayout><VolunteerPage /></SiteLayout></Route>
        <Route path="/"><SiteLayout><HomePage /></SiteLayout></Route>

        {/* ── 404 ── */}
        <Route>
          <SiteLayout>
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-primary">404</h1>
                <p className="mt-2 text-muted-foreground">Page not found</p>
                <a href="/" className="mt-4 inline-block text-sky-blue underline">Go home</a>
              </div>
            </div>
          </SiteLayout>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRoutes />
        </WouterRouter>
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
