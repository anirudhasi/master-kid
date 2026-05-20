import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
import SocialFeed from '@/pages/SocialFeed'
import AIAssistant from '@/pages/AIAssistant'
import Pricing from '@/pages/Pricing'
import Syllabus from '@/pages/Syllabus'
import Schedule from '@/pages/Schedule'
import Olympiads from '@/pages/Olympiads'
import Worksheets from '@/pages/Worksheets'
import Resources from '@/pages/Resources'
import Blog from '@/pages/Blog'
import FunHub from '@/pages/FunHub'
import DailyDigest from '@/pages/DailyDigest'
import NotFound from '@/pages/NotFound'
import { useAuthStore } from '@/store/authStore'

function AppShell() {
  const { activeKidId, kids } = useAuthStore()

  // If a kid is selected but hasn't completed onboarding → show setup wizard
  if (activeKidId !== null) {
    const kid = kids.find(k => k.id === activeKidId)
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
          <Route path="/parent"     element={<ParentDashboard />} />
          <Route path="/tutor"      element={<TutorPortal />} />
          <Route path="/tutors"     element={<TutorMarketplace />} />
          <Route path="/profile"    element={<StudentProfile />} />
          <Route path="/plan"       element={<LearningPlan />} />
          <Route path="/social"     element={<SocialFeed />} />
          <Route path="/assistant"  element={<AIAssistant />} />
          <Route path="/pricing"    element={<Pricing />} />
          <Route path="/syllabus"   element={<Syllabus />} />
          <Route path="/schedule"   element={<Schedule />} />
          <Route path="/olympiads"  element={<Olympiads />} />
          <Route path="/worksheets" element={<Worksheets />} />
          <Route path="/resources"  element={<Resources />} />
          <Route path="/blog"       element={<Blog />} />
          <Route path="/fun"        element={<FunHub />} />
          <Route path="/digest"     element={<DailyDigest />} />
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
