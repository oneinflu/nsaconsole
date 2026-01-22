import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import { Modal } from "../../components/ui/modal";
import DatePicker from "../../components/form/date-picker";
import { useNavigate } from "react-router";
import Switch from "../../components/form/switch/Switch";
import MultiSelect from "../../components/form/MultiSelect";
import TextArea from "../../components/form/input/TextArea";

type PaymentStatus = "Paid" | "Partial" | "Failed" | "Pending" | "Refunded";
type EnrollmentStatus = "Active" | "PendingPayment" | "Trial" | "Cancelled" | "Refunded" | "Transferred" | "Completed" | "Paused";

type Program = { id: string; name: string };
type CourseItem = { id: string; name: string; programId: string; programName: string };
type BatchItem = { id: string; name: string; code: string; courseId: string; programId: string; status: string; capacity?: number; studentsCount?: number; startDate?: number };

type EnrollmentItem = {
  id: string;
  studentName: string;
  email?: string;
  phone?: string;
  programId: string;
  programName: string;
  courseId: string;
  courseName: string;
  batchId?: string;
  batchName?: string;
  paymentStatus: PaymentStatus;
  paymentMode?: string;
  status: EnrollmentStatus;
  createdAt: number;
  basePrice?: number;
  offerPrice?: number;
  couponCode?: string;
  finalAmount?: number;
  amountPaidNow?: number;
  balanceDue?: number;
  dueDate?: number;
  sendPaymentLink?: boolean;
  accessStart?: number;
  accessDurationMonths?: number;
  notes?: string;
};

type CSVRow = Record<string, string>;

function readPrograms(): Program[] {
  try { const raw = localStorage.getItem("programs"); if (raw) return JSON.parse(raw) as Program[]; } catch (e) { void e; }
  return [ { id: "cpa-us", name: "CPA US" }, { id: "acca", name: "ACCA" } ];
}
function readCourses(): CourseItem[] {
  try { const raw = localStorage.getItem("courses"); if (raw) return JSON.parse(raw) as CourseItem[]; } catch (e) { void e; }
  return [
    { id: "far", name: "CPA US – FAR", programId: "cpa-us", programName: "CPA US" },
    { id: "cpa-full", name: "CPA US – Full Package", programId: "cpa-us", programName: "CPA US" },
    { id: "acca-skills", name: "ACCA – Skills", programId: "acca", programName: "ACCA" },
    { id: "mern", name: "MERN Bootcamp", programId: "coding", programName: "Coding" },
  ];
}
function readBatches(): BatchItem[] {
  try { const raw = localStorage.getItem("batches"); if (raw) return JSON.parse(raw) as BatchItem[]; } catch (e) { void e; }
  return [
    { id: "batch-far-jan-25", name: "FAR – Jan 2025", code: "FAR-JAN-25", courseId: "far", programId: "cpa-us", status: "Active" },
    { id: "batch-far-feb-25", name: "FAR – Feb 2025", code: "FAR-FEB-25", courseId: "far", programId: "cpa-us", status: "Enrolling" },
    { id: "batch-far-mar-25", name: "FAR – Mar 2025", code: "FAR-MAR-25", courseId: "far", programId: "cpa-us", status: "Enrolling" },
    { id: "batch-acca-skl-feb", name: "SKL – Feb", code: "SKL-FEB", courseId: "acca-skills", programId: "acca", status: "Completed" },
    { id: "batch-mern-c3", name: "Cohort 3", code: "MERN-C3", courseId: "mern", programId: "coding", status: "Active" },
  ];
}

