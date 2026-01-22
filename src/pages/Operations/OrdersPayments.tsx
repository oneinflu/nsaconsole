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

type PaymentStatus = "Paid" | "Partial" | "Pending" | "Failed" | "Refunded" | "Disputed";
type OrderType = "Course" | "Bundle" | "EnrollmentRenewal" | "AddOn";
type PaymentMethod = "UPI" | "Card" | "Netbanking" | "Razorpay" | "AdminManual";
type SourceType = "Website" | "Admin" | "Counselor";

type OrderItem = {
  id: string;
  orderCode: string;
  studentName: string;
  studentEmail: string;
  itemType: OrderType;
  itemId: string;
  itemName: string;
  programId?: string;
  courseId?: string;
  bundleId?: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  date: number;
  couponCode?: string;
  offerApplied?: string;
  enrollmentId?: string;
  source?: SourceType;
};

type TimelineEvent = { date: number; text: string };

function readPrograms(): { id: string; name: string }[] {
  try { const raw = localStorage.getItem("programs"); if (raw) return JSON.parse(raw) as { id: string; name: string }[]; } catch {}
  return [ { id: "cpa-us", name: "CPA US" }, { id: "acca", name: "ACCA" } ];
}
function readCourses(): { id: string; name: string; programId: string; programName: string }[] {
  try { const raw = localStorage.getItem("courses"); if (raw) return JSON.parse(raw) as { id: string; name: string; programId: string; programName: string }[]; } catch {}
  return [
    { id: "far", name: "CPA US – FAR", programId: "cpa-us", programName: "CPA US" },
    { id: "cpa-full", name: "CPA US – Full Package", programId: "cpa-us", programName: "CPA US" },
    { id: "acca-skills", name: "ACCA – Skills", programId: "acca", programName: "ACCA" },
    { id: "mern", name: "MERN Bootcamp", programId: "coding", programName: "Coding" },
  ];
}

function seedOrders(): OrderItem[] {
  const now = Date.now();
  const code = (n: number) => `#NSA${n}`;
  const courses = readCourses();
  const far = courses.find(c=>c.id==="far")!;
  const full = courses.find(c=>c.id==="cpa-full")!;
  const acca = courses.find(c=>c.id==="acca-skills")!;
  const mern = courses.find(c=>c.id==="mern")!;
  return [
    { id: "ord-rahul", orderCode: code(12578), studentName: "Rahul Singh", studentEmail: "r@gmail.com", itemType: "Course", itemId: far.id, itemName: far.name, programId: far.programId, courseId: far.id, amount: 19999, status: "Paid", method: "Card", date: now - 12*24*3600*1000, source: "Website" },
    { id: "ord-meera", orderCode: code(12644), studentName: "Meera Patel", studentEmail: "meera@outlook.com", itemType: "Bundle", itemId: full.id, itemName: full.name, programId: full.programId, courseId: full.id, amount: 79999, status: "Pending", method: "UPI", date: now - 11*24*3600*1000, source: "Website" },
    { id: "ord-peter", orderCode: code(12670), studentName: "Peter Johnson", studentEmail: "peter@yahoo.com", itemType: "Course", itemId: acca.id, itemName: acca.name, programId: acca.programId, courseId: acca.id, amount: 39999, status: "Refunded", method: "Netbanking", date: now - 10*24*3600*1000, source: "Admin" },
    { id: "ord-kiran", orderCode: code(12685), studentName: "Kiran Kumar", studentEmail: "k@outlook.com", itemType: "Course", itemId: mern.id, itemName: mern.name, programId: mern.programId, courseId: mern.id, amount: 11999, status: "Failed", method: "Razorpay", date: now - 10*24*3600*1000, source: "Counselor" },
  ];
}

function readOrders(): OrderItem[] {
  try { const raw = localStorage.getItem("orders"); if (raw) return JSON.parse(raw) as OrderItem[]; } catch {}
  return seedOrders();
}
function writeOrders(items: OrderItem[]) { try { localStorage.setItem("orders", JSON.stringify(items)); } catch {} }

function readTimeline(): Record<string, TimelineEvent[]> {
  try { const raw = localStorage.getItem("orderTimeline"); if (raw) return JSON.parse(raw) as Record<string, TimelineEvent[]>; } catch {}
  return {};
}
function writeTimeline(map: Record<string, TimelineEvent[]>) { try { localStorage.setItem("orderTimeline", JSON.stringify(map)); } catch {} }


