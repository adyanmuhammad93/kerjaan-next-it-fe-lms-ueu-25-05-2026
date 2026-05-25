import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '../hooks/useCourses';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { generateCourseStructure } from '../services/geminiService';
import { useStore } from '../store/useStore';
import { Sparkles, Bot, ArrowRight, BookOpen, Layers, Target, Mic2, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { categoryService } from '../services/categoryService';
import { Category, User } from '../types';
import { TreeSelect } from './ui/TreeSelect';
import { useCurrency } from '../hooks/useCurrency';

interface CourseForm {
  title: string;
  description: string;
  category: string;
  price: number;
}

interface CreateCourseProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const CreateCourse: React.FC<CreateCourseProps> = ({ onSuccess, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const navigate = useNavigate();
  const { user } = useStore();

  return (
    <div className="max-w-2xl mx-auto w-full">
        <div className="flex p-2 bg-white/50 backdrop-blur-md rounded-[28px] border border-slate-100 shadow-xl shadow-blue-900/5 mb-10">
            <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 flex items-center justify-center gap-3 py-4 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 ${
                    activeTab === 'manual' 
                    ? 'bg-ueu-navy text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:text-ueu-navy hover:bg-white'
                }`}
            >
                <div className={cn("p-1.5 rounded-lg", activeTab === 'manual' ? "bg-white/10" : "bg-slate-100")}>
                    <BookOpen className="h-4 w-4" />
                </div>
                Buat Manual
            </button>
            <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 flex items-center justify-center gap-3 py-4 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 ${
                    activeTab === 'ai' 
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' 
                    : 'text-slate-400 hover:text-violet-600 hover:bg-white'
                }`}
            >
                <div className={cn("p-1.5 rounded-lg", activeTab === 'ai' ? "bg-white/10" : "bg-slate-100")}>
                    <Sparkles className="h-4 w-4" />
                </div>
                Asisten AI Studio
            </button>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === 'manual' ? (
                <ManualCreateForm onSuccess={onSuccess} onCancel={onCancel} />
            ) : (
                <AICreateForm user={user} onSuccess={onSuccess} onCancel={onCancel} navigate={navigate} />
            )}
        </div>
    </div>
  );
};