function seedEnrollments(courses: CourseItem[], batches: BatchItem[]): EnrollmentItem[] {
  const now = Date.now();
  const farCourse = courses.find((c) => c.id === "far")!;
  const fullCourse = courses.find((c) => c.id === "cpa-full")!;
  const accaCourse = courses.find((c) => c.id === "acca-skills")!;
  const mernCourse = courses.find((c) => c.id === "mern")!;
  const farBatch = batches.find((b) => b.id === "batch-far-jan-25");
  const farBatchFeb = batches.find((b) => b.id === "batch-far-feb-25");
  const farBatchMar = batches.find((b) => b.id === "batch-far-mar-25");
  const sklBatch = batches.find((b) => b.id === "batch-acca-skl-feb");
  const mernBatch = batches.find((b) => b.id === "batch-mern-c3");
  return [
    { id: "enr-rahul", studentName: "Rahul Singh", email: "r@gmail.com", programId: farCourse.programId, programName: farCourse.programName, courseId: farCourse.id, courseName: farCourse.name, batchId: farBatch?.id, batchName: farBatch?.name, paymentStatus: "Paid", paymentMode: "Card", status: "Active", createdAt: now - 5 * 24 * 3600 * 1000 },
    { id: "enr-meera", studentName: "Meera Patel", email: "meera@outlook.com", programId: fullCourse.programId, programName: fullCourse.programName, courseId: fullCourse.id, courseName: fullCourse.name, batchId: farBatch?.id, batchName: farBatch?.code, paymentStatus: "Pending", paymentMode: "UPI", status: "PendingPayment", createdAt: now - 2 * 24 * 3600 * 1000 },
    { id: "enr-peter", studentName: "Peter Johnson", email: "peter@yahoo.com", programId: accaCourse.programId, programName: accaCourse.programName, courseId: accaCourse.id, courseName: accaCourse.name, batchId: sklBatch?.id, batchName: sklBatch?.code, paymentStatus: "Refunded", paymentMode: "Bank", status: "Cancelled", createdAt: now - 20 * 24 * 3600 * 1000 },
    { id: "enr-kiran", studentName: "Kiran Kumar", email: "k@outlook.com", programId: mernCourse.programId, programName: mernCourse.programName, courseId: mernCourse.id, courseName: mernCourse.name, batchId: mernBatch?.id, batchName: mernBatch?.name, paymentStatus: "Paid", paymentMode: "Cash", status: "Completed", createdAt: now - 40 * 24 * 3600 * 1000 },
    { id: "enr-ayesha", studentName: "Ayesha Khan", email: "ayesha@example.com", programId: farCourse.programId, programName: farCourse.programName, courseId: farCourse.id, courseName: farCourse.name, batchId: farBatchFeb?.id, batchName: farBatchFeb?.name, paymentStatus: "Partial", paymentMode: "Card", status: "Active", createdAt: now - 1 * 24 * 3600 * 1000 },
    { id: "enr-rohan", studentName: "Rohan Desai", email: "rohan@example.com", programId: farCourse.programId, programName: farCourse.programName, courseId: farCourse.id, courseName: farCourse.name, batchId: farBatchMar?.id, batchName: farBatchMar?.name, paymentStatus: "Pending", paymentMode: "UPI", status: "PendingPayment", createdAt: now - 12 * 24 * 3600 * 1000 },
    { id: "enr-sanjay", studentName: "Sanjay Mehta", email: "sanjay@proton.me", programId: farCourse.programId, programName: farCourse.programName, courseId: farCourse.id, courseName: farCourse.name, batchId: farBatchFeb?.id, batchName: farBatchFeb?.code, paymentStatus: "Partial", paymentMode: "Bank", status: "Active", createdAt: now - 8 * 24 * 3600 * 1000 },
    { id: "enr-priya", studentName: "Priya Sharma", email: "priya@gmail.com", programId: fullCourse.programId, programName: fullCourse.programName, courseId: fullCourse.id, courseName: fullCourse.name, batchId: farBatchMar?.id, batchName: farBatchMar?.code, paymentStatus: "Failed", paymentMode: "Card", status: "Trial", createdAt: now - 3 * 24 * 3600 * 1000 },
    { id: "enr-anita", studentName: "Anita Das", email: "anita@outlook.com", programId: accaCourse.programId, programName: accaCourse.programName, courseId: accaCourse.id, courseName: accaCourse.name, batchId: sklBatch?.id, batchName: sklBatch?.name, paymentStatus: "Pending", paymentMode: "UPI", status: "Transferred", createdAt: now - 18 * 24 * 3600 * 1000 },
    { id: "enr-vivek", studentName: "Vivek Rao", email: "vivek@yahoo.com", programId: mernCourse.programId, programName: mernCourse.programName, courseId: mernCourse.id, courseName: mernCourse.name, batchId: mernBatch?.id, batchName: mernBatch?.code, paymentStatus: "Paid", paymentMode: "Cash", status: "Active", createdAt: now - 7 * 24 * 3600 * 1000 },
  ];
}

function readEnrollments(): EnrollmentItem[] {
  try { const raw = localStorage.getItem("enrollments"); if (raw) return JSON.parse(raw) as EnrollmentItem[]; } catch (e) { void e; }
  const courses = readCourses();
  const batches = readBatches();
  return seedEnrollments(courses, batches);
}
function writeEnrollments(items: EnrollmentItem[]) { try { localStorage.setItem("enrollments", JSON.stringify(items)); } catch (e) { void e; } }

