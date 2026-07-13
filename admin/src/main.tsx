import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider, useAuth } from './lib/auth'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { CrudPage } from './pages/CrudPage'
import { UserManagement } from './pages/UserManagement'
import './index.css'

// Main site imports
import { LanguageProvider } from '../../src/app/lib/language'
import { Layout as SiteLayout } from '../../src/app/components/site/Layout'
import Home from '../../src/app/pages/Home'
import About from '../../src/app/pages/About'
import Pastor from '../../src/app/pages/Pastor'
import Leadership from '../../src/app/pages/Leadership'
import Ministries from '../../src/app/pages/Ministries'
import MinistryDetail from '../../src/app/pages/MinistryDetail'
import Sermons from '../../src/app/pages/Sermons'
import SermonDetail from '../../src/app/pages/SermonDetail'
import Events from '../../src/app/pages/Events'
import EventDetail from '../../src/app/pages/EventDetail'
import Gallery from '../../src/app/pages/Gallery'
import Prayer from '../../src/app/pages/Prayer'
import Give from '../../src/app/pages/Give'
import Contact from '../../src/app/pages/Contact'
import Live from '../../src/app/pages/Live'
import PlanVisit from '../../src/app/pages/PlanVisit'
import Privacy from '../../src/app/pages/Privacy'
import Terms from '../../src/app/pages/Terms'
import NotFound from '../../src/app/pages/NotFound'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{padding:40,textAlign:'center',fontSize:20}}>Loading...</div>
  if (!user) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              {/* Main site routes */}
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/visit" element={<PlanVisit />} />
                <Route path="/about" element={<About />} />
                <Route path="/pastor" element={<Pastor />} />
                <Route path="/leadership" element={<Leadership />} />
                <Route path="/ministries" element={<Ministries />} />
                <Route path="/ministries/:id" element={<MinistryDetail />} />
                <Route path="/sermons" element={<Sermons />} />
                <Route path="/sermons/:id" element={<SermonDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/prayer" element={<Prayer />} />
                <Route path="/give" element={<Give />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/live" element={<Live />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="sermons" element={<CrudPage endpoint="sermons" title="Sermons" fields={[
                  { key: 'title', label: 'Title', type: 'text' },
                  { key: 'speaker', label: 'Speaker', type: 'text' },
                  { key: 'date', label: 'Date', type: 'text' },
                  { key: 'duration', label: 'Duration', type: 'text' },
                  { key: 'series', label: 'Series', type: 'text' },
                  { key: 'topic', label: 'Topic', type: 'text' },
                  { key: 'image', label: 'Image URL', type: 'text' },
                  { key: 'description', label: 'Description', type: 'textarea' },
                ]} />} />
                <Route path="events" element={<CrudPage endpoint="events" title="Events" fields={[
                  { key: 'title', label: 'Title', type: 'text' },
                  { key: 'date', label: 'Date (ISO)', type: 'text' },
                  { key: 'display_date', label: 'Display Date', type: 'text' },
                  { key: 'time', label: 'Time', type: 'text' },
                  { key: 'location', label: 'Location', type: 'text' },
                  { key: 'image', label: 'Image URL', type: 'text' },
                  { key: 'description', label: 'Description', type: 'textarea' },
                ]} />} />
                <Route path="ministries" element={<CrudPage endpoint="ministries" title="Ministries" fields={[
                  { key: 'name', label: 'Name (EN)', type: 'text' },
                  { key: 'name_ne', label: 'Name (NE)', type: 'text' },
                  { key: 'description', label: 'Description', type: 'textarea' },
                  { key: 'leader', label: 'Leader', type: 'text' },
                  { key: 'meeting', label: 'Meeting', type: 'text' },
                  { key: 'image', label: 'Image URL', type: 'text' },
                  { key: 'icon', label: 'Icon', type: 'text' },
                ]} />} />
                <Route path="leaders" element={<CrudPage endpoint="leaders" title="Leaders" fields={[
                  { key: 'name', label: 'Name', type: 'text' },
                  { key: 'role', label: 'Role', type: 'text' },
                  { key: 'category', label: 'Category', type: 'text' },
                  { key: 'image', label: 'Image URL', type: 'text' },
                  { key: 'bio', label: 'Bio', type: 'textarea' },
                ]} />} />
                <Route path="gallery" element={<CrudPage endpoint="gallery" title="Gallery" fields={[
                  { key: 'title', label: 'Title', type: 'text' },
                  { key: 'category', label: 'Category', type: 'text' },
                  { key: 'image', label: 'Image URL', type: 'text' },
                ]} />} />
                <Route path="testimonies" element={<CrudPage endpoint="testimonies" title="Testimonies" fields={[
                  { key: 'name', label: 'Name', type: 'text' },
                  { key: 'role', label: 'Role', type: 'text' },
                  { key: 'quote', label: 'Quote', type: 'textarea' },
                  { key: 'image', label: 'Image URL', type: 'text' },
                  { key: 'rating', label: 'Rating (1-5)', type: 'number' },
                ]} />} />
                <Route path="notices" element={<CrudPage endpoint="notices" title="Notices" fields={[
                  { key: 'title', label: 'Title', type: 'text' },
                  { key: 'date', label: 'Date', type: 'text' },
                  { key: 'category', label: 'Category', type: 'text' },
                  { key: 'text', label: 'Text', type: 'textarea' },
                  { key: 'urgent', label: 'Urgent', type: 'checkbox' },
                ]} />} />
                <Route path="members" element={<CrudPage endpoint="members" title="Members" fields={[
                  { key: 'name', label: 'Name', type: 'text' },
                  { key: 'role', label: 'Role', type: 'text' },
                  { key: 'since', label: 'Since', type: 'text' },
                  { key: 'image', label: 'Image URL', type: 'text' },
                ]} />} />
                <Route path="service-times" element={<CrudPage endpoint="service-times" title="Service Times" fields={[
                  { key: 'name', label: 'Name (EN)', type: 'text' },
                  { key: 'name_ne', label: 'Name (NE)', type: 'text' },
                  { key: 'day', label: 'Day', type: 'text' },
                  { key: 'time', label: 'Time', type: 'text' },
                  { key: 'icon', label: 'Icon', type: 'text' },
                  { key: 'sort_order', label: 'Sort Order', type: 'number' },
                ]} />} />
                <Route path="verses" element={<CrudPage endpoint="verses" title="Verses" fields={[
                  { key: 'text', label: 'Text (EN)', type: 'textarea' },
                  { key: 'ref_text', label: 'Reference', type: 'text' },
                  { key: 'ne', label: 'Text (NE)', type: 'textarea' },
                ]} />} />
                <Route path="campaigns" element={<CrudPage endpoint="campaigns" title="Campaigns" fields={[
                  { key: 'title', label: 'Title', type: 'text' },
                  { key: 'raised', label: 'Raised (Rs)', type: 'number' },
                  { key: 'goal', label: 'Goal (Rs)', type: 'number' },
                ]} />} />
                <Route path="settings" element={<CrudPage endpoint="settings" title="Settings" fields={[
                  { key: 'key', label: 'Key', type: 'text' },
                  { key: 'value', label: 'Value', type: 'textarea' },
                ]} />} />
              </Route>

              {/* Catch-all for main site */}
              <Route path="*" element={<SiteLayout><NotFound /></SiteLayout>} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
