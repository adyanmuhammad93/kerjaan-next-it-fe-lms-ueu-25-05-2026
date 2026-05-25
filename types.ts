export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  instructor: string;
  instructorId: string;
  description: string;
  price: number;
  rating: number;
  ratingCount: number;
  thumbnailUrl: string;
  category: string;
  syllabus: Module[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  language?: string;
  learningObjectives?: string[];
  requirements?: string[];
  lastUpdated: string;
  isPublished?: boolean;
  approvalStatus?: 'draft' | 'pending' | 'approved' | 'rejected';
  instructorEmail?: string;
  lessonCount?: number;
  studentCount?: number;

  // Access Control
  accessType?: 'free' | 'paid' | 'code' | 'prerequisite' | 'date' | 'capacity' | 'approval';
  accessConfig?: {
    accessCode?: string;
    prerequisiteCourseId?: string;
    startDate?: string;
    maxSeats?: number;
  };

  // Certification Config
  certificateConfig?: {
    enabled: boolean;
    minScore?: number; // 0-100
    requireGradedAssignments?: boolean; // Assignments must be graded (not just submitted)
    enforcePerQuiz?: boolean; // Min score applies to EACH quiz, not average
    customTitle?: string; // e.g. "Certified React Developer"
    validityDays?: number; // 0 or undefined means lifetime
  };
}

export interface CourseAssignment {
  id: string;
  courseId: string;
  instructorId: string;
  assignedBy?: string;
  createdAt: string;
}

export interface Prerequisite {
  type: 'completion' | 'grade' | 'date';
  targetId?: string; // ID of the module or lesson required
  targetTitle?: string; // For UI display
  minScore?: number; // For 'grade' type
  date?: string; // For 'date' type (ISO string)
}

export interface Bundle {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  price: number;
  thumbnailUrl: string;
  isPublished: boolean;
  courses: Course[];
  courseCount?: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  orderIndex?: number;
  prerequisites?: Prerequisite[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'article' | 'assignment';
  content?: string;
  videoUrl?: string;
  isPublished?: boolean;
  orderIndex?: number;
  prerequisites?: Prerequisite[];
}

export interface Resource {
  id: string;
  lessonId: string;
  title: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}

export interface Submission {
  id: string;
  lessonId: string;
  userId: string;
  fileUrl?: string;
  content?: string;
  grade?: number;
  feedback?: string;
  submittedAt: string;
  updatedAt?: string;
}

export interface LiveClass {
  id: string;
  courseId: string;
  courseTitle?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  platform: 'google_meet' | 'zoom' | 'other';
  meetingUrl: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text';
  options: QuizOption[];
}

export interface QuizData {
  questions: QuizQuestion[];
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  enrolledCourseIds: string[];
  role: 'student' | 'instructor' | 'admin';
  admissionPeriodId?: string;
  programId?: string;
  geminiApiKey?: string;
}

export interface AdmissionPeriod {
  id: string;
  name: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  registrationOpen: boolean;
}

export interface Program {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
}

export interface Certificate {
  id: string;
  courseId: string;
  userId: string;
  issuedAt: string;
  verificationCode?: string;
  expiresAt?: string;
  revoked?: boolean;
  revokedReason?: string;
}

export interface CertificateWithCourse extends Certificate {
  courseTitle: string;
  courseThumbnail: string;
  instructorName: string;
  studentName?: string;
  customTitle?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

export interface CartItem {
  id: string;
  type: 'course' | 'bundle';
}

export type CurrencyCode = 'USD' | 'IDR';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  locale: string;
}

export interface TransactionItem {
  id: string;
  itemId: string;
  itemType: 'course' | 'bundle';
  title: string;
  price: number;
  priceCurrency?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  totalAmount: number;
  totalAmountCurrency?: number;
  currencyCode?: CurrencyCode;
  fxRateUsdIdr?: number;
  status: 'pending' | 'verified' | 'rejected';
  proofUrl?: string;
  createdAt: string;
  items?: TransactionItem[];
  paymentMethod?: 'manual' | 'bni_ecollection';
  gatewayTrxId?: string;
  virtualAccount?: string;
  billingType?: string;
  gatewayExpiresAt?: string;
  gatewayPaidAt?: string;
  paymentAmount?: number;
  cumulativePaymentAmount?: number;
  paymentNtb?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  lessonId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

export interface AssetFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdBy: string;
  visibility?: 'public' | 'private';
  createdAt: string;
}

export interface Asset {
  id: string;
  folderId: string | null;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdBy: string;
  visibility?: 'public' | 'private';
  createdAt: string;
}

export interface AssetShare {
  id: string;
  assetId: string | null;
  folderId: string | null;
  sharedWithUserId: string;
  sharedByUserId: string;
  permissions: string[];
  expiresAt: string | null;
  createdAt: string;
  sharedWithEmail?: string;
  sharedWithName?: string;
}

export const MOCK_COURSES: Course[] = [];