export default function OrdersPaymentsPage() {
  const navigate = useNavigate();
  const programs = readPrograms();
  const courses = readCourses();
  const [orders, setOrders] = useState<OrderItem[]>([]);

  const [search, setSearch] = useState("");
  const [dateRangePreset, setDateRangePreset] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | PaymentStatus>("All");
  const [methodFilter, setMethodFilter] = useState<"All" | PaymentMethod>("All");
  const [programFilter, setProgramFilter] = useState<string | "All">("All");
  const [courseFilter, setCourseFilter] = useState<string | "All">("All");
  const [couponFilter, setCouponFilter] = useState<string | "All">("All");
  const [sourceFilter, setSourceFilter] = useState<"All" | SourceType>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineOrderId, setTimelineOrderId] = useState<string | null>(null);
  const [customRange, setCustomRange] = useState<{ start?: number; end?: number }>({});

  useEffect(() => { setOrders(readOrders()); }, []);

  const programOptions = programs.map(p=>({ value: p.id, label: p.name }));
  const courseOptions = courses.map(c=>({ value: c.id, label: c.name }));
  const statusOptions = ["Paid","Partial","Pending","Failed","Refunded","Disputed"].map(s=>({ value: s, label: s }));
  const methodOptions = ["UPI","Card","Netbanking","Razorpay","AdminManual"].map(m=>({ value: m, label: m }));
  const sourceOptions = ["Website","Admin","Counselor"].map(s=>({ value: s, label: s }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const start = customRange.start;
    const end = customRange.end;
    return orders.filter(o => {
      if (q) {
        const t = `${o.orderCode} ${o.studentName} ${o.studentEmail} ${o.itemName}`.toLowerCase();
        if (!t.includes(q)) return false;
      }
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (methodFilter !== "All" && o.method !== methodFilter) return false;
      if (programFilter !== "All" && o.programId !== programFilter) return false;
      if (courseFilter !== "All" && o.courseId !== courseFilter) return false;
      if (couponFilter !== "All" && (o.couponCode || "") !== couponFilter) return false;
      if (sourceFilter !== "All" && o.source !== sourceFilter) return false;
      if (dateRangePreset === "Today") {
        const d = new Date(); d.setHours(0,0,0,0);
        if (o.date < d.getTime()) return false;
      } else if (dateRangePreset === "Yesterday") {
        const d1 = new Date(); d1.setDate(d1.getDate()-1); d1.setHours(0,0,0,0);
        const d2 = new Date(); d2.setDate(d2.getDate()-1); d2.setHours(23,59,59,999);
        if (o.date < d1.getTime() || o.date > d2.getTime()) return false;
      } else if (dateRangePreset === "This Month") {
        const d1 = new Date(); d1.setDate(1); d1.setHours(0,0,0,0);
        if (o.date < d1.getTime()) return false;
      } else if (dateRangePreset === "Custom") {
        if (start && o.date < start) return false;
        if (end && o.date > end) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, methodFilter, programFilter, courseFilter, couponFilter, sourceFilter, dateRangePreset, customRange.start, customRange.end]);

  const statusClass = (s: PaymentStatus) => s === "Paid" ? "text-success-600" : s === "Pending" ? "text-warning-600" : s === "Partial" ? "text-orange-600" : s === "Failed" ? "text-error-600" : s === "Refunded" ? "text-brand-600" : "text-purple-600";

  const markPaid = (id: string) => {
    setOrders(prev => { const next = prev.map(o => o.id===id ? { ...o, status: "Paid" as PaymentStatus } : o); writeOrders(next); return next; });
    const map = readTimeline(); const arr = map[id] || []; arr.push({ date: Date.now(), text: "Marked as Paid" }); map[id] = arr; writeTimeline(map);
  };
  const markPartial = (id: string) => {
    setOrders(prev => { const next = prev.map(o => o.id===id ? { ...o, status: "Partial" as PaymentStatus } : o); writeOrders(next); return next; });
    const map = readTimeline(); const arr = map[id] || []; arr.push({ date: Date.now(), text: "Marked Partial Payment" }); map[id] = arr; writeTimeline(map);
  };
  const refundOrder = (id: string) => {
    setOrders(prev => { const next = prev.map(o => o.id===id ? { ...o, status: "Refunded" as PaymentStatus } : o); writeOrders(next); return next; });
    const map = readTimeline(); const arr = map[id] || []; arr.push({ date: Date.now(), text: "Refund processed" }); map[id] = arr; writeTimeline(map);
  };
  const openTimeline = (id: string) => { setTimelineOrderId(id); setIsTimelineOpen(true); };

  const timeline = useMemo(() => {
    const m = readTimeline(); return timelineOrderId ? (m[timelineOrderId] || []) : [];
  }, [isTimelineOpen, timelineOrderId]);


  return (
    <>
      <PageMeta title="Orders & Payments" description={"View and manage all course transactions, invoices, and payment statuses."} />
      <PageBreadcrumb pageTitle="Orders & Payments" />
      <ComponentCard title="View and manage all course transactions, invoices, and payment statuses.">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <div className="sm:col-span-2">
              <Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search order, student, email, ID..." />
            </div>
            <div>
              <Select options={[{value:"All",label:"All"},{value:"Today",label:"Today"},{value:"Yesterday",label:"Yesterday"},{value:"This Month",label:"This Month"},{value:"Custom",label:"Custom"}]} defaultValue={dateRangePreset} onChange={(v)=>setDateRangePreset(v as string)} />
            </div>
            <div>
              <Select options={[{value:"All",label:"All"}, ...statusOptions]} defaultValue={statusFilter} onChange={(v)=>setStatusFilter(v as PaymentStatus)} />
            </div>
            <div>
              <Select options={[{value:"All",label:"All"}, ...methodOptions]} defaultValue={methodFilter} onChange={(v)=>setMethodFilter(v as PaymentMethod)} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-6">
            <div>
              <Select options={[{value:"All",label:"All"}, ...programOptions]} defaultValue={programFilter} onChange={(v)=>setProgramFilter(v as string)} />
            </div>
            <div>
              <Select options={[{value:"All",label:"All"}, ...courseOptions]} defaultValue={courseFilter} onChange={(v)=>setCourseFilter(v as string)} />
            </div>
            <div>
              <Select options={[{value:"All",label:"All"}]} defaultValue={couponFilter} onChange={(v)=>setCouponFilter(v as string)} />
            </div>
            <div>
              <Select options={[{value:"All",label:"All"}, ...sourceOptions]} defaultValue={sourceFilter} onChange={(v)=>setSourceFilter(v as SourceType)} />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">Export</Button>
              {dateRangePreset === "Custom" && (
                <DatePicker id="orders-range" mode="range" onChange={(dates)=>{
                  const ds = (dates as Date[])[0]; const de = (dates as Date[])[1];
                  setCustomRange({ start: ds ? ds.getTime() : undefined, end: de ? de.getTime() : undefined });
                }} label="" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Order ID</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Student</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Course / Package</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Amount</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Status</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Date</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{o.orderCode}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm">
                    <div className="text-gray-800 dark:text-white/90">{o.studentName}</div>
                    <div className="text-theme-xs text-gray-500">{o.studentEmail}</div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{o.itemName}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">₹{o.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="px-5 py-4 text-start">
                    <span className={`font-medium ${statusClass(o.status)}`}>{o.status}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{new Date(o.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</TableCell>
                  <TableCell className="relative px-5 py-4 text-start">
                    <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === o.id ? null : o.id))}>⋮</button>
                    <Dropdown isOpen={openMenuId===o.id} onClose={() => setOpenMenuId(null)}>
                      <DropdownItem onClick={()=>navigate(`/operations/orders/${o.id}`)}>View Order</DropdownItem>
                      <DropdownItem onClick={()=>openTimeline(o.id)}>View Payment Timeline</DropdownItem>
                      <DropdownItem onClick={()=>markPaid(o.id)}>Mark as Paid</DropdownItem>
                      <DropdownItem onClick={()=>markPartial(o.id)}>Mark Partial Payment</DropdownItem>
                      <DropdownItem>Send Payment Link</DropdownItem>
                      <DropdownItem>Generate Invoice</DropdownItem>
                      <DropdownItem>Download Invoice PDF</DropdownItem>
                      <DropdownItem onClick={()=>refundOrder(o.id)}>Refund Payment</DropdownItem>
                      <DropdownItem>Cancel Order</DropdownItem>
                      <DropdownItem>Link to Enrollment</DropdownItem>
                      <DropdownItem onClick={()=>openTimeline(o.id)}>View Audit Log</DropdownItem>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Modal isOpen={isTimelineOpen} onClose={()=>setIsTimelineOpen(false)} className="w-auto max-w-lg">
          <div className="p-6">
            <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Payment Timeline</div>
            <div className="mt-3 space-y-2">
              {timeline.length===0 && <div className="text-theme-xs text-gray-600">No activity yet</div>}
              {timeline.map((a, idx)=> (
                <div key={idx} className="text-theme-xs text-gray-700 dark:text-gray-300">
                  {new Date(a.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}: {a.text}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-end">
              <Button variant="outline" onClick={()=>setIsTimelineOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      </ComponentCard>
    </>
  );
}