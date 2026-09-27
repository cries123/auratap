import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { RESERVED_PATHS } from './config'
import { SiteHeader } from './components/SiteHeader'
import { Footer } from './components/Footer'
import { ScrollToTop } from './components/ScrollToTop'
import { ChatWidget } from './components/ChatWidget'
import { HomePage } from './pages/HomePage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { TestimonialsPage } from './pages/TestimonialsPage'
import { ContactPage } from './pages/ContactPage'
import { PricingPage } from './pages/PricingPage'
import { WarrantyPage } from './pages/WarrantyPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { AuraProfilePage } from './pages/AuraProfilePage'
import { AdminPage } from './pages/AdminPage'
import { CardSetupPage } from './pages/CardSetupPage'
import './App.css'

// The member portal pulls in Firebase Authentication, so it loads only when opened.
const MemberPortalPage = lazy(() => import('./pages/MemberPortalPage').then((module) => ({ default: module.MemberPortalPage })))

function App() {
  const location = useLocation()
  const normalizedPath = location.pathname.replace(/^\//, '').split('/')[0] || ''
  const isProfileRoute = !RESERVED_PATHS.has(normalizedPath)
  // Members editing their page don't need the sales chat covering the editor.
  const showChat = normalizedPath !== 'member'

  if (isProfileRoute) {
    return (
      <Routes>
        <Route path="/:profileSlug" element={<AuraProfilePage />} />
      </Routes>
    )
  }

  // The admin panel is a staff tool with its own header, so it skips the marketing chrome.
  if (normalizedPath === 'admin') {
    return (
      <div className="site-shell">
        <ScrollToTop />
        <AdminPage />
      </div>
    )
  }

  return (
    <div className="site-shell">
      <ScrollToTop />
      <SiteHeader />
      <main className="site-main">
        <Suspense fallback={<p className="member-loading" role="status">Loading…</p>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/warranty" element={<WarrantyPage />} />
            <Route path="/member" element={<MemberPortalPage />} />
            {/* Password resets now happen on Firebase's page; old links land on the portal. */}
            <Route path="/reset-password" element={<Navigate to="/member" replace />} />
            <Route path="/setup" element={<CardSetupPage />} />
            <Route path="/:profileSlug" element={<AuraProfilePage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      {showChat && <ChatWidget />}
    </div>
  )
}

export default App
