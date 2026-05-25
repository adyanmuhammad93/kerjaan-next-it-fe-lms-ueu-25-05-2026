import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, BookOpen, Wallet, AlertCircle, ArrowUpRight, TrendingUp, CreditCard, Activity, GraduationCap 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { DashboardStatsCard } from '../DashboardStatsCard';
import { useStore } from '../../../store/useStore';
import { LoadingState } from '../../layout/PageWrapper';
import { authService } from '../../../services/authService';
import { paymentService } from '../../../services/paymentService';
import { useCurrency } from '../../../hooks/useCurrency';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';

export const AdminOverview: React.FC = () => {
    const { courses } = useStore();
    const { formatPrice, convertPrice, currency, formatAmount } = useCurrency();
    const [loading, setLoading] = useState(true);
    
    // State Management (Dipertahankan sesuai struktur asli)
    const [totalUsers, setTotalUsers] = useState(0);
    const [studentCount, setStudentCount] = useState(0);
    const [instructorCount, setInstructorCount] = useState(0);
    const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
    const [rawVerifiedTransactions, setRawVerifiedTransactions] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    // 1. Initial Data Fetch
    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [allUsers, students, instructors] = await Promise.all([
                    authService.getPaginatedUsers(1, 1, '', { role: 'all' }),
                    authService.getPaginatedUsers(1, 1, '', { role: 'student' }),
                    authService.getPaginatedUsers(1, 1, '', { role: 'instructor' }),
                ]);
                setTotalUsers(allUsers.total);
                setStudentCount(students.total);
                setInstructorCount(instructors.total);

                const [pendingTx, verifiedTx] = await Promise.all([
                    paymentService.getPendingTransactions(),
                    paymentService.getVerifiedTransactions()
                ]);
                setPendingTransactions(pendingTx);
                setRawVerifiedTransactions(verifiedTx);

            } catch (error) {
                console.error("Gagal memuat statistik admin", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // 2. Process Revenue Data
    useEffect(() => {
        if (loading) return;

        let totalRevUSD = rawVerifiedTransactions.reduce((acc, tx) => acc + Number(tx.totalAmount), 0);
        setTotalRevenue(convertPrice(totalRevUSD));

        const dailyRevenue: Record<string, number> = {};
        rawVerifiedTransactions.forEach(tx => {
            const amount = Number(tx.totalAmount);
            const date = new Date(tx.createdAt).toISOString().split('T')[0];
            dailyRevenue[date] = (dailyRevenue[date] || 0) + convertPrice(amount);
        });
        
        const chartData = [];
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = format(d, 'yyyy-MM-dd');
            chartData.push({
                date: format(d, 'dd MMM'),
                value: dailyRevenue[dateStr] || 0
            });
        }
        setRevenueData(chartData);

    }, [rawVerifiedTransactions, convertPrice, loading]);

    // Derived Data
    const pendingCourses = courses.filter(c => c.approvalStatus === 'pending');
    const totalPendingActions = pendingTransactions.length + pendingCourses.length;

    // Palet Warna: Berdasarkan Identitas UEU (Biru Utama & Navy)
    const userDistributionData = [
        { name: 'Mahasiswa', value: studentCount, color: '#0078C1' }, // ueu-blue
        { name: 'Dosen/Pengajar', value: instructorCount, color: '#F15A24' }, // accent (ueu-orange/pathway)
        { name: 'Admin', value: Math.max(0, totalUsers - studentCount - instructorCount), color: '#003366' } // ueu-navy
    ];

    if (loading) return <LoadingState message="Menyiapkan Dasbor Utama..." minHeight="min-h-[400px]" />;

    const displayTotalRevenue = formatAmount(totalRevenue, currency.code);

    return (
        <div className="space-y-8 min-h-screen bg-transparent">
            {/* Bagian Atas: Ringkasan Statistik */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardStatsCard 
                    title="Total Pendapatan" 
                    value={displayTotalRevenue} 
                    icon={Wallet} 
                    trend="+12% dari bulan lalu"
                    trendUp={true}
                    className="rounded-3xl border-none shadow-sm bg-white"
                />
                <DashboardStatsCard 
                    title="Civitas Akademika" 
                    value={totalUsers} 
                    icon={Users} 
                    trend={`${studentCount} Mahasiswa Terdaftar`}
                    className="rounded-3xl border-none shadow-sm bg-white"
                />
                <DashboardStatsCard 
                    title="Katalog Mata Kuliah" 
                    value={courses.length} 
                    icon={BookOpen} 
                    description={`${courses.filter(c => c.isPublished).length} Aktif, ${pendingCourses.length} Peninjauan`}
                    className="rounded-3xl border-none shadow-sm bg-white"
                />
                <DashboardStatsCard 
                    title="Verifikasi Perlu Tindakan" 
                    value={totalPendingActions} 
                    icon={AlertCircle} 
                    trend={totalPendingActions > 0 ? "Tindakan Diperlukan" : "Sistem Terkendali"}
                    trendUp={totalPendingActions === 0}
                    className={cn(
                        "rounded-3xl border-none shadow-sm bg-white",
                        totalPendingActions > 0 && "border-l-4 border-l-accent"
                    )}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Grafik Tren Arus Kas */}
                <Card className="lg:col-span-2 rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-8">
                        <div>
                            <CardTitle className="text-xl font-bold text-ueu-navy">Analisis Arus Kas</CardTitle>
                            <CardDescription className="text-slate-500">Pendapatan platform 14 hari terakhir ({currency.code})</CardDescription>
                        </div>
                        <TrendingUp className="h-6 w-6 text-ueu-blue" />
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0078C1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#0078C1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${currency.symbol}${val}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} 
                                    itemStyle={{ color: '#0078C1', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#0078C1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart Distribusi Civitas */}
                <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-ueu-navy">Komposisi Civitas</CardTitle>
                        <CardDescription className="text-slate-500">Proporsi peran pengguna</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[240px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={userDistributionData} 
                                    innerRadius={70} 
                                    outerRadius={90} 
                                    paddingAngle={8} 
                                    dataKey="value"
                                >
                                    {userDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-ueu-navy">{totalUsers}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-[2px] font-bold">Total</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 pt-0 px-6 pb-6">
                        {userDistributionData.map(item => (
                            <div key={item.name} className="flex items-center justify-between w-full p-2.5 bg-slate-50 rounded-xl border border-slate-100/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs font-bold text-slate-600">{item.name}</span>
                                </div>
                                <span className="text-xs font-black text-ueu-navy">{item.value}</span>
                            </div>
                        ))}
                    </CardFooter>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Antrean Pembayaran */}
                <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden border border-slate-100">
                    <CardHeader className="bg-[#F8FAFC] border-b border-slate-100">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-ueu-navy">
                                <CreditCard className="h-4 w-4 text-accent" /> 
                                Verifikasi Pembayaran
                            </CardTitle>
                            {pendingTransactions.length > 0 && <Badge className="bg-blue-50 text-ueu-blue border-none rounded-full px-3">{pendingTransactions.length} Baru</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {pendingTransactions.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 text-sm italic">
                                <Activity className="h-8 w-8 mx-auto mb-2 opacity-10" />
                                Belum ada transaksi yang tertunda.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {pendingTransactions.slice(0, 5).map((tx: any) => (
                                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-ueu-navy flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white group-hover:rotate-6 transition-transform">
                                                {tx.userName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{tx.userName}</p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{format(new Date(tx.createdAt), 'dd MMM yyyy')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-ueu-blue">{formatPrice(tx.totalAmount)}</p>
                                            <p className="text-[10px] uppercase font-black text-accent tracking-tighter italic">Validasi Diperlukan</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    {pendingTransactions.length > 0 && (
                        <CardFooter className="p-3 bg-[#F8FAFC]">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full text-xs text-ueu-blue hover:bg-ueu-blue/10 rounded-full font-bold transition-all"
                                onClick={() => {
                                    const event = new CustomEvent('navigate-dashboard', { detail: 'transactions' });
                                    window.dispatchEvent(event);
                                }}
                            >
                                Kelola Seluruh Transaksi <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                        </CardFooter>
                    )}
                </Card>

                {/* Peninjauan Mata Kuliah */}
                <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden border border-slate-100">
                    <CardHeader className="bg-[#F8FAFC] border-b border-slate-100">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-ueu-navy">
                                <BookOpen className="h-4 w-4 text-ueu-blue" /> 
                                Moderasi Mata Kuliah
                            </CardTitle>
                            {pendingCourses.length > 0 && <Badge className="bg-blue-50 text-ueu-blue border-none rounded-full px-3">{pendingCourses.length} Pengajuan</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {pendingCourses.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 text-sm italic">
                                <Activity className="h-8 w-8 mx-auto mb-2 opacity-10" />
                                Seluruh mata kuliah telah diverifikasi.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {pendingCourses.slice(0, 5).map(course => (
                                    <div key={course.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                                {course.thumbnailUrl && <img src={course.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={course.title} />}
                                            </div>
                                            <div className="min-w-0 max-w-[200px]">
                                                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-ueu-blue transition-colors">{course.title}</p>
                                                <p className="text-xs text-slate-500 truncate">Dosen: {course.instructor}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] rounded-full border-slate-200 text-ueu-blue bg-white px-3 font-bold uppercase">
                                            {course.category}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    {pendingCourses.length > 0 && (
                        <CardFooter className="p-3 bg-[#F8FAFC]">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full text-xs text-ueu-blue hover:bg-ueu-blue/10 rounded-full font-bold transition-all"
                                onClick={() => {
                                    const event = new CustomEvent('navigate-dashboard', { detail: 'courses' });
                                    window.dispatchEvent(event);
                                }}
                            >
                                Kelola Kurikulum <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
};