const ManualCreateForm: React.FC<CreateCourseProps> = ({ onSuccess, onCancel }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CourseForm>();
  const { createCourse } = useCourses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const { currency } = useCurrency();

  // Watch category value for the Combobox
  const selectedCategory = watch('category');
  const categoryTree = React.useMemo(() => categoryService.buildCategoryTree(categories), [categories]);

  useEffect(() => {
    categoryService.getCategories().then(data => setCategories(data.filter(c => c.status !== 'inactive'))).catch(console.error);
    // Register the field manually for validation since we use a custom component
    register('category', { required: 'Kategori wajib dipilih' });
  }, [register]);

  const onSubmit = async (data: CourseForm) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      await createCourse({
        title: data.title,
        description: data.description,
        price: Number(data.price),
        category: data.category,
        thumbnailUrl: `https://picsum.photos/400/225?random=${Math.floor(Math.random() * 100)}`,
        level: 'Beginner',
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Gagal membuat mata kuliah");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-xl rounded-[32px] overflow-hidden border">
        <CardHeader className="pt-10 pb-2 px-10">
            <CardTitle className="text-2xl font-black text-ueu-navy tracking-tight">Buat Mata Kuliah Baru</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Lengkapi detail di bawah ini untuk mempublikasikan mata kuliah Anda.</CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-10">
            {error && <p className="text-red-500 text-sm mb-4 font-bold">{error}</p>}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                <label className="text-[13px] font-bold text-ueu-navy ml-1">Judul Mata Kuliah</label>
                <Input 
                    {...register('title', { required: 'Judul wajib diisi' })} 
                    placeholder="Contoh: Strategi JavaScript Tingkat Lanjut"
                    className="h-14 rounded-2xl border-slate-200 focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-medium"
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                <label className="text-[13px] font-bold text-ueu-navy ml-1">Deskripsi</label>
                <textarea 
                    className="flex min-h-[140px] w-full rounded-2xl border border-slate-200 bg-background px-6 py-4 text-sm font-medium ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ueu-blue/5 focus-visible:border-ueu-blue disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    {...register('description', { required: 'Deskripsi wajib diisi' })}
                    placeholder="Apa yang akan dipelajari mahasiswa?"
                    rows={4}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[13px] font-bold text-ueu-navy ml-1">Kategori</label>
                    <TreeSelect 
                        data={categoryTree}
                        value={selectedCategory}
                        onChange={(val) => setValue('category', val, { shouldValidate: true })}
                        placeholder="Pilih kategori..."
                    />
                    {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-[13px] font-bold text-ueu-navy ml-1">Harga ({currency.code})</label>
                    <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0"
                        {...register('price', { required: true, min: 0 })} 
                        className="h-14 rounded-2xl border-slate-200 focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-medium"
                    />
                </div>
                </div>

                <div className="pt-6 flex gap-4">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onCancel} 
                        disabled={isSubmitting}
                        className="h-14 rounded-2xl px-10 border-slate-300 font-bold text-ueu-navy hover:bg-slate-50 transition-all border-2"
                    >
                        Batal
                    </Button>
                    <Button 
                        type="submit" 
                        className="flex-1 h-14 rounded-2xl bg-ueu-navy hover:bg-ueu-blue text-white font-bold text-base transition-all active:scale-95 shadow-xl shadow-blue-900/10" 
                        isLoading={isSubmitting}
                    >
                        Buat Mata Kuliah
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
};

interface AICreateFormProps {
    user: User | null;
    onSuccess: () => void;
    onCancel: () => void;
    navigate: (path: string) => void;
}

const AICreateForm: React.FC<AICreateFormProps> = ({ user, onSuccess, onCancel, navigate }) => {
    const [topic, setTopic] = useState('');
    const [audience, setAudience] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [tone, setTone] = useState('Professional');
    const [category, setCategory] = useState('');
    
    const [categories, setCategories] = useState<Category[]>([]);
    const categoryTree = React.useMemo(() => categoryService.buildCategoryTree(categories), [categories]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [generatedData, setGeneratedData] = useState<any>(null);
    const [error, setError] = useState('');
    const { generateCourse } = useCourses();
    const { formatPrice } = useCurrency();

    useEffect(() => {
        categoryService.getCategories().then(data => setCategories(data.filter(c => c.status !== 'inactive'))).catch(console.error);
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsGenerating(true);
        setError('');
        setGeneratedData(null);

        try {
            const data = await generateCourseStructure(topic, {
                audience,
                level,
                tone,
                category,
                apiKey: user?.geminiApiKey // Use user's key if available
            });
            setGeneratedData(data);
        } catch (err: any) {
            console.error(err);
            setError("Gagal menghasilkan mata kuliah. Coba gunakan topik lain.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateGenerated = async () => {
        if (!generatedData || !user) return;
        
        setIsCreating(true);
        try {
            const newCourse = await generateCourse(generatedData);
            navigate(`/instructor/course/${newCourse.id}/edit`);
        } catch (err: any) {
            console.error(err);
            setError("Gagal menyimpan mata kuliah ke database.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Card className="border-slate-200 shadow-xl rounded-[32px] overflow-hidden border">
            <CardHeader className="pt-10 pb-6 px-10 bg-slate-50/50">
                <div className="flex items-center gap-2 text-violet-600 mb-3 px-1">
                    <div className="p-1.5 bg-violet-100 rounded-lg">
                        <Bot className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-widest">Generator AI</span>
                </div>
                <CardTitle className="text-3xl font-black text-ueu-navy tracking-tight mb-2">Rancang Cepat, Bangun Tepat.</CardTitle>
                <CardDescription className="text-slate-500 font-medium leading-relaxed">
                    Jelaskan apa yang ingin Anda ajarkan, lalu sistem akan menghasilkan struktur mata kuliah lengkap, termasuk kurikulum, draf materi, dan estimasi harga.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-10">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {!generatedData ? (
                    <form onSubmit={handleGenerate} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[13px] font-bold text-ueu-navy ml-1">Apa topik utamanya?</label>
                            <div className="relative group">
                                <Input 
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Contoh: Panduan komprehensif Python untuk Data Science"
                                    className="h-16 text-lg rounded-2xl border-slate-200 pl-6 pr-14 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all font-medium placeholder:text-slate-400"
                                    autoFocus
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-violet-300 group-focus-within:text-violet-500 transition-colors">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-ueu-navy ml-1 flex items-center gap-2">
                                    <Target className="h-4 w-4 text-slate-400" /> Target Peserta
                                </label>
                                <Input 
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                    placeholder="Contoh: Pemula, Profesional Marketing"
                                    className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all px-6 font-medium placeholder:text-slate-300"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-ueu-navy ml-1 flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-slate-400" /> Kategori
                                </label>
                                <TreeSelect 
                                    data={categoryTree}
                                    value={category}
                                    onChange={setCategory}
                                    placeholder="Pilih kategori (opsional)..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-ueu-navy ml-1">Tingkat Kesulitan</label>
                                <div className="relative group">
                                    <select 
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                        className="flex h-14 w-full rounded-2xl border border-slate-200 bg-background px-6 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/5 focus-visible:border-violet-500 appearance-none transition-all text-ueu-navy"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="All Levels">All Levels</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none group-focus-within:text-violet-500 transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-ueu-navy ml-1 flex items-center gap-2">
                                    <Mic2 className="h-4 w-4 text-slate-400" /> Gaya Penyampaian
                                </label>
                                <div className="relative group">
                                    <select 
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value)}
                                        className="flex h-14 w-full rounded-2xl border border-slate-200 bg-background px-6 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/5 focus-visible:border-violet-500 appearance-none transition-all text-ueu-navy"
                                    >
                                        <option value="Professional">Professional & Formal</option>
                                        <option value="Encouraging">Encouraging & Supportive</option>
                                        <option value="Casual">Casual & Fun</option>
                                        <option value="Academic">Academic & Rigorous</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none group-focus-within:text-violet-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onCancel} 
                                disabled={isGenerating}
                                className="h-14 rounded-2xl px-10 border-slate-300 font-bold text-ueu-navy hover:bg-slate-50 transition-all border-2"
                            >
                                Batal
                            </Button>
                            <Button 
                                type="submit" 
                                className="h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold px-10 transition-all active:scale-95 shadow-xl shadow-violet-900/10 min-w-[200px]"
                                isLoading={isGenerating}
                            >
                                {isGenerating ? 'Menyusun...' : 'Generate Mata Kuliah'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="px-2 py-0.5 bg-violet-100 text-violet-600 text-[10px] font-black uppercase rounded-md tracking-wider">Pratinjau</div>
                                    </div>
                                    <h3 className="text-2xl font-black text-ueu-navy tracking-tight leading-tight">{generatedData.title}</h3>
                                    <p className="text-slate-500 font-medium mt-1">{generatedData.subtitle}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-violet-600">{formatPrice(generatedData.price)}</div>
                                    <div className="flex flex-col gap-1.5 items-end mt-2">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold bg-slate-100 px-2 py-1 rounded-lg tracking-wider">
                                            {generatedData.level}
                                        </div>
                                        {generatedData.category && (
                                            <div className="text-[10px] text-violet-600 uppercase font-bold bg-violet-50 px-2 py-1 rounded-lg tracking-wider">
                                                {generatedData.category}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-sm text-slate-700 bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 font-medium leading-relaxed italic">
                                "{generatedData.description}"
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-ueu-navy text-sm flex items-center gap-2 ml-1">
                                    <div className="p-1 bg-violet-100 rounded-md">
                                        <Layers className="h-3 w-3 text-violet-600" />
                                    </div>
                                    Kurikulum yang Diusulkan ({generatedData.modules?.length || 0} Modul)
                                </h4>
                                <div className="border border-slate-200 rounded-[28px] divide-y divide-slate-100 overflow-hidden max-h-[350px] overflow-y-auto bg-white shadow-sm shadow-slate-100/50">
                                    {generatedData.modules?.map((mod: any, i: number) => (
                                        <div key={i} className="p-6 hover:bg-slate-50/30 transition-colors">
                                            <div className="font-bold text-[13px] text-ueu-navy mb-3 flex items-center gap-3">
                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black">
                                                    {i + 1}
                                                </span>
                                                {mod.title}
                                            </div>
                                            <div className="pl-9 space-y-2">
                                                {mod.lessons?.map((lesson: any, j: number) => (
                                                    <div key={j} className="text-xs text-slate-500 flex items-center gap-3 py-1">
                                                        <div className="w-1 h-1 rounded-full bg-slate-200 flex-shrink-0"></div>
                                                        <span className="font-medium">{lesson.title}</span>
                                                        <span className="ml-auto text-[9px] uppercase border border-slate-100 text-slate-400 px-1.5 py-0.5 rounded-md font-bold tracking-tight bg-white flex items-center gap-1 shrink-0">
                                                            {lesson.type}
                                                            {lesson.content && (
                                                                <span className="text-green-500" title="Termasuk draf konten">•</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-8 border-t border-slate-100">
                            <Button 
                                variant="outline" 
                                onClick={() => setGeneratedData(null)} 
                                className="flex-1 h-14 rounded-2xl border-slate-300 font-bold text-ueu-navy hover:bg-slate-50 transition-all border-2"
                                disabled={isCreating}
                            >
                                Ulangi dari Awal
                            </Button>
                            <Button 
                                onClick={handleCreateGenerated} 
                                className="flex-[2] h-14 rounded-2xl bg-ueu-navy hover:bg-ueu-blue text-white font-bold text-base transition-all active:scale-95 shadow-xl shadow-blue-900/10"
                                isLoading={isCreating}
                            >
                                Sudah Sesuai, Buat Mata Kuliah <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
