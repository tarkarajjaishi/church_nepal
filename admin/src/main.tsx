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

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{padding:40,textAlign:'center',fontSize:20}}>Loading...</div>
  if (!user) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

function LandingPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#f8fafc',fontFamily:'system-ui,sans-serif'}}>
      <div style={{textAlign:'center',maxWidth:500,padding:40}}>
        <div style={{width:64,height:64,borderRadius:16,background:'#0b3c5d',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:32}}>⛪</div>
        <h1 style={{color:'#0b3c5d',fontSize:32,fontWeight:'bold',margin:'0 0 8px'}}>Grace Nepal Church</h1>
        <p style={{color:'#666',fontSize:16,margin:'0 0 32px'}}>Welcome to our church website</p>
        <a href="/admin" style={{display:'inline-block',padding:'12px 32px',background:'#0b3c5d',color:'white',borderRadius:8,textDecoration:'none',fontSize:16,fontWeight:500}}>Admin Panel →</a>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
