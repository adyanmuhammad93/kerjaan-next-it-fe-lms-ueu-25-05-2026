
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, PieChart, Pie, Cell, Tooltip, Legend, CartesianGrid, XAxis, YAxis, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Calendar as CalendarIcon, Download, Loader2, ArrowRight, Star, Search, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Input } from '../../ui/Input';
import { format } from 'date-fns';
import { courseService } from '../../../services/courseService';
import { useAuth } from '../../../hooks/useAuth';
import { useCurrency } from '../../../hooks/useCurrency';
import { cn } from '../../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/Table";

interface StatsRowProps {
    stat: any;
    formatPrice: (price: number) => string;
}

const StatsRow: React.FC<StatsRowProps> = ({ stat, formatPrice }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50/50 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 gap-3">
        <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm truncate text-slate-800">{stat.title}</h4>
                <Badge variant={stat.is_published ? "outline" : "secondary"} className="text-[10px] h-5">
                    {stat.is_published ? 'Live' : 'Draft'}
                </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span>{stat.students} students</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 
                    {stat.rating} ({stat.ratingCount})
                </span>
            </div>
        </div>
        <div className="text-right flex items-center justify-between sm:block">
            <div className="font-bold text-slate-900">{formatPrice(stat.revenue)}</div>
            <div className="text-xs text-muted-foreground">{formatPrice(stat.price)} / sale</div>
        </div>
    </div>
);

