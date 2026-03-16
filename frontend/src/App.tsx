import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OptionalProtectedRoute } from "@/components/OptionalProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailLink from "./pages/VerifyEmailLink";
import ConfirmEmail from "./pages/ConfirmEmail";
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
            {/* Public routes - accessible by both authenticated and unauthenticated users */}
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<OptionalProtectedRoute><Pricing /></OptionalProtectedRoute>} />
            <Route path="/about" element={<OptionalProtectedRoute><About /></OptionalProtectedRoute>} />
            <Route path="/contact" element={<OptionalProtectedRoute><Contact /></OptionalProtectedRoute>} />
            <Route path="/blog" element={<OptionalProtectedRoute><Blog /></OptionalProtectedRoute>} />
            <Route path="/blog/:slug" element={<OptionalProtectedRoute><BlogPost /></OptionalProtectedRoute>} />
            <Route path="/team" element={<OptionalProtectedRoute><Team /></OptionalProtectedRoute>} />
            <Route path="/team/:slug" element={<OptionalProtectedRoute><TeamMember /></OptionalProtectedRoute>} />
            <Route path="/terms" element={<OptionalProtectedRoute><Terms /></OptionalProtectedRoute>} />
            <Route path="/privacy" element={<OptionalProtectedRoute><Privacy /></OptionalProtectedRoute>} />
            <Route path="/verify" element={<OptionalProtectedRoute><Verify /></OptionalProtectedRoute>} />
            <Route path="/certificate/:slug" element={<OptionalProtectedRoute><CertificatePublic /></OptionalProtectedRoute>} />
            <Route path="/testimonials" element={<OptionalProtectedRoute><Testimonials /></OptionalProtectedRoute>} />
            <Route path="/testimonials/:slug" element={<OptionalProtectedRoute><TestimonialDetail /></OptionalProtectedRoute>} />
            <Route path="/docs" element={<OptionalProtectedRoute><Docs /></OptionalProtectedRoute>} />
            <Route path="/docs/:slug" element={<OptionalProtectedRoute><Docs /></OptionalProtectedRoute>} />
            <Route path="/certificate-generator" element={<OptionalProtectedRoute><CertificateGenerator /></OptionalProtectedRoute>} />
            <Route path="/bulk-certificate-generator" element={<OptionalProtectedRoute><BulkCertificateGenerator /></OptionalProtectedRoute>} />
            <Route path="/verify-certificate-online" element={<OptionalProtectedRoute><VerifyCertificateOnline /></OptionalProtectedRoute>} />
            <Route path="/careers" element={<OptionalProtectedRoute><Careers /></OptionalProtectedRoute>} />
            <Route path="/checkout" element={<OptionalProtectedRoute><Checkout /></OptionalProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify-email-link" element={<VerifyEmailLink />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
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
