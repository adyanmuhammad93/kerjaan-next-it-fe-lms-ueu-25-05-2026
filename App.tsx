import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { useAuth } from './hooks/useAuth';
import { useCourses } from './hooks/useCourses';
import { PageWrapper, LoadingScreen } from './components/layout/PageWrapper';
import { AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ImpersonationBanner } from './components/ImpersonationBanner';
import { settingsService } from './services/settingsService';
import { useStore } from './store/useStore';

// Lazy Loaded Pages
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Browse = React.lazy(() => import('./pages/Browse').then(module => ({ default: module.Browse })));
const CourseDetails = React.lazy(() => import('./pages/CourseDetails').then(module => ({ default: module.CourseDetails })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const EditCourse = React.lazy(() => import('./pages/EditCourse').then(module => ({ default: module.EditCourse })));
const Checkout = React.lazy(() => import('./pages/Checkout').then(module => ({ default: module.Checkout })));
const CoursePlayer = React.lazy(() => import('./pages/CoursePlayer').then(module => ({ default: module.CoursePlayer })));
const Certificate = React.lazy(() => import('./pages/Certificate').then(module => ({ default: module.Certificate })));
const VerifyCertificate = React.lazy(() => import('./pages/VerifyCertificate').then(module => ({ default: module.VerifyCertificate })));
const EditBundle = React.lazy(() => import('./pages/EditBundle').then(module => ({ default: module.EditBundle })));
const BundleDetails = React.lazy(() => import('./pages/BundleDetails').then(module => ({ default: module.BundleDetails })));
const Schedule = React.lazy(() => import('./pages/Schedule').then(module => ({ default: module.Schedule })));
const Invoice = React.lazy(() => import('./pages/Invoice').then(module => ({ default: module.Invoice })));
const BniPayment = React.lazy(() => import('./pages/BniPayment').then(module => ({ default: module.BniPayment })));
const AdmissionForm = React.lazy(() => import('./pages/AdmissionForm').then(module => ({ default: module.AdmissionForm })));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })));

const PageLoader = () => <LoadingScreen />;

// AppContent reads the shared loading state from AuthContext via useAuth()
const AppContent = () => {
    const { loading: authLoading } = useAuth();
    const { fetchCourses } = useCourses();
    const location = useLocation();
    const setFxRates = useStore((s) => s.setFxRates);

    const isAppLayout = location.pathname.startsWith('/dashboard') || 
                       location.pathname.startsWith('/instructor') || 
                       location.pathname.includes('/learn') ||
                       location.pathname.startsWith('/schedule');

    // PENTING: Gunakan array kosong [] untuk memastikan fetch hanya terjadi sekali saat mount.
    // Jika fetchCourses menyebabkan update store, dependency [fetchCourses] akan memicu loop.
    useEffect(() => {
        fetchCourses();
        (async () => {
            const fx = await settingsService.getSetting('fx_rates');
            const usd_idr = Number(fx?.usd_idr);
            if (Number.isFinite(usd_idr) && usd_idr > 0) {
                setFxRates({ usd_idr, updatedAt: fx?.updatedAt ?? fx?.updated_at ?? null });
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Failsafe: Pastikan pointer events dan scroll kembali normal setiap kali navigasi.
    // useEffect(() => {
    //     document.body.style.pointerEvents = 'auto';
    //     document.body.style.overflow = 'auto';
    // }, [location.pathname]);

    if (authLoading) {
        return <LoadingScreen />;
    }

    return (
        <Suspense fallback={<PageLoader />}>
            <div className="flex min-h-screen flex-col font-sans text-foreground bg-background">
                {!isAppLayout && <Navbar />}
                <main className="flex-1">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<Home />} />
                            <Route path="/browse" element={<Browse />} />
                            <Route path="/course/:id" element={<CourseDetails />} />
                            <Route path="/bundle/:id" element={<BundleDetails />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/admission" element={<AdmissionForm />} />
                            <Route path="/signup" element={<Navigate to="/admission" replace />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/verify" element={<VerifyCertificate />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/schedule" element={<Schedule />} />
                            <Route path="/invoice/:id" element={<Invoice />} />
                            <Route path="/payment/bni/:id" element={<BniPayment />} />
                            <Route path="/instructor/course/:courseId/edit" element={<EditCourse />} />
                            <Route path="/instructor/bundle/:bundleId/edit" element={<EditBundle />} />
                            <Route path="/course/:id/learn" element={<CoursePlayer />} />
                            <Route path="/certificate/:courseId" element={<Certificate />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </AnimatePresence>
                </main>
                {!isAppLayout && <Footer />}
            </div>
            <ImpersonationBanner />
        </Suspense>
    );
};

const App: React.FC = () => {
  return (
    // AuthProvider wraps everything — session restore happens ONCE here,
    // shared across all components via useAuth() / useAuthContext()
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