type StudentProfile = { id: string; name: string; email?: string; phone?: string; location?: string };
function readStudents(): StudentProfile[] {
  try { const raw = localStorage.getItem("students"); if (raw) return JSON.parse(raw) as StudentProfile[]; } catch (e) { void e; }
  try { const rawEnr = localStorage.getItem("enrollments"); if (rawEnr) { const arr = JSON.parse(rawEnr) as EnrollmentItem[]; const uniq: Record<string, StudentProfile> = {}; arr.forEach((e) => { const key = (e.email || e.phone || e.studentName).toLowerCase(); if (!uniq[key]) uniq[key] = { id: key, name: e.studentName, email: e.email, phone: e.phone }; }); return Object.values(uniq); } } catch (e) { void e; }
  return [ { id: "rahul", name: "Rahul Singh", email: "r@gmail.com" }, { id: "meera", name: "Meera Patel", email: "meera@outlook.com" } ];
}

export default function EnrollmentsPage() {
  const navigate = useNavigate();
  const programs = readPrograms();
  const courses = readCourses();
  const batches = readBatches();
  const students = readStudents();

  const [items, setItems] = useState<EnrollmentItem[]>([]);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<string | "All">("All");
  const [courseFilter, setCourseFilter] = useState<string | "All">("All");
  const [batchFilter, setBatchFilter] = useState<string | "All">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | EnrollmentStatus>("All");
  const [paymentModeFilter] = useState<string | "All">("All");
  const [paymentStatusFilter] = useState<"All" | PaymentStatus>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importRows, setImportRows] = useState<CSVRow[]>([]);

  const [dStudentName, setDStudentName] = useState("");
  const [dEmail, setDEmail] = useState("");
  const [dPhone, setDPhone] = useState("");
  const [dLocation, setDLocation] = useState("");
  const [dStudentSearch, setDStudentSearch] = useState("");
  const [dSelectedStudentId, setDSelectedStudentId] = useState<string | null>(null);
  const [dCreateNewStudent, setDCreateNewStudent] = useState(false);
  const [dProgramId, setDProgramId] = useState<string>(programs[0]?.id || "");
  const [dCourseId, setDCourseId] = useState<string>(courses[0]?.id || "");
  const [dCourseIds, setDCourseIds] = useState<string[]>([]);
  const [dBatchId, setDBatchId] = useState<string>(batches[0]?.id || "");
  const [dProductType, setDProductType] = useState<"Course" | "MultipleCourses" | "Package">("Course");
  const [dPaymentStatus, setDPaymentStatus] = useState<PaymentStatus>("Pending");
  const [dPaymentMode, setDPaymentMode] = useState<string>("Card");
  const [dStatus, setDStatus] = useState<EnrollmentStatus>("PendingPayment");
  const [dBasePrice, setDBasePrice] = useState<number>(24999);
  const [dOfferPrice, setDOfferPrice] = useState<number>(19999);
  const [dCouponCode, setDCouponCode] = useState<string>("");
  const [dFinalAmount, setDFinalAmount] = useState<number>(18499);
  const [dSendLink, setDSendLink] = useState<boolean>(false);
  const [dAllowPartial, setDAllowPartial] = useState<boolean>(false);
  const [dAmountPaidNow, setDAmountPaidNow] = useState<number>(0);
  const [dBalanceDue, setDBalanceDue] = useState<number>(18499);
  const [dDueDate, setDDueDate] = useState<number | null>(null);
  const [dAccessStart, setDAccessStart] = useState<number | null>(Date.now());
  const [dAccessMode, setDAccessMode] = useState<"Default" | "Custom">("Default");
  const [dAccessMonths, setDAccessMonths] = useState<number>(6);
  const [dNotes, setDNotes] = useState<string>("");

  useEffect(() => { setItems(readEnrollments()); }, []);

  useEffect(() => {
    const base = dBasePrice;
    const offer = dOfferPrice;
    let final = offer || base;
    if (dCouponCode.trim().toUpperCase() === "DIWALI") final = Math.max(final - 1500, 0);
    setDFinalAmount(final);
    const paid = dAmountPaidNow || 0;
    setDBalanceDue(Math.max(final - paid, 0));
    const pStatus: PaymentStatus = paid >= final ? "Paid" : paid > 0 ? "Partial" : "Pending";
    setDPaymentStatus(pStatus);
    const eStatus: EnrollmentStatus = pStatus === "Paid" ? "Active" : "PendingPayment";
    setDStatus(eStatus);
  }, [dBasePrice, dOfferPrice, dCouponCode, dAmountPaidNow]);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    return items.filter((e) => {
      const matchTxt = txt ? [e.studentName, e.email || "", e.courseName, e.batchName || ""].some((v) => v.toLowerCase().includes(txt)) : true;
      const matchProg = programFilter === "All" ? true : e.programId === programFilter;
      const matchCourse = courseFilter === "All" ? true : e.courseId === courseFilter;
      const matchBatch = batchFilter === "All" ? true : e.batchId === batchFilter;
      const matchStatus = statusFilter === "All" ? true : e.status === statusFilter;
      const matchPayMode = paymentModeFilter === "All" ? true : (e.paymentMode || "") === paymentModeFilter;
      const matchPayStatus = paymentStatusFilter === "All" ? true : e.paymentStatus === paymentStatusFilter;
      return matchTxt && matchProg && matchCourse && matchBatch && matchStatus && matchPayMode && matchPayStatus;
    });
  }, [items, search, programFilter, courseFilter, batchFilter, statusFilter, paymentModeFilter, paymentStatusFilter]);

  const enrollStudent = () => {
    const name = dStudentName.trim();
    if (!name) return;
    const selectedCourses = dProductType === "MultipleCourses" ? (dCourseIds.length ? dCourseIds : (dCourseId ? [dCourseId] : [])) : [dCourseId];
    if (!selectedCourses.length) return;
    const created: EnrollmentItem[] = [];
    selectedCourses.forEach((cid) => {
      const course = courses.find((c) => c.id === cid);
      const program = programs.find((p) => p.id === (course?.programId || dProgramId));
      const batch = batches.find((b) => b.id === dBatchId);
      const id = `enr-${Date.now()}-${cid}`;
      const item: EnrollmentItem = {
        id,
        studentName: name,
        email: dEmail || undefined,
        phone: dPhone || undefined,
        programId: program?.id || "",
        programName: program?.name || "",
        courseId: cid,
        courseName: course?.name || cid,
        batchId: batch?.id,
        batchName: batch?.name || batch?.code,
        paymentStatus: dPaymentStatus,
        paymentMode: dPaymentMode,
        status: dStatus,
        createdAt: Date.now(),
        basePrice: dBasePrice,
        offerPrice: dOfferPrice,
        couponCode: dCouponCode || undefined,
        finalAmount: dFinalAmount,
        amountPaidNow: dAmountPaidNow,
        balanceDue: dBalanceDue,
        dueDate: dDueDate || undefined,
        sendPaymentLink: dSendLink,
        accessStart: dAccessStart || undefined,
        accessDurationMonths: dAccessMode === "Custom" ? dAccessMonths : undefined,
        notes: dNotes || undefined,
      };
      created.push(item);
    });
    setItems((prev) => { const next = [...created, ...prev]; writeEnrollments(next); return next; });
    setIsDrawerOpen(false);
  };

  const markPaid = (id: string) => { setItems((prev) => { const next = prev.map((e) => (e.id === id ? { ...e, paymentStatus: "Paid" as PaymentStatus, status: "Active" as EnrollmentStatus } : e)); writeEnrollments(next); return next; }); };
  const cancelEnrollment = (id: string) => { setItems((prev) => { const next = prev.map((e) => (e.id === id ? { ...e, status: "Cancelled" as EnrollmentStatus } : e)); writeEnrollments(next); return next; }); };
  const refundEnrollment = (id: string) => { setItems((prev) => { const next = prev.map((e) => (e.id === id ? { ...e, paymentStatus: "Refunded" as PaymentStatus, status: "Refunded" as EnrollmentStatus } : e)); writeEnrollments(next); return next; }); };
  const openTransfer = (id: string) => { setTransferId(id); setIsTransferOpen(true); };
  const openEditEnrollment = (e: EnrollmentItem) => {
    setEditId(e.id);
    setDStudentName(e.studentName);
    setDEmail(e.email || "");
    setDPhone(e.phone || "");
    setDProgramId(e.programId);
    setDCourseId(e.courseId);
    setDBatchId(e.batchId || batches[0]?.id || "");
    setDStatus(e.status);
    setDPaymentStatus(e.paymentStatus);
    setIsEditOpen(true);
  };
  const saveEditEnrollment = () => {
    const id = editId; if (!id) return;
    setItems((prev) => { const next = prev.map((x) => (x.id === id ? { ...x, courseId: dCourseId, courseName: courses.find(c=>c.id===dCourseId)?.name || dCourseId, batchId: dBatchId, batchName: batches.find(b=>b.id===dBatchId)?.name || dBatchId, status: dStatus, paymentStatus: dPaymentStatus, accessDurationMonths: dAccessMonths, notes: dNotes || x.notes } : x)); writeEnrollments(next); return next; });
    setIsEditOpen(false);
  };
  const executeTransfer = () => {
    if (!transferId) return; const batch = batches.find((b) => b.id === dBatchId);
    setItems((prev) => { const next = prev.map((e) => (e.id === transferId ? { ...e, batchId: batch?.id, batchName: batch?.name || batch?.code, status: "Transferred" as EnrollmentStatus } : e)); writeEnrollments(next); return next; });
    setIsTransferOpen(false);
    setTransferId(null);
  };

  return (
    <>
      <PageMeta title="Enrollments" description="Manage student enrollments, payments, batches, and progress" />
      <PageBreadcrumb pageTitle="Enrollments" />
      <ComponentCard title="Enrollments">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-xl">
              <Input placeholder="Search students" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>Import Enrollments CSV</Button>
              <Select options={[{ value: "All", label: "All Programs" }, ...programs.map((p) => ({ value: p.id, label: p.name }))]} defaultValue={programFilter} onChange={(v) => setProgramFilter(v as typeof programFilter)} />
              <Select options={[{ value: "All", label: "All Courses" }, ...courses.map((c) => ({ value: c.id, label: c.name }))]} defaultValue={courseFilter} onChange={(v) => setCourseFilter(v as typeof courseFilter)} />
              <Select options={[{ value: "All", label: "All Batches" }, ...batches.map((b) => ({ value: b.id, label: b.name }))]} defaultValue={batchFilter} onChange={(v) => setBatchFilter(v as typeof batchFilter)} />
              <Select options={[{ value: "All", label: "All Status" }, { value: "Active", label: "Enrolled" }, { value: "PendingPayment", label: "Pending Payment" }, { value: "Trial", label: "Trial / Preview" }, { value: "Cancelled", label: "Cancelled" }, { value: "Refunded", label: "Refunded" }, { value: "Transferred", label: "Transferred" }, { value: "Completed", label: "Completed" }]} defaultValue={statusFilter} onChange={(v) => setStatusFilter(v as typeof statusFilter)} />
              <Button onClick={() => setIsDrawerOpen(true)}>Enroll Student</Button>
            </div>
          </div>

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-3xl">🎓</div>
              <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">No enrollments yet.</div>
              <div className="mt-1 text-theme-xs text-gray-500">Enroll students into courses or import from CSV.</div>
              <div className="mt-4"><Button onClick={() => setIsDrawerOpen(true)}>+ Enroll Student</Button></div>
            </div>
          )}

          {items.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Student</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Course / Package</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Batch</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Payment Status</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Enrollment Status</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {filtered.map((e) => (
                      <TableRow key={e.id} className="transition hover:bg-gray-50">
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          <button className="underline decoration-dotted" onClick={() => navigate(`/enrollments/${e.id}`)}>{e.studentName}</button>
                          {e.email && (<span className="ml-2 text-theme-xs text-gray-500">{e.email}</span>)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{e.courseName}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{e.batchName || "-"}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          {e.paymentStatus === "Paid" ? (<span className="inline-flex items-center text-success-600">• Paid</span>) : e.paymentStatus === "Partial" ? (<span className="inline-flex items-center text-brand-600">• Partial</span>) : e.paymentStatus === "Refunded" ? (<span className="inline-flex items-center text-gray-400">• Refunded</span>) : e.paymentStatus === "Failed" ? (<span className="inline-flex items-center text-error-600">• Failed</span>) : (<span className="inline-flex items-center text-warning-600">• Pending</span>)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          {e.status === "Active" ? (<span className="inline-flex items-center text-success-600">• Active</span>) : e.status === "PendingPayment" ? (<span className="inline-flex items-center text-warning-600">• Pending Payment</span>) : e.status === "Trial" ? (<span className="inline-flex items-center text-brand-600">• Trial</span>) : e.status === "Cancelled" ? (<span className="inline-flex items-center text-error-600">• Cancelled</span>) : e.status === "Refunded" ? (<span className="inline-flex items-center text-gray-400">• Refunded</span>) : e.status === "Transferred" ? (<span className="inline-flex items-center text-theme-xs text-gray-600">• Transferred</span>) : (<span className="inline-flex items-center text-theme-xs text-gray-600">• Completed</span>)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="relative">
                            <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === e.id ? null : e.id))}>⋮</button>
                            <Dropdown isOpen={openMenuId === e.id} onClose={() => setOpenMenuId(null)}>
                              <DropdownItem onClick={() => { setOpenMenuId(null); navigate(`/enrollments/${e.id}`); }}>View Enrollment</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); openEditEnrollment(e); }}>Edit Enrollment</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); openTransfer(e.id); }}>Transfer to Another Batch</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); }}>Upgrade / Downgrade Package</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); markPaid(e.id); }}>Mark as Paid</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); }}>Send Payment Link</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); cancelEnrollment(e.id); }}>Cancel Enrollment</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); refundEnrollment(e.id); }}>Refund Enrollment</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); }}>View Activity Log</DropdownItem>
                            </Dropdown>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </ComponentCard>

      <Modal isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} isFullscreen>
        <div className="fixed inset-0 flex justify-end">
          <div className="flex-1" onClick={() => setIsDrawerOpen(false)} />
          <div className="h-full w-full max-w-3xl bg-white shadow-2xl dark:bg-gray-900 animate-[slideIn_0.28s_ease-out]">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={() => setIsDrawerOpen(false)}>←</button>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Create Enrollment</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={enrollStudent}>Save Draft</Button>
                <Button onClick={enrollStudent}>Create Enrollment</Button>
              </div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
                <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Student Selection</div>
                  <div className="mt-2 text-theme-xs text-gray-500">{dSelectedStudentId ? "Existing student selected" : dCreateNewStudent ? "Creating new student" : "Select or create a student"}</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input placeholder="Search existing student" value={dStudentSearch} onChange={(e) => setDStudentSearch(e.target.value)} />
                      {dStudentSearch.trim() && (
                        <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-800">
                          {students.filter((s) => s.name.toLowerCase().includes(dStudentSearch.toLowerCase()) || (s.email || "").toLowerCase().includes(dStudentSearch.toLowerCase()) || (s.phone || "").includes(dStudentSearch)).slice(0,5).map((s) => (
                            <button key={s.id} onClick={() => { setDSelectedStudentId(s.id); setDStudentName(s.name); setDEmail(s.email || ""); setDPhone(s.phone || ""); setDCreateNewStudent(false); }} className="flex w-full items-center justify-between px-3 py-2 text-left">
                              <span className="text-theme-sm text-gray-800 dark:text-white/90">{s.name}</span>
                              <span className="text-theme-xs text-gray-500">{s.email || s.phone || ""}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Button variant="outline" onClick={() => { setDCreateNewStudent(true); setDSelectedStudentId(null); }}>+ Create New Student</Button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-theme-xs text-gray-600">Name</div>
                      <Input value={dStudentName} onChange={(e) => setDStudentName(e.target.value)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Email</div>
                      <Input value={dEmail} onChange={(e) => setDEmail(e.target.value)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Mobile</div>
                      <Input value={dPhone} onChange={(e) => setDPhone(e.target.value)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Location</div>
                      <Input value={dLocation} onChange={(e) => setDLocation(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Product Selection</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                      <div className="text-theme-sm text-gray-800 dark:text-white/90">Course</div>
                      <Switch label="" defaultChecked={true} onChange={(v) => setDProductType(v ? "Course" : "MultipleCourses")} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Program</div>
                      <Select options={programs.map((p) => ({ value: p.id, label: p.name }))} defaultValue={dProgramId} onChange={(v) => setDProgramId(v as string)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Course</div>
                      {dProductType === "MultipleCourses" ? (
                        <MultiSelect label="Course" options={courses.filter((c)=>c.programId===dProgramId).map((c) => ({ value: c.id, text: c.name }))} defaultSelected={dCourseIds} onChange={(vals) => setDCourseIds(vals)} />
                      ) : (
                        <Select options={courses.filter((c)=>c.programId===dProgramId).map((c) => ({ value: c.id, label: c.name }))} defaultValue={dCourseId} onChange={(v) => setDCourseId(v as string)} />
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-theme-xs text-gray-600">Batch</div>
                      <Select options={batches.filter((b)=>{ const cid = dProductType === "MultipleCourses" ? (dCourseIds[0] || dCourseId) : dCourseId; return b.courseId===cid; }).sort((a,b)=>{ const ap = a.status==="Enrolling"?0:a.status==="Active"?1:2; const bp = b.status==="Enrolling"?0:b.status==="Active"?1:2; return ap-bp; }).map((b) => ({ value: b.id, label: b.name }))} defaultValue={dBatchId} onChange={(v) => setDBatchId(v as string)} />
                      {(() => {
                        const selectedBatch = batches.find((b) => b.id === dBatchId);
                        const count = items.filter((e) => e.batchId === dBatchId).length;
                        const cap = selectedBatch?.capacity;
                        if (cap && count >= cap) {
                          return <div className="mt-1 text-theme-xs text-error-600">Batch is full. Choose another or allow waitlist.</div>;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Pricing & Payment</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <div className="text-theme-xs text-gray-600">Base Price</div>
                      <Input value={String(dBasePrice)} onChange={(e) => setDBasePrice(Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Offer Price</div>
                      <Input value={String(dOfferPrice)} onChange={(e) => setDOfferPrice(Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Coupon</div>
                      <div className="flex items-center gap-2">
                        <Input value={dCouponCode} onChange={(e) => setDCouponCode(e.target.value)} />
                        <Button variant="outline">Apply</Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">Final Amount: ₹{dFinalAmount}</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <div className="text-theme-xs text-gray-600">Payment Method</div>
                      <Select options={[{ value: "Cash", label: "Cash" }, { value: "UPI", label: "UPI" }, { value: "Card", label: "Card" }, { value: "Bank", label: "Bank Transfer" }, { value: "Manual", label: "Manual Marking" }]} defaultValue={dPaymentMode} onChange={(v) => setDPaymentMode(v as string)} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                      <div className="text-theme-sm text-gray-800 dark:text-white/90">Send payment link?</div>
                      <Switch label="" defaultChecked={dSendLink} onChange={(v) => setDSendLink(v)} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                      <div className="text-theme-sm text-gray-800 dark:text-white/90">Allow partial payment</div>
                      <Switch label="" defaultChecked={dAllowPartial} onChange={(v) => setDAllowPartial(v)} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <div className="text-theme-xs text-gray-600">Amount Paid Now</div>
                      <Input value={String(dAmountPaidNow)} onChange={(e) => setDAmountPaidNow(Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Balance Due</div>
                      <Input value={String(dBalanceDue)} onChange={(e) => setDBalanceDue(Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Due Date</div>
                      <DatePicker id="due-date" mode="single" onChange={(selectedDates) => setDDueDate(selectedDates[0] ? selectedDates[0].getTime() : null)} label="" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Enrollment Settings</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-theme-xs text-gray-600">Start Access Date</div>
                      <DatePicker id="start-access" mode="single" onChange={(selectedDates) => setDAccessStart(selectedDates[0] ? selectedDates[0].getTime() : null)} label="" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                      <div className="text-theme-sm text-gray-800 dark:text-white/90">Custom duration?</div>
                      <Switch label="" defaultChecked={dAccessMode === "Custom"} onChange={(v) => setDAccessMode(v ? "Custom" : "Default")} />
                    </div>
                  </div>
                  {dAccessMode === "Custom" && (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <div className="text-theme-xs text-gray-600">Months</div>
                        <Input value={String(dAccessMonths)} onChange={(e) => setDAccessMonths(Number(e.target.value) || 0)} />
                      </div>
                    </div>
                  )}
                  <div className="mt-3">
                    <div className="text-theme-xs text-gray-600">Enrollment Notes</div>
                    <TextArea value={dNotes} onChange={(v) => setDNotes(v)} />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Confirmation</div>
                  <div className="mt-2 text-theme-sm text-gray-700 dark:text-gray-300">
                    <div>Student: {dStudentName || "-"}</div>
                    <div>ID: {dSelectedStudentId || "-"}</div>
                    <div>Course: {dProductType === "MultipleCourses" ? dCourseIds.map((cid)=>courses.find(c=>c.id===cid)?.name||cid).join(", ") : (courses.find((c)=>c.id===dCourseId)?.name || dCourseId || "-")}</div>
                    <div>Batch: {batches.find((b)=>b.id===dBatchId)?.name || "-"}</div>
                    <div>Final Fee: ₹{dFinalAmount}</div>
                    <div>Payment: {dPaymentStatus}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                    <Button onClick={enrollStudent}>Create Enrollment</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} className="w-auto max-w-md sm:max-w-xl">
        <div className="p-6">
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Transfer to Batch</div>
          <div className="mt-1 text-theme-xs text-gray-600">Current Batch: {items.find(x=>x.id===transferId)?.batchName || "-"}</div>
          <div className="mt-3">
            <div className="text-theme-xs text-gray-600">Suggested Batches</div>
            <div className="mt-1 space-y-1">
              {batches.filter((b)=>{ const e = items.find(x=>x.id===transferId); return e ? b.courseId===e.courseId : true; }).map((b)=>{
                const cap = b.capacity || 20; const count = items.filter((e)=>e.batchId===b.id).length; const seats = Math.max(cap - count, 0);
                return (
                  <button key={b.id} onClick={()=>setDBatchId(b.id)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 ${dBatchId===b.id?"border-brand-500":"border-gray-200"}`}>
                    <span>{b.name}</span>
                    <span className="text-theme-xs text-gray-500">Seats: {seats}</span>
                  </button>
                );
              }).slice(0,3)}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-theme-xs text-gray-600">Reason for Transfer</div>
            <TextArea value={dNotes} onChange={(v)=>setDNotes(v)} />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
            <div className="text-theme-sm text-gray-800 dark:text-white/90">Notify Student?</div>
            <Switch label="" defaultChecked={dSendLink} onChange={(v)=>setDSendLink(v)} />
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
            <Button onClick={executeTransfer}>Transfer</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} className="w-auto max-w-md sm:max-w-xl">
        <div className="p-6">
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit Enrollment</div>
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="text-theme-xs text-gray-600">Course</div>
                <Select options={courses.map((c) => ({ value: c.id, label: c.name }))} defaultValue={dCourseId} onChange={(v) => setDCourseId(v as string)} />
              </div>
              <div>
                <div className="text-theme-xs text-gray-600">Batch</div>
                <Select options={batches.filter(b=>b.courseId===dCourseId).map((b) => ({ value: b.id, label: b.name }))} defaultValue={dBatchId} onChange={(v) => setDBatchId(v as string)} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <div className="text-theme-xs text-gray-600">Access Duration (months)</div>
                <Input value={String(dAccessMonths)} onChange={(e)=>setDAccessMonths(Number(e.target.value)||0)} />
              </div>
              <div>
                <div className="text-theme-xs text-gray-600">Enrollment Status</div>
                <Select options={[{ value: "Active", label: "Active" }, { value: "Paused", label: "Paused" }, { value: "Cancelled", label: "Cancelled" }]} defaultValue={dStatus} onChange={(v) => setDStatus(v as EnrollmentStatus)} />
              </div>
              <div>
                <div className="text-theme-xs text-gray-600">Payment Override</div>
                <Select options={[{ value: "Paid", label: "Mark Paid" }, { value: "Pending", label: "Mark Unpaid" }]} defaultValue={dPaymentStatus} onChange={(v) => setDPaymentStatus(v as PaymentStatus)} />
              </div>
            </div>
            <div>
              <div className="text-theme-xs text-gray-600">Enrollment Notes</div>
              <TextArea value={dNotes} onChange={(v)=>setDNotes(v)} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEditEnrollment}>Save Changes</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} className="w-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Import Enrollments CSV</div>
          <div className="mt-2 text-theme-xs text-gray-600">Columns: student_email, course_id, batch_id, price, paid_amount, enrollment_date, notes</div>
          <div className="mt-3">
            <TextArea value={importText} onChange={(v)=>setImportText(v)} placeholder="Paste CSV here" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="outline" onClick={() => {
              const lines = importText.split(/\n+/).map(l=>l.trim()).filter(Boolean);
              if (!lines.length) { setImportRows([]); return; }
              const header = lines[0].split(",").map(h=>h.trim().toLowerCase());
              const rows = lines.slice(1).map((line)=>{
                const cols = line.split(",").map(c=>c.trim());
                const obj: Record<string,string> = {}; header.forEach((h,idx)=>{ obj[h] = cols[idx] || ""; });
                return obj;
              });
              setImportRows(rows);
            }}>Preview</Button>
            <Button onClick={() => {
              const created: EnrollmentItem[] = [];
              importRows.forEach((r: CSVRow)=>{
                const email = (r["student_email"]||"");
                const cid = (r["course_id"]||""); const course = courses.find(c=>c.id===cid);
                const bid = (r["batch_id"]||""); const batch = batches.find(b=>b.id===bid);
                const price = Number(r["price"]||0); const paid = Number(r["paid_amount"]||0);
                const createdAt = Date.parse(r["enrollment_date"]||"") || Date.now();
                const payStatus: PaymentStatus = paid>=price?"Paid":paid>0?"Partial":"Pending";
                const status: EnrollmentStatus = payStatus==="Paid"?"Active":"PendingPayment";
                const id = `enr-${Date.now()}-${cid}-${Math.random().toString(36).slice(2,6)}`;
                const item: EnrollmentItem = { id, studentName: email.split("@")[0], email, programId: course?.programId||"", programName: course?.programName||"", courseId: cid, courseName: course?.name||cid, batchId: batch?.id, batchName: batch?.name||batch?.code, paymentStatus: payStatus, paymentMode: "Manual", status, createdAt, basePrice: price, finalAmount: price, amountPaidNow: paid, balanceDue: Math.max(price-paid,0), notes: r["notes"]||undefined };
                created.push(item);
              });
              setItems((prev)=>{ const next = [...created, ...prev]; writeEnrollments(next); return next; });
              setIsImportOpen(false); setImportRows([]); setImportText("");
            }}>Import</Button>
            <Button variant="outline" onClick={()=>{ setIsImportOpen(false); setImportRows([]); setImportText(""); }}>Cancel</Button>
          </div>
          {importRows.length>0 && (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>student_email</TableCell>
                    <TableCell isHeader>course_id</TableCell>
                    <TableCell isHeader>batch_id</TableCell>
                    <TableCell isHeader>price</TableCell>
                    <TableCell isHeader>paid_amount</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importRows.slice(0,5).map((r: CSVRow, idx:number)=> (
                    <TableRow key={idx}>
                      <TableCell>{r["student_email"]}</TableCell>
                      <TableCell>{r["course_id"]}</TableCell>
                      <TableCell>{r["batch_id"]}</TableCell>
                      <TableCell>{r["price"]}</TableCell>
                      <TableCell>{r["paid_amount"]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}