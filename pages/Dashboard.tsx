
import React, { useState, useEffect, Suspense } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CreateCourse } from '../components/CreateCourse';
import {
    Menu,
    Search,
    Users,
    FileVideo,
    Loader2,
    ArrowRight,
    TrendingUp,
    DollarSign,
    BookOpen,
    Edit,
    ShoppingCart,
    Globe,
    Settings,
    LogOut,
    CheckCircle,
    XCircle,
    Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { courseService } from '../services/courseService';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../components/ui/Command";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "../components/ui/DropdownMenu";

// Static Imports (Critical for Layout/Initial Render)
import { DashboardSidebar, getDashboardSidebarItems } from '../components/dashboard/DashboardSidebar';
import { DashboardNotifications } from '../components/dashboard/DashboardNotifications';
import { DashboardStatsCard } from '../components/dashboard/DashboardStatsCard';
import { StudentCourseCard } from '../components/dashboard/StudentCourseCard';
import { useCurrency } from '../hooks/useCurrency';
import { PageWrapper, LoadingScreen, LoadingState } from '../components/layout/PageWrapper';
import { Notifications } from '../components/Notifications';

// Lazy Imports (Code Splitting)
const StudentOverview = React.lazy(() => import('../components/dashboard/student/StudentOverview').then(m => ({ default: m.StudentOverview })));
const InstructorAnalytics = React.lazy(() => import('../components/dashboard/instructor/InstructorAnalytics').then(m => ({ default: m.InstructorAnalytics })));
const InstructorBundles = React.lazy(() => import('../components/dashboard/instructor/InstructorBundles').then(m => ({ default: m.InstructorBundles })));
const QuestionBank = React.lazy(() => import('../components/dashboard/instructor/QuestionBank').then(m => ({ default: m.QuestionBank })));
const GradingDashboard = React.lazy(() => import('../components/dashboard/instructor/GradingDashboard').then(m => ({ default: m.GradingDashboard })));
const AdminOverview = React.lazy(() => import('../components/dashboard/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const AdminCategories = React.lazy(() => import('../components/dashboard/admin/AdminCategories').then(m => ({ default: m.AdminCategories })));
const AdminUsers = React.lazy(() => import('../components/dashboard/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminCourses = React.lazy(() => import('../components/dashboard/admin/AdminCourses').then(m => ({ default: m.AdminCourses })));
const AdminSettings = React.lazy(() => import('../components/dashboard/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminAssetPermissions = React.lazy(() => import('../components/dashboard/admin/AdminAssetPermissions').then(m => ({ default: m.AdminAssetPermissions })));
const AdminTransactions = React.lazy(() => import('../components/dashboard/admin/AdminTransactions').then(m => ({ default: m.AdminTransactions })));
const PaymentHistory = React.lazy(() => import('../components/dashboard/student/PaymentHistory').then(m => ({ default: m.PaymentHistory })));
const MyCertificates = React.lazy(() => import('../components/dashboard/student/MyCertificates').then(m => ({ default: m.MyCertificates })));
const StudentGrades = React.lazy(() => import('../components/dashboard/student/StudentGrades').then(m => ({ default: m.StudentGrades })));
const SettingsTab = React.lazy(() => import('../components/dashboard/SettingsTab').then(m => ({ default: m.SettingsTab })));
const AssetsRepository = React.lazy(() => import('../components/dashboard/instructor/AssetsRepository').then(m => ({ default: m.AssetsRepository })));
const StudentProgressReport = React.lazy(() => import('../components/dashboard/instructor/StudentProgressReport').then(m => ({ default: m.StudentProgressReport })));
const AdminStudentProgress = React.lazy(() => import('../components/dashboard/admin/AdminStudentProgress').then(m => ({ default: m.AdminStudentProgress })));

export const Dashboard: React.FC = () => {
    const { user, courses, cart } = useStore();
    const { logout } = useAuth();
    const { formatPrice, currency, setCurrency, allCurrencies } = useCurrency();
    const [activeTab, setActiveTab] = useState(localStorage.getItem('dashboardTab') || 'overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const navigate = useNavigate();

    // Command Palette
    const [open, setOpen] = useState(false);

    // Data States
    const [stats, setStats] = useState<any[]>([]);
    const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [userList, setUserList] = useState<any[]>([]);
    const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);

    // Persist tab selection
    useEffect(() => {
        localStorage.setItem('dashboardTab', activeTab);
    }, [activeTab]);

    // Listen for custom navigation events
    useEffect(() => {
        const handleNav = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail) setActiveTab(detail);
        };
        window.addEventListener('navigate-dashboard', handleNav);
        return () => window.removeEventListener('navigate-dashboard', handleNav);
    }, []);

    // Keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Initial Data Fetching for Dashboard Overview
    useEffect(() => {
        if (user && user.role === 'instructor' && activeTab === 'overview') {
            setStatsLoading(true);
            const fetchStats = async () => {
                try {
                    const [statsData, enrollmentData] = await Promise.all([
                        courseService.getInstructorStats(user.id),
                        courseService.getEnrolledStudents(user.id)
                    ]);
                    setStats(statsData);
                    setUserList(enrollmentData);
                    setRecentEnrollments(enrollmentData.filter((e: any) => !e.status || e.status === 'active').slice(0, 5)); // Top 5 recent active
                } catch (e) {
                    console.error("Failed to load analytics", e);
                } finally {
                    setStatsLoading(false);
                }
            };
            fetchStats();
        } else {
            setStatsLoading(false);
        }
    }, [user, activeTab]);

    // Tab Switching Fetching
    useEffect(() => {
        if (!user) return;

        if (user.role === 'instructor') {
            courseService.getInstructorAssignments(user.id)
                .then(setAssignedCourseIds)
                .catch(console.error);
        }

        if ((activeTab === 'students' || activeTab === 'courses') && user.role === 'instructor') {
            fetchStudents();
        }
    }, [activeTab, user]);

    const fetchStudents = async () => {
        if (!user) return;
        try {
            const data = await courseService.getEnrolledStudents(user.id);
            setUserList(data);
        } catch (e) { console.error(e); }
    };

    const handleEnrollmentAction = async (enrollmentId: string, status: 'active' | 'rejected') => {
        try {
            await courseService.updateEnrollmentStatus(enrollmentId, status);
            fetchStudents(); // Refresh list
        } catch (e) {
            alert("Action failed.");
        }
    };

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!user) return <Navigate to="/" />;

    const enrolledCourses = courses.filter(c => (user.enrolledCourseIds || []).includes(c.id));
    const createdCourses = courses.filter(c => c.instructorId === user.id || assignedCourseIds.includes(c.id));
    const mobileSidebarItems = getDashboardSidebarItems(user.role);

    const handleMobileSidebarItemClick = (tabId: string) => {
        setMobileMenuOpen(false);

        if (tabId === 'schedule') {
            navigate('/schedule');
            return;
        }

        setActiveTab(tabId);
    };

    // Stats Calculation for Instructor Overview
    const activeInstructorEnrollments = userList.filter((item: any) => !item.status || item.status === 'active');
    const uniqueInstructorStudentKeys = new Set(activeInstructorEnrollments.map((item: any) => item.studentId || item.email || item.id));
    const totalStudents = uniqueInstructorStudentKeys.size || stats.reduce((acc, curr) => acc + curr.students, 0);
    const totalRevenue = stats.reduce((acc, curr) => acc + curr.revenue, 0);
    const activeCoursesCount = createdCourses.filter(c => c.isPublished).length || stats.filter(c => c.is_published).length;

    const getCourseStudentCount = (courseId: string, courseTitle?: string) => {
        const matchingEnrollments = activeInstructorEnrollments.filter((item: any) => (
            item.courseId ? item.courseId === courseId : item.courseTitle === courseTitle
        ));
        return new Set(matchingEnrollments.map((item: any) => item.studentId || item.email || item.id)).size;
    };

    // --- Content Renderers ---

    const renderInstructorOverview = () => {
        if (statsLoading) return <LoadingState message="Menganalisis Data Pengajar..." minHeight="h-[400px]" />;

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardStatsCard
                        title="Total Pendapatan"
                        value={formatPrice(totalRevenue)}
                        icon={DollarSign}
                        trend="+12% dari bulan lalu"
                        trendUp={true}
                        className="rounded-3xl border-none shadow-sm bg-white"
                    />
                    <DashboardStatsCard
                        title="Total Siswa"
                        value={totalStudents}
                        icon={Users}
                        trend="Pertumbuhan Aktif"
                        className="rounded-3xl border-none shadow-sm bg-white"
                    />
                    <DashboardStatsCard
                        title="Kursus Aktif"
                        value={activeCoursesCount}
                        icon={FileVideo}
                        description={`${createdCourses.length} total kursus`}
                        className="rounded-3xl border-none shadow-sm bg-white"
                    />
                    <DashboardStatsCard
                        title="Rata-rata Rating"
                        value="4.8"
                        icon={TrendingUp}
                        trend="Kinerja Unggul"
                        trendUp={true}
                        className="rounded-3xl border-none shadow-sm bg-white"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-muted border-b border-slate-100 pb-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl font-bold text-ueu-navy">Pendaftaran Terbaru</CardTitle>
                                        <CardDescription className="text-muted-foreground">Siswa terbaru yang bergabung di kursus Anda</CardDescription>
                                    </div>
                                    <Users className="h-6 w-6 text-ueu-blue" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {recentEnrollments.length === 0 ? (
                                        <div className="p-12 text-center text-slate-400 text-sm italic">
                                            Belum ada pendaftaran terbaru.
                                        </div>
                                    ) : (
                                        recentEnrollments.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-ueu-navy flex items-center justify-center text-white font-bold text-sm">
                                                        {item.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                                        <p className="text-xs text-ueu-blue font-medium">{item.courseTitle}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-slate-900">{formatPrice(item.price)}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{item.enrolledAt}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                            {recentEnrollments.length > 0 && (
                                <CardFooter className="p-3 bg-muted">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs text-ueu-blue hover:bg-secondary rounded-full font-bold transition-all"
                                        onClick={() => setActiveTab('students')}
                                    >
                                        Lihat Seluruh Siswa <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    </div>
                    <div>
                        <DashboardNotifications />
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        // Admin Tabs
        if (user.role === 'admin') {
            switch (activeTab) {
                case 'overview': return <AdminOverview />;
                case 'users': return <AdminUsers />;
                case 'courses': return <AdminCourses />;
                case 'categories': return <AdminCategories />;
                case 'assets': return <AssetsRepository />;
                case 'asset-permissions': return <AdminAssetPermissions />;
                case 'transactions': return <AdminTransactions />;
                case 'progress': return <AdminStudentProgress />;
                case 'settings': return <AdminSettings />;
                case 'create_course': return <CreateCourse onSuccess={() => setActiveTab('courses')} onCancel={() => setActiveTab('courses')} />;
                default: return <AdminOverview />;
            }
        }

        // Instructor Tabs
        if (user.role === 'instructor') {
            switch (activeTab) {
                case 'overview': return renderInstructorOverview();
                case 'courses': return (
                    <div className="space-y-8 animate-in fade-in duration-500 min-h-screen">
                        {/* Header Section */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-ueu-blue/10 rounded-xl">
                                        <BookOpen className="h-6 w-6 text-ueu-blue" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-ueu-navy">Mata Kuliah Diampu</h2>
                                </div>
                                <p className="text-muted-foreground font-medium ml-12">
                                    Kelola semua kursus yang Anda ajarkan. Anda memiliki <span className="text-ueu-blue font-bold">{createdCourses.length}</span> mata kuliah aktif.
                                </p>
                            </div>
                            {/* <Button 
                                onClick={() => setActiveTab('create_course')}
                                className="bg-ueu-navy hover:bg-ueu-blue text-white rounded-xl h-12 px-6 shadow-md shadow-[#003366]/10 transition-all duration-300 flex items-center gap-2 font-bold"
                            >
                                <Plus className="h-5 w-5" /> Buat Mata Kuliah Baru
                            </Button> */}
                        </div>

                        {/* Grid View */}
                        {createdCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <BookOpen className="h-10 w-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Belum Ada Mata Kuliah</h3>
                                <p className="text-slate-500 mt-2 max-w-sm text-center">Mulai perjalanan mengajar Anda dengan membuat mata kuliah pertama hari ini.</p>
                                {/* <Button 
                                    variant="outline" 
                                    className="mt-8 rounded-full border-[#0078C1] text-[#0078C1] hover:bg-[#0078C1] hover:text-white px-8"
                                    onClick={() => setActiveTab('create_course')}
                                >
                                    Mulai Sekarang
                                </Button> */}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {createdCourses.map(course => (
                                    <div
                                        key={course.id}
                                        className="group bg-white rounded-[32px] overflow-hidden border border-slate-100 hover:shadow-[0_20px_50px_rgba(0,120,193,0.1)] transition-all duration-500 flex flex-col"
                                    >
                                        <div className="h-52 bg-slate-100 relative overflow-hidden">
                                            <img
                                                src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1501504905953-f8c97f2d5752?auto=format&fit=crop&q=80'}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                alt={course.title}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <div className="absolute top-4 left-4">
                                                <Badge className={cn(
                                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
                                                    course.isPublished
                                                        ? "bg-emerald-500 text-white"
                                                        : "bg-amber-500 text-white"
                                                )}>
                                                    {course.isPublished ? "Telah Berjalan" : "Draft Materi"}
                                                </Badge>
                                            </div>

                                            <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                                <div className="flex items-center gap-2 text-white/90 text-[10px] font-bold uppercase tracking-widest">
                                                    <Users className="h-3 w-3" />
                                                    <span>{getCourseStudentCount(course.id, course.title) || course.studentCount || 0} Mahasiswa Aktif</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-black text-[#0078C1] uppercase tracking-[2px]">
                                                    {course.category || 'Umum'}
                                                </span>
                                                <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                                                    <TrendingUp className="h-3 w-3" />
                                                    <span>POPULER</span>
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-lg text-[#003366] mb-4 line-clamp-2 leading-tight">
                                                {course.title}
                                            </h3>

                                            <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status Kurikulum</span>
                                                    <p className="text-xs font-bold text-slate-600">80% Selesai</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    className="rounded-full h-10 w-10 p-0 bg-slate-50 text-ueu-navy hover:bg-ueu-navy hover:text-white transition-all shadow-sm"
                                                    onClick={() => navigate(`/instructor/course/${course.id}/edit`)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
                case 'questions': return <QuestionBank />;
                case 'bundles': return <InstructorBundles />;
                case 'assets': return <AssetsRepository />;
                case 'grading': return <GradingDashboard />;
                case 'analytics': return <InstructorAnalytics />;
                // case 'create_course': return <CreateCourse onSuccess={() => setActiveTab('courses')} onCancel={() => setActiveTab('overview')} />;
                case 'students': return <StudentProgressReport />;
                case 'settings': return <SettingsTab />;
                default: return renderInstructorOverview();
            }
        }

        // Student Tabs (Default)
        switch (activeTab) {
            case 'overview': return <StudentOverview />;
            case 'courses': return (
                <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black tracking-tight text-ueu-navy">
                                Mata Kuliah <span className="text-ueu-blue">Saya</span>
                            </h1>
                            <p className="text-slate-500 font-medium text-lg">Kelola dan lanjutkan progres pembelajaran Anda di sini.</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-ueu-blue bg-ueu-blue/10 px-5 py-2.5 rounded-full shadow-sm">
                            <BookOpen className="h-5 w-5" />
                            <span>{enrolledCourses.length} Mata Kuliah Terdaftar</span>
                        </div>
                    </div>

                    {enrolledCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {enrolledCourses.map(course => (
                                <StudentCourseCard key={course.id} course={course} userId={user.id} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Search className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Belum ada mata kuliah</h3>
                            <p className="text-slate-500 max-w-sm text-center mb-10 font-medium">Anda belum terdaftar di mata kuliah apapun. Jelajahi katalog kami untuk memulai!</p>
                            <Button onClick={() => navigate('/browse')} className="bg-ueu-blue hover:bg-ueu-navy h-14 px-10 rounded-full font-black text-white shadow-xl shadow-blue-100 transition-all">
                                Lihat Semua Mata Kuliah
                            </Button>
                        </div>
                    )}
                </div>
            );
            case 'grades': return <StudentGrades />;
            case 'billing': return <PaymentHistory />;
            case 'certificates': return <MyCertificates />;
            case 'settings': return <SettingsTab />;
            default: return <StudentOverview />;
        }
    };

    return (
        <PageWrapper className="min-h-screen bg-slate-50 pb-32">
            <div className="flex min-h-screen bg-slate-50">
                {/* Sidebar */}
                <DashboardSidebar
                    user={user}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isCollapsed={isSidebarCollapsed}
                    toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    logout={logout}
                />

                {/* Main Content */}
                <div className={cn(
                    "flex-1 flex flex-col transition-all duration-300 ease-in-out",
                    isSidebarCollapsed ? "lg:ml-24" : "lg:ml-72"
                )}>
                    {/* Mobile Header */}
                    <header className="sticky top-0 z-20 h-20 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:hidden">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="text-ueu-navy hover:text-ueu-blue" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Buka menu dashboard">
                                <Menu className="h-6 w-6" aria-hidden="true" />
                            </Button>
                            <img
                                src="/ueu-asu-logo.svg"
                                alt="Universitas Esa Unggul powered by Arizona State University"
                                className="h-10 w-auto max-w-[180px]"
                            />
                        </div>

                        <div className="flex gap-4">
                        <Notifications />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 w-10 rounded-2xl bg-ueu-navy text-white hover:text-white hover:bg-ueu-navy flex items-center justify-center font-black text-xs overflow-hidden shadow-lg shadow-blue-900/10 p-0" aria-label="Buka menu akun">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        user.name.charAt(0).toUpperCase()
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-72 rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden p-0 mt-2">
                                <DropdownMenuLabel className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-black text-ueu-navy leading-none uppercase tracking-widest">{user.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 truncate mt-1">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <div className="p-2">
                                    <DropdownMenuItem onClick={() => setActiveTab('settings')} className="px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-ueu-navy hover:bg-ueu-blue/5 hover:text-ueu-blue cursor-pointer mb-1 transition-all">
                                        <Settings className="mr-3 h-4 w-4" />
                                        <span>Pengaturan</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={logout} className="px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer transition-all">
                                        <LogOut className="mr-3 h-4 w-4" />
                                        <span>Keluar Sesi</span>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                    </header>

                    {/* Desktop Header */}
                    <header className="hidden lg:flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 xl:px-12 py-4 xl:py-5 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-4 flex-1">
                            <Button
                                variant="outline"
                                className="relative h-12 w-full max-w-md justify-start rounded-2xl bg-slate-100/50 border-none text-slate-600 font-bold shadow-none hover:bg-ueu-blue/5 hover:text-ueu-navy focus-visible:ring-2 focus-visible:ring-ueu-blue/40 transition-all text-xs tracking-widest uppercase"
                                onClick={() => setOpen(true)}
                                aria-label="Buka pencarian cepat dashboard"
                            >
                                <Search className="mr-3 h-4 w-4 text-ueu-blue" aria-hidden="true" />
                                <span>Pencarian Cepat...</span>
                                <kbd className="pointer-events-none absolute right-3 top-3 hidden h-6 select-none items-center gap-1 rounded bg-white px-2 font-mono text-[9px] font-black opacity-100 sm:flex border border-slate-100 shadow-sm">
                                    <span className="text-[10px]">⌘</span>K
                                </kbd>
                            </Button>
                        </div>

                        <div className="flex items-center gap-6">

                            {/* Currency */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-2 text-ueu-navy hover:text-ueu-blue font-black uppercase text-[10px] tracking-widest px-4 py-2 hover:bg-ueu-blue/5 rounded-full transition-all" aria-label={`Pilih mata uang, saat ini ${currency.code}`}>
                                        <Globe className="h-4 w-4" aria-hidden="true" />
                                        <span>{currency.code}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl p-2 min-w-[120px]">
                                    {allCurrencies.map((c) => (
                                        <DropdownMenuItem key={c.code} onClick={() => setCurrency(c.code)} className="rounded-xl px-4 py-2.5 font-bold text-xs text-slate-600 focus:bg-ueu-blue focus:text-white cursor-pointer mb-1 last:mb-0 transition-all">
                                            <span>{c.code}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Cart */}
                            <Link to="/checkout">
                                <Button variant="ghost" size="icon" className="relative hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-2xl w-11 h-11 transition-all" aria-label={`Keranjang belanja, ${cart.length} item`}>
                                    <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                                    {cart.length > 0 && (
                                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-white animate-in zoom-in" />
                                    )}
                                </Button>
                            </Link>

                            <Notifications />

                            {/* Profile Dropdown */}
                            <div className="pl-6 border-l border-slate-100 ml-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-11 w-11 rounded-2xl overflow-hidden shadow-lg shadow-blue-900/5 hover:scale-105 active:scale-95 p-0 transition-all" aria-label="Buka menu akun">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full bg-ueu-navy text-white flex items-center justify-center font-black text-xs">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-72 rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden p-0 mt-2">
                                        <DropdownMenuLabel className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-black text-ueu-navy leading-none uppercase tracking-widest">{user.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 truncate mt-1">{user.email}</p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <div className="p-2">
                                            <DropdownMenuItem onClick={() => setActiveTab('settings')} className="px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-ueu-navy hover:bg-ueu-blue/5 hover:text-ueu-blue cursor-pointer mb-1 transition-all">
                                                <Settings className="mr-3 h-4 w-4" />
                                                <span>Pengaturan</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={logout} className="px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer transition-all">
                                                <LogOut className="mr-3 h-4 w-4" />
                                                <span>Keluar Sesi</span>
                                            </DropdownMenuItem>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </header>

                    {/* Mobile Sidebar Overlay */}
                    {mobileMenuOpen && (
                        <div className="fixed inset-0 z-50 bg-[#FEFBFF]/95 backdrop-blur-xl lg:hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-white">
                                <img
                                    src="/ueu-asu-logo.svg"
                                    alt="Universitas Esa Unggul powered by Arizona State University"
                                    className="h-12 w-auto max-w-[210px]"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-2xl h-11 px-4 font-black uppercase text-[10px] tracking-widest text-ueu-navy hover:bg-slate-100"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Tutup
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="rounded-[32px] bg-white border border-slate-100 p-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-ueu-navy text-white flex items-center justify-center font-black text-sm overflow-hidden shadow-lg shadow-blue-900/10">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                user.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-ueu-navy uppercase tracking-widest truncate">{user.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-300 px-2 mb-4">Navigasi Dashboard</p>
                                    {mobileSidebarItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = activeTab === item.id;

                                        return (
                                            <Button
                                                key={item.id}
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-start rounded-[24px] h-16 font-black text-[10px] uppercase tracking-widest transition-all",
                                                    isActive ? "bg-ueu-blue text-white shadow-xl shadow-blue-900/10" : "text-ueu-navy hover:bg-ueu-blue/5"
                                                )}
                                                onClick={() => handleMobileSidebarItemClick(item.id)}
                                            >
                                                <Icon className={cn("mr-4 h-5 w-5", isActive ? "text-white" : "text-accent")} />
                                                {item.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-100 text-center bg-white/70">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">© 2024 Esa Unggul University</p>
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    <main className="flex-1 px-3 sm:px-4 md:px-6 xl:px-10 py-4 sm:py-6 lg:py-8 overflow-x-hidden bg-slate-50/30">
                        <div className="max-w-7xl mx-auto h-full">
                            <Suspense fallback={<LoadingScreen />}>
                                {renderContent()}
                            </Suspense>
                        </div>
                    </main> 
                </div>

                {/* Command Palette */}
                <CommandDialog open={open} onOpenChange={setOpen}>
                    <CommandInput placeholder="Ketik perintah atau pencarian..." aria-label="Cari perintah dashboard" />
                    <CommandList>
                        <CommandEmpty>Hasil tidak ditemukan.</CommandEmpty>
                        <CommandGroup heading="Aksi Cepat">
                            <CommandItem onSelect={() => runCommand(() => setActiveTab('overview'))}>Buka Dashboard</CommandItem>
                            {(user.role === 'instructor' || user.role === 'admin') && (
                                <CommandItem onSelect={() => runCommand(() => setActiveTab('create_course'))}>Buat Kursus Baru</CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </CommandDialog>
            </div>
        </PageWrapper>
    );
};
