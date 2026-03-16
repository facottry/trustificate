import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Team from "./pages/Team";
import TeamMember from "./pages/TeamMember";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import TemplateForm from "./pages/TemplateForm";
import Documents from "./pages/Documents";
import DocumentNew from "./pages/DocumentNew";
import BulkUpload from "./pages/BulkUpload";
import CertificateDetail from "./pages/CertificateDetail";
import Registry from "./pages/Registry";
import ExternalCertNew from "./pages/ExternalCertNew";
import AdminVerification from "./pages/AdminVerification";
import Settings from "./pages/Settings";
import Verify from "./pages/Verify";
import CertificatePublic from "./pages/CertificatePublic";
import Testimonials from "./pages/Testimonials";
import TestimonialDetail from "./pages/TestimonialDetail";
import Docs from "./pages/Docs";
import Welcome from "./pages/Welcome";
import CertificateGenerator from "./pages/CertificateGenerator";
import BulkCertificateGenerator from "./pages/BulkCertificateGenerator";
import VerifyCertificateOnline from "./pages/VerifyCertificateOnline";
import Careers from "./pages/Careers";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import { SuperAdminGuard } from "./components/SuperAdminGuard";
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import SuperAdminUsers from "./pages/super-admin/Users";
import SuperAdminOrganizations from "./pages/super-admin/Organizations";
import SuperAdminBilling from "./pages/super-admin/Billing";
import SuperAdminPlans from "./pages/super-admin/Plans";
import SuperAdminCertificates from "./pages/super-admin/Certificates";
import SuperAdminTemplates from "./pages/super-admin/Templates";
import SuperAdminAuditLogs from "./pages/super-admin/AuditLogs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/team" element={<Team />} />
            <Route path="/team/:slug" element={<TeamMember />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/certificate/:slug" element={<CertificatePublic />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/testimonials/:slug" element={<TestimonialDetail />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/docs/:slug" element={<Docs />} />
            <Route path="/certificate-generator" element={<CertificateGenerator />} />
            <Route path="/bulk-certificate-generator" element={<BulkCertificateGenerator />} />
            <Route path="/verify-certificate-online" element={<VerifyCertificateOnline />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin routes */}
            <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/templates/new" element={<ProtectedRoute><TemplateForm /></ProtectedRoute>} />
            <Route path="/templates/:id/edit" element={<ProtectedRoute><TemplateForm /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/documents/new" element={<ProtectedRoute><DocumentNew /></ProtectedRoute>} />
            <Route path="/documents/bulk" element={<ProtectedRoute><BulkUpload /></ProtectedRoute>} />
            <Route path="/documents/:id" element={<ProtectedRoute><CertificateDetail /></ProtectedRoute>} />
            <Route path="/registry" element={<ProtectedRoute><Registry /></ProtectedRoute>} />
            <Route path="/registry/external/new" element={<ProtectedRoute><ExternalCertNew /></ProtectedRoute>} />
            <Route path="/registry/:id" element={<ProtectedRoute><CertificateDetail /></ProtectedRoute>} />
            <Route path="/admin/verification" element={<ProtectedRoute><AdminVerification /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Legacy redirects */}
            <Route path="/certificates" element={<Navigate to="/documents" replace />} />
            <Route path="/certificates/new" element={<Navigate to="/documents/new" replace />} />
            <Route path="/certificates/:id" element={<Navigate to="/documents" replace />} />

            {/* Super Admin routes */}
            <Route path="/super-admin" element={<ProtectedRoute><SuperAdminGuard><SuperAdminDashboard /></SuperAdminGuard></ProtectedRoute>} />
            <Route path="/super-admin/users" element={<ProtectedRoute><SuperAdminGuard><SuperAdminUsers /></SuperAdminGuard></ProtectedRoute>} />
            <Route path="/super-admin/organizations" element={<ProtectedRoute><SuperAdminGuard><SuperAdminOrganizations /></SuperAdminGuard></ProtectedRoute>} />
            <Route path="/super-admin/billing" element={<ProtectedRoute><SuperAdminGuard><SuperAdminBilling /></SuperAdminGuard></ProtectedRoute>} />
            <Route path="/super-admin/plans" element={<ProtectedRoute><SuperAdminGuard><SuperAdminPlans /></SuperAdminGuard></ProtectedRoute>} />
            <Route path="/super-admin/certificates" element={<ProtectedRoute><SuperAdminGuard><SuperAdminCertificates /></SuperAdminGuard></ProtectedRoute>} />
            <Route path="/super-admin/templates" element={<ProtectedRoute><SuperAdminGuard><SuperAdminTemplates /></SuperAdminGuard></ProtectedRoute>} />
            <Route path="/super-admin/audit-logs" element={<ProtectedRoute><SuperAdminGuard><SuperAdminAuditLogs /></SuperAdminGuard></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
