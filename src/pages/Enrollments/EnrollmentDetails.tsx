import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";

type PaymentStatus = "Paid" | "Partial" | "Failed" | "Pending" | "Refunded";
type EnrollmentStatus = "Active" | "PendingPayment" | "Trial" | "Cancelled" | "Refunded" | "Transferred" | "Completed";

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

type SessionItem = { id: string; batchId: string; title: string; date: number; facultyId?: string };
type Faculty = { id: string; name: string };

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
    { id: "batch-acca-skl-feb", name: "SKL – Feb", code: "SKL-FEB", courseId: "acca-skills", programId: "acca", status: "Completed" },
    { id: "batch-mern-c3", name: "Cohort 3", code: "MERN-C3", courseId: "mern", programId: "coding", status: "Active" },
  ];
}
function readEnrollments(): EnrollmentItem[] {
  try { const raw = localStorage.getItem("enrollments"); if (raw) return JSON.parse(raw) as EnrollmentItem[]; } catch (e) { void e; }
  const courses = readCourses();
  const batches = readBatches();
  const now = Date.now();
  const farCourse = courses.find((c) => c.id === "far")!;
  const farBatch = batches.find((b) => b.id === "batch-far-jan-25");
  return [
    { id: "enr-rahul", studentName: "Rahul Singh", email: "r@gmail.com", programId: farCourse.programId, programName: farCourse.programName, courseId: farCourse.id, courseName: farCourse.name, batchId: farBatch?.id, batchName: farBatch?.name, paymentStatus: "Partial", paymentMode: "Card", status: "Active", createdAt: now - 5 * 24 * 3600 * 1000, basePrice: 24999, offerPrice: 19999, couponCode: "DIWALI", finalAmount: 18499, amountPaidNow: 5000, balanceDue: 13499, dueDate: now + 16 * 24 * 3600 * 1000 },
  ];
}
function writeEnrollments(items: EnrollmentItem[]) { try { localStorage.setItem("enrollments", JSON.stringify(items)); } catch (e) { void e; } }
function readSessions(batchId: string): SessionItem[] {
  try { const raw = localStorage.getItem(`sessions:${batchId}`); if (raw) return JSON.parse(raw) as SessionItem[]; } catch (e) { void e; }
  return [];
}
function readFaculty(): Faculty[] {
  try { const raw = localStorage.getItem("faculty"); if (raw) return JSON.parse(raw) as Faculty[]; } catch (e) { void e; }
  return [ { id: "f1", name: "John Doe" }, { id: "f2", name: "Jane Smith" } ];
}

type ActivityItem = { date: number; text: string };
function readActivity(enrId: string): ActivityItem[] {
  try { const raw = localStorage.getItem(`enr-activity:${enrId}`); if (raw) return JSON.parse(raw) as ActivityItem[]; } catch (e) { void e; }
  const base = Date.now();
  return [
    { date: base - 22 * 24 * 3600 * 1000, text: "Student enrolled by Admin" },
    { date: base - 21 * 24 * 3600 * 1000, text: "Payment Link sent" },
    { date: base - 20 * 24 * 3600 * 1000, text: "Partial payment received" },
    { date: base - 16 * 24 * 3600 * 1000, text: "Session #1 attended" },
  ];
}
function writeActivity(enrId: string, items: ActivityItem[]) { try { localStorage.setItem(`enr-activity:${enrId}`, JSON.stringify(items)); } catch (e) { void e; } }

