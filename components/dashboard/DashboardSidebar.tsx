import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Home,
    FileVideo,
    CalendarDays,
    Layers,
    Users,
    LineChart,
    Settings,
    Tags,
    PlusCircle,
    CreditCard,
    FileText,
    Award,
    HelpCircle,
    GraduationCap,
    ClipboardCheck,
    FolderOpen,
    BarChart2,
    ShieldCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { User } from '../../types';

interface NavButtonProps {
    icon: any;
    label: string;
    isActive: boolean;
    onClick: () => void;
    colorClass?: string;
    isCollapsed?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({
    icon: Icon,
    label,
    isActive,
    onClick,
    colorClass = "text-ueu-blue",
    isCollapsed
}) => (
    <button
        onClick={onClick}
        title={isCollapsed ? label : undefined}
        className={cn(
            "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 group relative overflow-hidden uppercase tracking-widest text-[10px]",
            isActive
                ? "bg-ueu-blue/10 text-ueu-navy shadow-sm"
                : "text-slate-400 hover:bg-slate-50 hover:text-ueu-blue",
            isCollapsed ? "justify-center w-full px-2" : "w-full"
        )}
    >
        <Icon className={cn(
            "h-4 w-4 transition-transform duration-300 group-hover:scale-110 flex-shrink-0",
            isActive ? "text-ueu-blue" : "text-slate-300 group-hover:text-ueu-blue"
        )} />
        {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300 truncate">{label}</span>}
        {isActive && !isCollapsed && <div className="ml-auto w-1 h-3 rounded-full bg-ueu-blue animate-in slide-in-from-right-1 duration-300" />}
    </button>
);

export interface DashboardSidebarItem {
    id: string;
    label: string;
    icon: any;
}

export const getDashboardSidebarItems = (role: User['role']): DashboardSidebarItem[] => {
    const sidebarConfig: Array<{ role: User['role']; items: DashboardSidebarItem[] }> = [
        {
            role: 'student', items: [
                { id: 'overview', label: 'Beranda Utama', icon: Home },
                { id: 'courses', label: 'Mata Kuliah Saya', icon: BookOpen },
                { id: 'grades', label: 'Transkrip Nilai', icon: ClipboardCheck },
                { id: 'schedule', label: 'Jadwal Kuliah', icon: CalendarDays },
                { id: 'certificates', label: 'E-Sertifikat', icon: Award },
                { id: 'billing', label: 'Status Pembayaran', icon: FileText },
                { id: 'settings', label: 'Profil & Akun', icon: Settings }
            ]
        },
        {
            role: 'instructor', items: [
                { id: 'overview', label: 'Dasbor Dosen', icon: Home },
                { id: 'grading', label: 'Input Nilai', icon: GraduationCap },
                { id: 'courses', label: 'Mata Kuliah Diampu', icon: FileVideo },
                { id: 'questions', label: 'Manajemen Soal', icon: HelpCircle },
                { id: 'schedule', label: 'Jadwal Mengajar', icon: CalendarDays },
                { id: 'bundles', label: 'Paket Kurikulum', icon: Layers },
                { id: 'assets', label: 'Materi Ajar', icon: FolderOpen },
                { id: 'students', label: 'Daftar Mahasiswa', icon: Users },
                { id: 'analytics', label: 'Statistik Kelas', icon: LineChart },
                { id: 'settings', label: 'Pengaturan', icon: Settings }
            ]
        },
        {
            role: 'admin', items: [
                { id: 'overview', label: 'Dasbor Admin', icon: Home },
                { id: 'users', label: 'Manajemen Civitas', icon: Users },
                { id: 'courses', label: 'Kelola Kursus', icon: BookOpen },
                { id: 'progress', label: 'Monitoring Progres', icon: BarChart2 },
                { id: 'categories', label: 'Program Studi', icon: Tags },
                { id: 'assets', label: 'Pusat Aset Digital', icon: FolderOpen },
                { id: 'asset-permissions', label: 'Hak Akses Konten', icon: ShieldCheck },
                { id: 'transactions', label: 'Verifikasi Pembayaran', icon: CreditCard },
                { id: 'settings', label: 'Konfigurasi Sistem', icon: Settings }
            ]
        }
    ];

    return sidebarConfig.find(c => c.role === role)?.items || [];
};

interface DashboardSidebarProps {
    user: User;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isCollapsed: boolean;
    toggleCollapse: () => void;
    logout: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
    user,
    activeTab,
    setActiveTab,
    isCollapsed,
    toggleCollapse,
    logout
}) => {
    const navigate = useNavigate();

    const currentSidebar = getDashboardSidebarItems(user.role);

    return (
        <aside className={cn(
            "hidden bg-white border-r border-slate-100 lg:flex flex-col fixed inset-y-0 z-30 transition-all duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
            isCollapsed ? "w-24" : "w-72"
        )}>
            {/* Logo Area */}
            <div className={cn("h-24 flex items-center border-b border-slate-50", isCollapsed ? "justify-center px-0" : "px-6")}>
                <Link to="/" className="flex items-center transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ueu-blue/40 focus-visible:ring-offset-2 rounded-2xl">
                    <img
                        src={isCollapsed ? "/ueu-asu-mark.svg" : "/ueu-asu-logo.svg"}
                        alt="Universitas Esa Unggul powered by Arizona State University"
                        className={cn("w-auto", isCollapsed ? "h-11" : "h-14 max-w-[220px]")}
                    />
                </Link>
            </div>

            {/* Navigation Menu */}
            <div className="p-4 space-y-6 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                <div className="space-y-1.5">
                    {!isCollapsed && (
                        <p className="px-5 text-[9px] font-black text-slate-300 uppercase tracking-[3px] mb-6 mt-2">
                            Dashboard
                        </p>
                    )}
                    {currentSidebar.map((item) => (
                        <NavButton
                            key={item.id}
                            {...item}
                            isActive={activeTab === item.id}
                            isCollapsed={isCollapsed}
                            onClick={() => {
                                if (item.id === 'schedule') {
                                    navigate('/schedule');
                                } else {
                                    setActiveTab(item.id);
                                }
                            }}
                        />
                    ))}
                </div>

                {/* Instructor Action Button - Menggunakan Oranye Aksen UEU/Pathway */}
                {/* {user.role === 'instructor' && (
                    <div className={cn("mt-8", isCollapsed ? "flex justify-center" : "px-2")}>
                        <Button
                            onClick={() => setActiveTab('create_course')}
                            className={cn(
                                "bg-accent hover:bg-ueu-navy text-white shadow-xl shadow-orange-500/10 transition-all duration-500 rounded-2xl border-none h-14",
                                isCollapsed ? "w-12 h-12 p-0" : "w-full"
                            )}
                            title="Buat Mata Kuliah Baru"
                        >
                            <PlusCircle className={cn("h-5 w-5 flex-shrink-0 transition-transform group-hover:rotate-90", !isCollapsed && "mr-3")} />
                            {!isCollapsed && <span className="font-black text-[11px] uppercase tracking-widest">Tambah Kuliah</span>}
                        </Button>
                    </div>
                )} */}
            </div>

            {/* Footer & Toggle */}
            <div className="p-8 border-t border-slate-50 bg-slate-50/50 relative">
                {/* Modern Toggle Button */}
                <button
                    onClick={toggleCollapse}
                    className="absolute -right-3.5 top-[-14px] bg-white border border-slate-100 shadow-md rounded-full p-2 text-slate-300 hover:text-ueu-blue hover:border-ueu-blue transition-all lg:flex z-40 active:scale-90"
                >
                    {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                </button>

                {!isCollapsed && (
                    <div className="flex flex-col gap-1.5 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-[2px]">
                            Portal Akademik
                        </div>
                        <div className="text-[8px] text-ueu-blue font-black uppercase tracking-widest">
                            v2.4 • Universitas Esa Unggul
                        </div>
                    </div>
                )}

                {isCollapsed && (
                    <div className="flex justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-ueu-blue/30 animate-pulse" />
                    </div>
                )}
            </div>
        </aside>
    );
};