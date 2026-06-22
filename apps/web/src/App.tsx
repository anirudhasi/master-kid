import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import RequireAuth from '@/components/RequireAuth'
import Login from '@/pages/Login'
import KidOnboarding from '@/pages/KidOnboarding'
import Landing from '@/pages/Landing'
import ChildDashboard from '@/pages/ChildDashboard'
import ParentDashboard from '@/pages/ParentDashboard'
import TutorPortal from '@/pages/TutorPortal'
import TutorMarketplace from '@/pages/TutorMarketplace'
import StudentProfile from '@/pages/StudentProfile'
import LearningPlan from '@/pages/LearningPlan'
import Social from '@/pages/Social'
import AIAssistant from '@/pages/AIAssistant'
import Pricing from '@/pages/Pricing'
import Syllabus from '@/pages/Syllabus'
import Schedule from '@/pages/Schedule'
import Olympiads from '@/pages/Olympiads'
import Worksheets from '@/pages/Worksheets'
import Resources from '@/pages/Resources'
import Blog from '@/pages/Blog'
import Knowledge from '@/pages/Knowledge'
import Daily from '@/pages/Daily'
import Storyboard from '@/pages/Storyboard'
import Academic from '@/pages/Academic'
import Olympiad from '@/pages/Olympiad'
import ExtraCurricular from '@/pages/ExtraCurricular'
import Coach from '@/pages/Coach'
import Admin from '@/pages/Admin'
import Subscription from '@/pages/Subscription'
import NotFound from '@/pages/NotFound'
import { useAuthStore } from '@/store/authStore'
import { useSubscriptionStore, isSubscriptionActive } from '@/store/subscriptionStore'

// Routes that only make sense with a child selected. Without one, we bounce to
// the profile picker so the user chooses whose journey they're looking at.
const CHILD_ONLY_ROUTES = [
  '/child', '/profile', '/storyboard', '/academic', '/syllabus', '/schedule', '/plan',
  '/worksheets', '/olympiad', '/olympiads', '/activities', '/resources', '/digest', '/fun', '/assistant',
]

function AppShell() {
  const loc = useLocation()
  const { activeKidId, kids } = useAuthStore()
  const sub = useSubscriptionStore(s => (activeKidId ? s.subs[activeKidId] : undefined))

  // Guard: child-scoped routes require a selected child → otherwise the picker.
  if (activeKidId === null && CHILD_ONLY_ROUTES.includes(loc.pathname)) {
    return <Navigate to="/login" replace />
  }

  // Child-scoped gate: every child needs an active subscription/trial first,
  // then onboarding, before the app opens. (Admin view has activeKidId === null.)
  if (activeKidId !== null) {
    const kid = kids.find(k => k.id === activeKidId)
    if (kid && !isSubscriptionActive(sub)) {
      return <Subscription />
    }
    if (kid && !kid.isOnboarded) {
      return <KidOnboarding />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content-area">
        <Routes>
          <Route path="/child"      element={<ChildDashboard />} />
          <Route path="/storyboard" element={<Storyboard />} />
          <Route path="/academic"   element={<Academic />} />
          <Route path="/olympiad"    element={<Olympiad />} />
          <Route path="/activities"  element={<ExtraCurricular />} />
          <Route path="/parent"     element={<ParentDashboard />} />
          <Route path="/tutor"      element={<TutorPortal />} />
          <Route path="/coach"      element={<Coach />} />
          <Route path="/admin"      element={<Admin />} />
          <Route path="/tutors"     element={<TutorMarketplace />} />
          <Route path="/profile"    element={<StudentProfile />} />
          <Route path="/plan"       element={<LearningPlan />} />
          <Route path="/social"     element={<Social />} />
          <Route path="/assistant"  element={<AIAssistant />} />
          <Route path="/pricing"    element={<Pricing />} />
          <Route path="/syllabus"   element={<Syllabus />} />
          <Route path="/schedule"   element={<Schedule />} />
          <Route path="/olympiads"  element={<Olympiads />} />
          <Route path="/worksheets" element={<Worksheets />} />
          <Route path="/resources"  element={<Resources />} />
          <Route path="/blog"       element={<Blog />} />
          <Route path="/fun"        element={<Knowledge />} />
          <Route path="/digest"     element={<Daily />} />
          <Route path="/404"        element={<NotFound />} />
          <Route path="*"           element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected app shell — RequireAuth redirects to /login if not authenticated */}
        <Route path="/*" element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        } />
      </Routes>
    </Router>
  )
}