export default function EnrollmentDetailsPage() {
  const navigate = useNavigate();
  const { enrollmentId } = useParams();
  readPrograms();
  readCourses();
  const batches = readBatches();
  const faculty = readFaculty();

  const [enr, setEnr] = useState<EnrollmentItem | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const list = readEnrollments();
    const found = list.find((x) => x.id === enrollmentId) || list[0] || null;
    setEnr(found);
    if (found) setActivity(readActivity(found.id));
  }, [enrollmentId]);

  const batch = useMemo(() => batches.find((b) => b.id === (enr?.batchId || "")) || null, [batches, enr]);
  const sessions = useMemo(() => (enr?.batchId ? readSessions(enr.batchId) : []), [enr]);
  const nextSession = useMemo(() => sessions.filter((s) => s.date > Date.now()).sort((a,b)=>a.date-b.date)[0] || null, [sessions]);
  const facultyName = useMemo(() => (batch?.startDate ? faculty[0]?.name : faculty[1]?.name), [batch, faculty]);

  const markFullPayment = () => {
    if (!enr) return;
    const updated: EnrollmentItem = { ...enr, paymentStatus: "Paid", amountPaidNow: enr.finalAmount || enr.offerPrice || enr.basePrice || 0, balanceDue: 0, status: "Active" };
    setEnr(updated);
    const prev = readEnrollments(); const next = prev.map((x) => (x.id === updated.id ? updated : x)); writeEnrollments(next);
    const log = [...activity, { date: Date.now(), text: "Marked full payment" }];
    setActivity(log); writeActivity(updated.id, log);
  };
  const markPartialPayment = () => {
    if (!enr) return;
    const amt = (enr.finalAmount || 0) * 0.25;
    const bal = Math.max((enr.finalAmount || 0) - amt, 0);
    const updated: EnrollmentItem = { ...enr, paymentStatus: amt >= (enr.finalAmount || 0) ? "Paid" : "Partial", amountPaidNow: amt, balanceDue: bal, status: amt >= (enr.finalAmount || 0) ? "Active" : "PendingPayment" };
    setEnr(updated);
    const prev = readEnrollments(); const next = prev.map((x) => (x.id === updated.id ? updated : x)); writeEnrollments(next);
    const log = [...activity, { date: Date.now(), text: "Marked partial payment" }];
    setActivity(log); writeActivity(updated.id, log);
  };
  const sendPaymentLink = () => {
    if (!enr) return;
    const updated: EnrollmentItem = { ...enr, sendPaymentLink: true };
    setEnr(updated);
    const prev = readEnrollments(); const next = prev.map((x) => (x.id === updated.id ? updated : x)); writeEnrollments(next);
    const log = [...activity, { date: Date.now(), text: "Payment link sent" }];
    setActivity(log); writeActivity(updated.id, log);
  };
  const cancel = () => {
    if (!enr) return;
    const updated: EnrollmentItem = { ...enr, status: "Cancelled", paymentStatus: "Refunded" };
    setEnr(updated);
    const prev = readEnrollments(); const next = prev.map((x) => (x.id === updated.id ? updated : x)); writeEnrollments(next);
    const log = [...activity, { date: Date.now(), text: "Enrollment cancelled" }];
    setActivity(log); writeActivity(updated.id, log);
  };
  const refund = () => {
    if (!enr) return;
    const updated: EnrollmentItem = { ...enr, status: "Refunded", paymentStatus: "Refunded" };
    setEnr(updated);
    const prev = readEnrollments(); const next = prev.map((x) => (x.id === updated.id ? updated : x)); writeEnrollments(next);
    const log = [...activity, { date: Date.now(), text: "Refund initiated" }];
    setActivity(log); writeActivity(updated.id, log);
  };

  const enrolledDate = enr ? new Date(enr.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "-";
  const accessStart = enr?.accessStart ? new Date(enr.accessStart).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Today";
  const accessEnd = enr?.accessDurationMonths ? new Date((enr.accessStart || Date.now()) + enr.accessDurationMonths * 30 * 24 * 3600 * 1000).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "As per course";
  const paid = enr?.amountPaidNow || 0;
  const finalAmt = enr?.finalAmount || enr?.offerPrice || enr?.basePrice || 0;
  const remaining = Math.max(finalAmt - paid, 0);
  const dueDateText = enr?.dueDate ? new Date(enr.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—";
  const progressPct = Math.min(100, Math.round(((sessions.filter((s) => s.date < Date.now()).length || 0) / Math.max(sessions.length || 1, 1)) * 100));

  return (
    <>
      <PageMeta title={enr ? `${enr.studentName} → ${enr.courseName}` : "Enrollment"} description="Enrollment details, payments, batch, and progress" />
      <PageBreadcrumb pageTitle="Enrollment" />
      {enr && (
        <ComponentCard title="Enrollment Details">
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="flex-1 space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">{enr.studentName} → {enr.courseName}</div>
                <div className="mt-1 text-theme-xs text-gray-600">Enrollment Status: {enr.status} · Payment: {enr.paymentStatus} · Batch: {enr.batchName || "-"}</div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="outline" onClick={() => navigate(`/enrollments`)}>Edit Enrollment</Button>
                  <Button variant="outline">Transfer Batch</Button>
                  <Button variant="outline">Upgrade Package</Button>
                  <Button variant="outline" onClick={cancel}>Cancel</Button>
                  <Button variant="outline" onClick={refund}>Refund</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Student</div>
                  <div className="mt-2 text-theme-sm text-gray-700">Name: {enr.studentName}</div>
                  <div className="mt-1 text-theme-xs text-gray-600">Email: {enr.email || "-"}</div>
                  <div className="mt-1 text-theme-xs text-gray-600">Phone: {enr.phone || "-"}</div>
                  <div className="mt-2 text-theme-xs text-gray-600">Enrolled on: {enrolledDate}</div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Course</div>
                  <div className="mt-2 text-theme-sm text-gray-700">Course: {enr.courseName}</div>
                  <div className="mt-1 text-theme-xs text-gray-600">Batch: {enr.batchName || "-"}</div>
                  <div className="mt-1 text-theme-xs text-gray-600">Access: {accessStart} → {accessEnd}</div>
                  <div className="mt-3">
                    <div className="text-theme-xs text-gray-600">Progress</div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                      <div className="h-2 rounded-full bg-brand-500" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="mt-1 text-theme-xs text-gray-600">Sessions completed: {sessions.filter((s)=>s.date < Date.now()).length} / {sessions.length}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Batch Info</div>
                <div className="mt-2 text-theme-xs text-gray-600">Next class: {nextSession ? new Date(nextSession.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—"}</div>
                <div className="mt-1 text-theme-xs text-gray-600">Faculty: {facultyName || "-"}</div>
                <div className="mt-1 text-theme-xs text-gray-600">Sessions: {sessions.length}</div>
              </div>
            </div>

            <div className="w-full lg:w-[420px] space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Payment Summary</div>
                <div className="mt-2 text-theme-xs text-gray-600">Base Price: ₹{enr.basePrice || 0}</div>
                <div className="mt-1 text-theme-xs text-gray-600">Offer Applied: -₹{enr.basePrice && enr.offerPrice ? (enr.basePrice - enr.offerPrice) : 0}</div>
                <div className="mt-1 text-theme-xs text-gray-600">Coupon: {enr.couponCode ? "-₹1500" : "-₹0"}</div>
                <div className="mt-2 text-theme-sm text-gray-800">Final Amount: ₹{finalAmt}</div>
                <div className="mt-2 text-theme-xs text-gray-600">Paid: ₹{paid}</div>
                <div className="mt-1 text-theme-xs text-gray-600">Remaining: ₹{remaining} (Due on {dueDateText})</div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="outline" onClick={sendPaymentLink}>Send Payment Link</Button>
                  <Button variant="outline" onClick={markFullPayment}>Mark Full Payment</Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button variant="outline" onClick={markPartialPayment}>Mark Partial Payment</Button>
                  <Button variant="outline">Download Invoice</Button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Activity Log</div>
                <div className="mt-2 space-y-2">
                  {activity.map((a, idx) => (
                    <div key={idx} className="text-theme-xs text-gray-700">
                      {new Date(a.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}: {a.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>
      )}
    </>
  );
}