export const InstructorAnalytics: React.FC = () => {
    const { user } = useAuth();
    const { formatPrice, convertPrice, currency } = useCurrency();
    const [stats, setStats] = useState<any[]>([]);
    const [userList, setUserList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReportOpen, setIsReportOpen] = useState(false);
    
    // Filter & Sort State
    const [filterQuery, setFilterQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'revenue', direction: 'desc' });

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const [statsData, enrollmentData] = await Promise.all([
                    courseService.getInstructorStats(user.id),
                    courseService.getEnrolledStudents(user.id)
                ]);
                setStats(statsData);
                setUserList(enrollmentData);
            } catch (e) { 
                console.error("Failed to load analytics", e); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchAnalytics();
    }, [user]);

    // Analytics Processing
    const analyticsData = useMemo(() => {
        if (!userList) return { chartData: [], pieData: [], categoryData: [] };

        const revenueByDate: Record<string, number> = {};
        const courseCounts: Record<string, number> = {};
        const categoryRevenue: Record<string, number> = {};

        // Process Enrollment Data
        userList.forEach((enrollment: any) => {
            const date = new Date(enrollment.enrolledAtISO).toISOString().split('T')[0];
            const convertedPrice = convertPrice(enrollment.price);
            revenueByDate[date] = (revenueByDate[date] || 0) + convertedPrice;
            courseCounts[enrollment.courseTitle] = (courseCounts[enrollment.courseTitle] || 0) + 1;
        });

        // Process Course Stats for Categories
        stats.forEach((course) => {
            const convertedRevenue = convertPrice(course.revenue);
            categoryRevenue[course.category] = (categoryRevenue[course.category] || 0) + convertedRevenue;
        });

        // Chart Data (Last 14 days)
        const chartData = [];
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = format(d, 'yyyy-MM-dd');
            const shortDate = format(d, 'MMM dd');
            chartData.push({
                date: shortDate,
                revenue: revenueByDate[dateStr] || 0
            });
        }

        // Pie Data (Top Courses by Volume)
        const pieData = Object.entries(courseCounts).map(([name, value], index) => ({
            name: name.length > 20 ? name.substring(0, 20) + '...' : name, 
            value,
            fill: ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#3b82f6'][index % 5]
        })).sort((a, b) => b.value - a.value).slice(0, 5);

        // Category Bar Data
        const categoryData = Object.entries(categoryRevenue).map(([name, value]) => ({
            name,
            revenue: value
        })).sort((a, b) => b.revenue - a.revenue);

        return { chartData, pieData, categoryData };
    }, [userList, stats, currency]); 

    // Sorted & Filtered Stats for Table
    const processedStats = useMemo(() => {
        let items = [...stats];
        
        if (filterQuery) {
            items = items.filter(s => 
                s.title.toLowerCase().includes(filterQuery.toLowerCase()) || 
                s.category.toLowerCase().includes(filterQuery.toLowerCase())
            );
        }

        if (sortConfig) {
            items.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return items;
    }, [stats, filterQuery, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleExport = () => {
        if (stats.length === 0) return;
        
        // Define headers
        const headers = ["Course Title", "Category", "Status", "Students", "Price (USD)", "Revenue (USD)", "Rating", "Rating Count"];
        
        // Map data to rows
        const rows = stats.map(s => [
            `"${s.title.replace(/"/g, '""')}"`,
            s.category,
            s.is_published ? "Published" : "Draft",
            s.students,
            s.price,
            s.revenue,
            s.rating,
            s.ratingCount
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        // Create Blob and download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `course_performance_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown className="h-3 w-3 ml-1 text-slate-400" />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp className="h-3 w-3 ml-1 text-primary" /> 
            : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

    return (
        <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-4 animate-in fade-in duration-500 min-h-screen bg-transparent">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#0078C1] bg-opacity-10 rounded-2xl">
                            <TrendingUp className="h-6 w-6 text-[#0078C1]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#003366]">Analitik Performa</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-0 sm:ml-12">Pantau pendapatan, pendaftaran, dan pencapaian kompetensi secara mendalam.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto h-11 rounded-xl border-slate-200 text-slate-600 font-bold bg-white shadow-sm hover:text-[#0078C1] transition-all">
                        <CalendarIcon className="mr-2 h-4 w-4" /> 14 Hari Terakhir
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto h-11 rounded-xl border-slate-200 text-slate-600 font-bold bg-white shadow-sm hover:text-[#0078C1] transition-all" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Ekspor Laporan
                    </Button>
                </div>
            </div>

            {/* Revenue Chart */}
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="p-4 sm:p-6 lg:p-8 pb-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl font-black text-[#003366]">Tren Pendapatan ({currency.code})</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Estimasi pendapatan bersih selama 14 hari terakhir.</CardDescription>
                        </div>
                        <div className="px-4 py-2 bg-[#E0F2FE] rounded-2xl">
                            <span className="text-[10px] font-black text-[#0078C1] uppercase tracking-widest block">Total Periode Ini</span>
                            <span className="text-lg font-black text-[#003366]">{formatPrice(analyticsData.chartData.reduce((acc, d) => acc + d.revenue, 0))}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="h-[320px] sm:h-[360px] lg:h-[400px] p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.chartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0078C1" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#0078C1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="date" 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                fontWeight="bold"
                                tickLine={false} 
                                axisLine={false} 
                                dy={10}
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                fontWeight="bold"
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(val) => `${currency.symbol}${val}`} 
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                                itemStyle={{ color: '#003366', fontWeight: '900' }}
                                labelStyle={{ fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}
                                formatter={(val: number) => [`${currency.symbol}${val.toFixed(2)}`, 'Pendapatan']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#0078C1" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Course Distribution Pie */}
                <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                    <CardHeader className="p-4 sm:p-6 lg:p-8 pb-0">
                        <CardTitle className="text-lg font-black text-[#003366]">Distribusi Pendaftaran</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">5 mata kuliah paling diminati.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] sm:h-[330px] lg:h-[350px] p-4 sm:p-6 lg:p-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analyticsData.pieData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="value"
                                    animationDuration={1500}
                                >
                                    {analyticsData.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#003366', '#0078C1', '#0EA5E9', '#38BDF8', '#7DD3FC'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend 
                                    layout="horizontal" 
                                    verticalAlign="bottom" 
                                    align="center" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Bar Chart */}
                <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                    <CardHeader className="p-4 sm:p-6 lg:p-8 pb-0">
                        <CardTitle className="text-lg font-black text-[#003366]">Volume per Kategori</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Topik materi dengan konversi tertinggi.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] sm:h-[330px] lg:h-[350px] p-4 sm:p-6 lg:p-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.categoryData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `${currency.symbol}${val}`} />
                                <YAxis dataKey="name" type="category" stroke="#003366" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} width={100} />
                                <Tooltip 
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(val: number) => [`${currency.symbol}${val.toFixed(2)}`, 'Pendapatan']}
                                />
                                <Bar dataKey="revenue" fill="#0078C1" radius={[0, 12, 12, 0]} barSize={28} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Metrics Table Summary */}
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="p-4 sm:p-6 lg:p-8 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-black text-[#003366]">Performa Mata Kuliah</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Metrik kunci untuk pengajaran yang efektif.</CardDescription>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-full text-[#0078C1] font-black uppercase tracking-widest text-[10px] hover:bg-[#E0F2FE]"
                            onClick={() => setIsReportOpen(true)}
                        >
                            Laporan Lengkap <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8">
                    <div className="grid gap-4">
                        {stats.slice(0, 5).map((stat, i) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#F8FAFC] rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h4 className="font-bold text-base text-[#003366] truncate group-hover:text-[#0078C1] transition-colors">{stat.title}</h4>
                                        <Badge className={cn(
                                            "rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-wider border-none",
                                            stat.is_published ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                                        )}>
                                            {stat.is_published ? 'Live' : 'Draft'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {stat.students} Mahasiswa</span>
                                        <span className="flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 
                                            {stat.rating} ({stat.ratingCount} Ulasan)
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex items-center justify-between sm:block">
                                    <div className="font-black text-lg text-[#003366]">{formatPrice(stat.revenue)}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{formatPrice(stat.price)} / Penjualan</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-[32px] border-none shadow-2xl">
                    <DialogHeader className="p-4 sm:p-6 lg:p-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-black text-[#003366]">Laporan Performa Komprehensif</DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">Analisis mendalam seluruh mata kuliah yang Anda ampu.</DialogDescription>
                            </div>
                            <Button size="sm" className="bg-[#003366] hover:bg-[#0078C1] text-white rounded-xl h-11 px-6 font-bold transition-all shadow-md" onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" /> CSV
                            </Button>
                        </div>
                    </DialogHeader>
                    
                    <div className="px-8 pb-4 flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Cari berdasarkan judul atau kategori..." 
                                className="pl-12 h-12 bg-[#F8FAFC] border-transparent focus:bg-white focus:border-[#0078C1] rounded-2xl font-medium" 
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                            />
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                             <div className="px-4 py-2 bg-[#F8FAFC] rounded-xl flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Akumulasi</span>
                                <span className="text-sm font-black text-[#003366]">{formatPrice(stats.reduce((acc, s) => acc + s.revenue, 0))}</span>
                             </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto px-8 pb-8">
                        <div className="border border-slate-100 rounded-[24px] overflow-hidden">
                            <Table>
                                <TableHeader className="bg-[#F8FAFC]">
                                    <TableRow className="border-none">
                                        <TableHead className="py-5 font-bold text-[#003366] cursor-pointer" onClick={() => handleSort('title')}>
                                            Mata Kuliah <SortIcon column="title" />
                                        </TableHead>
                                        <TableHead className="font-bold text-[#003366] cursor-pointer text-center" onClick={() => handleSort('category')}>
                                            Kategori <SortIcon column="category" />
                                        </TableHead>
                                        <TableHead className="font-bold text-[#003366] cursor-pointer text-center" onClick={() => handleSort('is_published')}>
                                            Status <SortIcon column="is_published" />
                                        </TableHead>
                                        <TableHead className="font-bold text-[#003366] cursor-pointer text-center" onClick={() => handleSort('students')}>
                                            Mahasiswa <SortIcon column="students" />
                                        </TableHead>
                                        <TableHead className="font-bold text-[#003366] cursor-pointer text-right" onClick={() => handleSort('revenue')}>
                                            Pendapatan <SortIcon column="revenue" />
                                        </TableHead>
                                        <TableHead className="font-bold text-[#003366] cursor-pointer text-right" onClick={() => handleSort('rating')}>
                                            Rating <SortIcon column="rating" />
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {processedStats.length > 0 ? (
                                        processedStats.map((stat) => (
                                            <TableRow key={stat.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                                                <TableCell className="py-4">
                                                    <div className="font-bold text-slate-900">{stat.title}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formatPrice(stat.price)} / Unit</div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-xs font-bold text-slate-600">{stat.category}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={cn(
                                                        "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border-none",
                                                        stat.is_published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {stat.is_published ? 'Published' : 'Draft'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-slate-700">{stat.students}</TableCell>
                                                <TableCell className="text-right font-black text-[#003366]">{formatPrice(stat.revenue)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <span className="font-black text-slate-900 text-sm">{stat.rating}</span>
                                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">({stat.ratingCount})</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-slate-400 font-medium italic">
                                                Tidak menemukan data yang sesuai.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
