
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  X, 
  Plus, 
  Package, 
  DollarSign, 
  Percent, 
  LayoutGrid, 
  MoreVertical,
  Trash2,
  ExternalLink,
  ImageIcon
} from 'lucide-react';
import { bundleService } from '../services/bundleService';
import { courseService } from '../services/courseService';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Bundle, Course } from '../types';
import { Combobox } from '../components/ui/Combobox';
import { cn } from '../lib/utils';
import { PageWrapper, LoadingScreen } from '../components/layout/PageWrapper';
import { useCurrency } from '../hooks/useCurrency';

export const EditBundle: React.FC = () => {
    const { bundleId } = useParams<{ bundleId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    
    // State
    const [bundle, setBundle] = useState<Bundle | null>(null);
    const [loading, setLoading] = useState(true);
    const [allInstructorCourses, setAllInstructorCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [addingCourse, setAddingCourse] = useState(false);
    
    // Form
    const { register, handleSubmit, formState: { isSubmitting }, reset, watch } = useForm({
        defaultValues: {
            title: '',
            description: '',
            price: 0,
            isPublished: false,
            thumbnailUrl: ''
        }
    });

    const watchedPrice = watch('price');

    // Fetch Data
    const initData = async () => {
        if (!bundleId || !user) return;
        try {
            const [b, courses] = await Promise.all([
                bundleService.getBundleById(bundleId),
                courseService.getAllCourses() // Optimization: In real app, create getInstructorCourses(id)
            ]);

            if (b) {
                setBundle(b);
                // Populate form
                reset({
                    title: b.title,
                    description: b.description,
                    price: b.price,
                    isPublished: b.isPublished,
                    thumbnailUrl: b.thumbnailUrl
                });
            }
            
            // Filter courses belonging to this instructor
            setAllInstructorCourses(courses.filter(c => c.instructorId === user.id));
        } catch (error) {
            console.error(error);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initData();
    }, [bundleId, user]);

    // Derived State: Available courses (All - Already In Bundle)
    const availableCourses = useMemo(() => {
        if (!bundle) return [];
        const existingIds = new Set(bundle.courses.map(c => c.id));
        return allInstructorCourses.filter(c => !existingIds.has(c.id));
    }, [allInstructorCourses, bundle]);

    // Derived State: Stats
    const totalValue = useMemo(() => {
        return bundle?.courses.reduce((acc, c) => acc + c.price, 0) || 0;
    }, [bundle]);

    const savings = totalValue > 0 ? totalValue - Number(watchedPrice || 0) : 0;
    const savingsPercent = totalValue > 0 ? Math.round((savings / totalValue) * 100) : 0;

    // Handlers
    const onSubmit = async (data: any) => {
        if (!bundleId) return;
        try {
            await bundleService.updateBundle(bundleId, {
                title: data.title,
                description: data.description,
                price: Number(data.price),
                isPublished: data.isPublished,
                thumbnailUrl: data.thumbnailUrl
            });
            // Update local state partially or refresh
            setBundle(prev => prev ? { ...prev, ...data, price: Number(data.price) } : null);
        } catch (error) {
            console.error(error);
            alert("Failed to save bundle");
        }
    };

    const handleAddCourse = async () => {
        if (!selectedCourseId || !bundleId) return;
        setAddingCourse(true);
        try {
            await bundleService.addCourseToBundle(bundleId, selectedCourseId);
            
            const addedCourse = allInstructorCourses.find(c => c.id === selectedCourseId);
            if (addedCourse) {
                setBundle(prev => prev ? { ...prev, courses: [...prev.courses, addedCourse] } : null);
            }
            setSelectedCourseId('');
        } catch (error) {
            console.error(error);
            alert("Failed to add course");
        } finally {
            setAddingCourse(false);
        }
    };

    const handleRemoveCourse = async (courseId: string) => {
        if (!bundleId) return;
        try {
             await bundleService.removeCourseFromBundle(bundleId, courseId);
             setBundle(prev => prev ? { ...prev, courses: prev.courses.filter(c => c.id !== courseId) } : null);
        } catch (error) {
            console.error(error);
            alert("Failed to remove course");
        }
    };

    const handleDeleteBundle = async () => {
        if (!bundleId || !window.confirm("Are you sure? This cannot be undone.")) return;
        try {
            await bundleService.deleteBundle(bundleId);
            navigate('/dashboard');
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <LoadingScreen />;
    if (!bundle) return null;

    return (
        <PageWrapper className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-500">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-indigo-600" />
                            <h1 className="font-bold text-lg hidden md:block">Edit Bundle</h1>
                            <Badge variant={bundle.isPublished ? "default" : "secondary"} className={cn("ml-2", bundle.isPublished ? "bg-green-600" : "")}>
                                {bundle.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDeleteBundle}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                        <Button type="submit" form="bundle-settings-form" isLoading={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: Settings (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bundle Settings</CardTitle>
                                <CardDescription>Basic information about this collection.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form id="bundle-settings-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Title</label>
                                        <Input {...register('title', { required: true })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description</label>
                                        <Textarea {...register('description')} rows={4} className="resize-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Thumbnail URL</label>
                                        <div className="flex gap-2">
                                            <Input {...register('thumbnailUrl')} placeholder="https://..." />
                                            {/* Future: Add Upload Button here similar to Course Editor */}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Bundle Price ($)</label>
                                        <Input type="number" step="0.01" {...register('price', { required: true, min: 0 })} />
                                    </div>
                                    <div className="pt-4 border-t">
                                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                            <input type="checkbox" {...register('isPublished')} className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                                            Publish Bundle to Marketplace
                                        </label>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Value Calculator Card */}
                        <Card className="bg-indigo-50 border-indigo-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium uppercase text-indigo-600 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" /> Value Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Total Content Value:</span>
                                    <span className="font-medium">{formatPrice(totalValue)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Bundle Price:</span>
                                    <span className="font-medium">{formatPrice(Number(watchedPrice))}</span>
                                </div>
                                <div className="border-t border-indigo-200 pt-2 flex justify-between items-center">
                                    <span className="font-bold text-indigo-900">Student Savings:</span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                                        {savingsPercent > 0 ? `${savingsPercent}% OFF` : '0%'}
                                    </Badge>
                                </div>
                                {savings < 0 && (
                                    <p className="text-xs text-red-500 mt-2">
                                        Warning: Bundle price is higher than buying courses individually.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Content (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Course List */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Included Courses</CardTitle>
                                    <CardDescription>{bundle.courses.length} courses included in this bundle</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                    <LayoutGrid className="h-4 w-4 text-slate-500 ml-2" />
                                    <span className="text-xs font-medium text-slate-600 pr-2">Grid View</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Add Course Control */}
                                <div className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-dashed">
                                    <div className="flex-1">
                                        <Combobox 
                                            options={availableCourses.map(c => ({ label: c.title, value: c.id }))}
                                            value={selectedCourseId}
                                            onChange={setSelectedCourseId}
                                            placeholder="Select a course to add..."
                                        />
                                    </div>
                                    <Button onClick={handleAddCourse} disabled={!selectedCourseId || addingCourse} className="shrink-0">
                                        {addingCourse ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                        Add Course
                                    </Button>
                                </div>

                                {/* List */}
                                <div className="space-y-3">
                                    {bundle.courses.length === 0 && (
                                        <div className="py-12 text-center flex flex-col items-center text-muted-foreground">
                                            <Package className="h-12 w-12 text-slate-200 mb-3" />
                                            <p>This bundle is empty.</p>
                                            <p className="text-sm">Add courses above to build your bundle.</p>
                                        </div>
                                    )}
                                    
                                    {bundle.courses.map((course, index) => (
                                        <div key={course.id} className="group relative flex items-center gap-4 p-3 bg-white border rounded-lg hover:shadow-sm transition-all animate-in slide-in-from-bottom-2">
                                            {/* Thumbnail */}
                                            <div className="h-16 w-24 bg-slate-100 rounded-md overflow-hidden shrink-0 border relative">
                                                {course.thumbnailUrl ? (
                                                    <img src={course.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon className="h-6 w-6 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm truncate">{course.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1">{course.category}</Badge>
                                                    <span>•</span>
                                                    <span>{course.level}</span>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="text-right px-4 border-r">
                                                <div className="text-sm font-bold">{formatPrice(course.price)}</div>
                                                <div className="text-[10px] text-muted-foreground">Individual Price</div>
                                            </div>

                                            {/* Actions */}
                                            <div className="pl-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleRemoveCourse(course.id)}
                                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                    title="Remove from bundle"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};
