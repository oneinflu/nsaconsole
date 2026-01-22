import { useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import MultiSelect from "../../components/form/MultiSelect";
import Badge from "../../components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon, EyeIcon, EnvelopeIcon, CopyIcon, UserCircleIcon, TimeIcon, PlusIcon } from "../../icons";
import { Modal } from "../../components/ui/modal";
import Avatar from "../../components/ui/avatar/Avatar";

type Payment = {
  id: string;
  amount: number;
  date: string;
  mode: string;
  status: string;
};

type LeadInfo = {
  source: string;
  createdOn: string;
  owner: string;
  status: string;
  closedBy?: string;
  closedOn?: string;
};

type Agreement = {
  totalAmount: number;
  currency: string;
  paymentMode: string;
  installmentsAgreed?: number;
};

type Enrollment = {
  course: string;
  package: string;
  parts: string[];
  joinedOn: string;
  expiresOn: string;
};

type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  enrollmentId: string;
  courses: string[];
  joinedOn: string;
  lead: LeadInfo;
  agreement: Agreement;
  payments: Payment[];
  enrollments: Enrollment[];
};

const courseOptions = [
  { value: "CPA US", text: "CPA US" },
  { value: "CMA US", text: "CMA US" },
  { value: "ACCA", text: "ACCA" },
];

const names = [
  "Aarav Patel",
  "Ishita Sharma",
  "Vivaan Mehta",
  "Diya Singh",
  "Ananya Rao",
  "Rohan Kapoor",
  "Neha Verma",
  "Kabir Joshi",
  "Saanvi Iyer",
  "Arjun Nair",
  "Meera Desai",
  "Advait Gupta",
  "Prisha Khanna",
  "Aadhya Bansal",
  "Reyansh Chawla",
  "Trisha Malhotra",
  "Veer Saxena",
  "Mira Kulkarni",
  "Om Tiwari",
  "Aanya Dutta",
];

function makeData(count = 60): Student[] {
  const out: Student[] = [];
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    const idx = i + 1;
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
    const phone = `+91 9${String(700000000 + i).slice(0, 9)}`;
    const enrollmentId = `ENR-${String(idx).padStart(4, "0")}`;
    const joined = new Date(Date.now() - i * 86400000);
    const joinedOn = joined.toISOString();
    const lead: LeadInfo = {
      source: ["Website", "Referral", "Counsellor", "Walk-in"][i % 4],
      createdOn: new Date(joined.getTime() - 3 * 86400000).toISOString(),
      owner: ["Akash", "Megha", "Rahul", "Sana"][i % 4],
      status: i % 7 === 0 ? "Open" : "Won",
      closedBy: i % 7 === 0 ? undefined : ["Akash", "Megha", "Rahul", "Sana"][i % 4],
      closedOn: i % 7 === 0 ? undefined : new Date(joined.getTime() - 1 * 86400000).toISOString(),
    };
    const paymentMode = i % 9 === 0 ? "Loan" : i % 3 === 0 ? "Part" : "Full";
    const agreement: Agreement = {
      totalAmount: 45000 + (i % 5) * 10000,
      currency: "INR",
      paymentMode,
      installmentsAgreed: paymentMode === "Part" || paymentMode === "Loan" ? 6 + (i % 3) * 3 : undefined,
    };
    const payments: Payment[] = [];
    const paidCount = paymentMode === "Full" ? 1 : 3 + (i % 3);
    let totalPaid = 0;
    for (let k = 0; k < paidCount; k++) {
      const amt = Math.floor(agreement.totalAmount / (agreement.installmentsAgreed || paidCount));
      totalPaid += amt;
      payments.push({
        id: `PM-${idx}-${k + 1}`,
        amount: amt,
        date: new Date(joined.getTime() + k * 7 * 86400000).toISOString(),
        mode: ["UPI", "Card", "NetBanking", "Cash"][k % 4],
        status: "Success",
      });
    }
    if (totalPaid < agreement.totalAmount && paymentMode !== "Full") {
      payments.push({
        id: `PM-${idx}-${paidCount + 1}`,
        amount: agreement.totalAmount - totalPaid,
        date: new Date(joined.getTime() + (paidCount + 1) * 7 * 86400000).toISOString(),
        mode: "Loan",
        status: "Pending",
      });
    }
    const allCourses = ["CPA US", "CMA US", "ACCA"];
    const packages = ["Standard", "Premium", "Live+Mentorship"];
    const partsPool = ["Core Lectures", "Live Classes", "Mocks", "Mentorship", "Doubt Sessions"];
    const enrollments: Enrollment[] = [];
    for (let c = 0; c < allCourses.length; c++) {
      if ((i + c) % 2 === 0) {
        const course = allCourses[c];
        const pkg = packages[(i + c) % packages.length];
        const parts = partsPool.filter((_, p) => ((i + p + c) % 2 === 0)).slice(0, 3);
        const jOn = new Date(joined.getTime() + c * 2 * 86400000).toISOString();
        const exp = new Date(new Date(jOn).getTime() + 365 * 86400000).toISOString();
        enrollments.push({ course, package: pkg, parts, joinedOn: jOn, expiresOn: exp });
      }
    }
    const pick = Array.from(new Set(enrollments.map((e) => e.course)));
    out.push({ id: String(idx), name, email, phone, enrollmentId, courses: pick, joinedOn, lead, agreement, payments, enrollments });
  }
  return out;
}

export default function StudentsViewAll() {
  const [students, setStudents] = useState<Student[]>(() => makeData(120));
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<string>("25");
  const [pageIndex, setPageIndex] = useState(0);

  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [viewTab, setViewTab] = useState<string>("overview");
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCourses, setNewCourses] = useState<string[]>([]);

  const filteredSorted = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let rows = students.filter((s) => {
      const matchTxt = txt
        ? [s.name, s.email, s.phone, s.enrollmentId].some((v) => v.toLowerCase().includes(txt))
        : true;
      const matchCourse = courseFilter.length > 0 ? courseFilter.every((c) => s.courses.includes(c)) : true;
      return matchTxt && matchCourse;
    });
    if (sortBy) {
      rows = rows.slice().sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
        if (sortBy === "joinedOn") return (new Date(a.joinedOn).getTime() - new Date(b.joinedOn).getTime()) * dir;
        if (sortBy === "enrollmentId") return a.enrollmentId.localeCompare(b.enrollmentId) * dir;
        return 0;
      });
    }
    return rows;
  }, [students, search, courseFilter, sortBy, sortDir]);

  const total = filteredSorted.length;
  const pageCount = Math.max(1, Math.ceil(total / Number(pageSize)));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = filteredSorted.slice(currentPage * Number(pageSize), currentPage * Number(pageSize) + Number(pageSize));

  const onDelete = (id: string) => {
    const s = students.find((x) => x.id === id);
    const ok = window.confirm(`Delete ${s?.name || id}?`);
    if (!ok) return;
    setStudents((prev) => prev.filter((x) => x.id !== id));
  };

  const onEditSave = (patch: Partial<Student>) => {
    if (!editStudent) return;
    setStudents((prev) => prev.map((x) => (x.id === editStudent.id ? { ...x, ...patch } : x)));
    setEditStudent(null);
  };

  const toggleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const openAdd = () => setIsAddOpen(true);
  const closeAdd = () => {
    setIsAddOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewCourses([]);
  };

  const saveAdd = () => {
    const nextIdNum = Math.max(0, ...students.map((s) => Number(s.id) || 0)) + 1;
    const id = String(nextIdNum);
    const enrollmentId = `ENR-${String(nextIdNum).padStart(4, "0")}`;
    const now = new Date().toISOString();
    const selectedCourses = newCourses.length ? newCourses : [courseOptions[0].value];
    const student: Student = {
      id,
      name: newName || `Student ${nextIdNum}`,
      email: newEmail || `student${nextIdNum}@example.com`,
      phone: newPhone || "+91 9000000000",
      enrollmentId,
      courses: selectedCourses,
      joinedOn: now,
      lead: {
        source: "Manual",
        createdOn: now,
        owner: "Unassigned",
        status: "Won",
      },
      agreement: {
        totalAmount: 0,
        currency: "INR",
        paymentMode: "Full",
      },
      payments: [],
      enrollments: selectedCourses.map((c, idx) => ({
        course: c,
        package: "Standard",
        parts: ["Core Lectures"],
        joinedOn: new Date(Date.now() + idx * 86400000).toISOString(),
        expiresOn: new Date(Date.now() + 365 * 86400000).toISOString(),
      })),
    };
    setStudents((prev) => [student, ...prev]);
    closeAdd();
  };

  return (
    <>
      <PageMeta title="Manage Students" description="Browse and manage all students" />
      <PageBreadcrumb pageTitle="Manage Students" />
      <ComponentCard title="Manage Students">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAdd} startIcon={<PlusIcon className="w-4 h-4" />}>Add New Student</Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input placeholder="Search name, email, phone, enrollment ID" value={search} onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }} />
            <MultiSelect label="Filter by Courses" options={courseOptions} value={courseFilter} onChange={(vals) => { setCourseFilter(vals); setPageIndex(0); }} placeholder="Select courses" />
            <Select
              options={[
                { value: "", label: "Sort by" },
                { value: "name", label: "Name" },
                { value: "joinedOn", label: "Joined On" },
                { value: "enrollmentId", label: "Enrollment ID" },
              ]}
              defaultValue={sortBy}
              onChange={(v) => { setSortBy(v); setSortDir("asc"); }}
            />
            <Select
              options={[
                { value: "10", label: "10 / page" },
                { value: "25", label: "25 / page" },
                { value: "50", label: "50 / page" },
                { value: "100", label: "100 / page" },
              ]}
              defaultValue={pageSize}
              onChange={(v) => { setPageSize(v); setPageIndex(0); }}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      <button className="flex items-center gap-2" onClick={() => toggleSort("name")}>Name {sortBy === "name" && (<span className="text-gray-400">{sortDir === "asc" ? "▲" : "▼"}</span>)}</button>
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Phone</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Enrollment ID</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Courses</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      <button className="flex items-center gap-2" onClick={() => toggleSort("joinedOn")}>Joined On {sortBy === "joinedOn" && (<span className="text-gray-400">{sortDir === "asc" ? "▲" : "▼"}</span>)}</button>
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageRows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{s.name}</TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{s.email}</TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{s.phone}</TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{s.enrollmentId}</TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex flex-wrap gap-2">
                          {s.courses.map((c) => (
                            <Badge key={c} variant="light" color="dark">{c}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{new Date(s.joinedOn).toLocaleDateString()}</TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setViewStudent(s)} startIcon={<EyeIcon className="w-4 h-4" />}>View</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditStudent(s)} startIcon={<PencilIcon className="w-4 h-4" />}>Edit</Button>
                          <Button size="sm" onClick={() => onDelete(s.id)} startIcon={<TrashBinIcon className="w-4 h-4" />}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/[0.05]">
              <div className="text-sm text-gray-500 dark:text-gray-400">{total === 0 ? "No results" : `${currentPage * Number(pageSize) + 1}-${Math.min(total, (currentPage + 1) * Number(pageSize))} of ${total}`}</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={currentPage === 0}>Prev</Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage + 1} / {pageCount}</span>
                <Button size="sm" variant="outline" onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))} disabled={currentPage >= pageCount - 1}>Next</Button>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>

      <Modal isOpen={isAddOpen} onClose={closeAdd} className="max-w-xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add New Student</h3>
          <div className="mt-4 space-y-3">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" />
            <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" />
            <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone" />
            <MultiSelect label="Courses" options={courseOptions} value={newCourses} onChange={(vals) => setNewCourses(vals)} placeholder="Select courses" />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={closeAdd}>Cancel</Button>
            <Button onClick={saveAdd}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!viewStudent} onClose={() => setViewStudent(null)} isFullscreen={true} showCloseButton={false}>
        {viewStudent && (
          <div className="fixed inset-0 flex">
            <div className="flex-1 bg-gray-900/40 backdrop-blur-sm" onClick={() => setViewStudent(null)}></div>
            <div className="relative ml-auto flex h-full w-full max-w-[1040px] flex-col bg-white dark:bg-gray-900 shadow-theme-lg">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar src="/images/user/user-01.jpg" size="large" status="online" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">{viewStudent.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1"><EnvelopeIcon className="size-4" /> {viewStudent.email}</span>
                        <span className="inline-flex items-center gap-1"><UserCircleIcon className="size-4" /> {viewStudent.phone}</span>
                        <span className="inline-flex items-center gap-1"><TimeIcon className="size-4" /> Joined {new Date(viewStudent.joinedOn).toLocaleDateString()}</span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-xs dark:border-gray-800">ID: {viewStudent.enrollmentId}
                          <button className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400" onClick={() => navigator.clipboard.writeText(viewStudent.enrollmentId)}>
                            <CopyIcon className="size-4" />
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setViewStudent(null)}>Close</Button>
                </div>
              </div>

              <div className="px-6 pt-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { k: "overview", t: "Overview" },
                    { k: "lead", t: "Lead" },
                    { k: "agreement", t: "Agreement" },
                    { k: "payments", t: "Payments" },
                    { k: "enrollments", t: "Enrollments" },
                  ].map((tab) => (
                    <button
                      key={tab.k}
                      onClick={() => setViewTab(tab.k)}
                      className={`rounded-lg px-3 py-1.5 text-sm border transition ${viewTab === tab.k ? "border-brand-300 bg-brand-50 text-gray-800 shadow-theme-xs" : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400"}`}
                    >
                      {tab.t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto px-6 pb-6">
                {viewTab === "overview" && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Name</span><span>{viewStudent.name}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Email</span><span>{viewStudent.email}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Phone</span><span>{viewStudent.phone}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Enrollment ID</span><span>{viewStudent.enrollmentId}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Joined On</span><span>{new Date(viewStudent.joinedOn).toLocaleString()}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Courses</span><span className="flex flex-wrap gap-2">{viewStudent.courses.map((c) => (<Badge key={c} variant="light" color="dark">{c}</Badge>))}</span></div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="font-medium text-gray-800 dark:text-white/90">Lead</div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Source</span><span>{viewStudent.lead.source}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Created On</span><span>{new Date(viewStudent.lead.createdOn).toLocaleString()}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Owner</span><span>{viewStudent.lead.owner}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Status</span><span>{viewStudent.lead.status}</span></div>
                      {viewStudent.lead.closedBy && (
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Closed By</span><span>{viewStudent.lead.closedBy}</span></div>
                      )}
                      {viewStudent.lead.closedOn && (
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Closed On</span><span>{new Date(viewStudent.lead.closedOn).toLocaleString()}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {viewTab === "agreement" && (
                  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="font-medium text-gray-800 dark:text-white/90">Agreement</div>
                    <div className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Total</span><span>₹ {viewStudent.agreement.totalAmount.toLocaleString()}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Mode</span><span>{viewStudent.agreement.paymentMode}</span></div>
                      {viewStudent.agreement.installmentsAgreed && (
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Installments</span><span>{viewStudent.agreement.installmentsAgreed}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {viewTab === "payments" && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                      <div className="font-medium text-gray-800 dark:text-white/90">Summary</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Count</span><span>{viewStudent.payments.length}</span></div>
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Total Paid</span><span>₹ {viewStudent.payments.filter((p) => p.status === "Success").reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span></div>
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Last Payment</span><span>{viewStudent.payments.length > 0 ? new Date(viewStudent.payments[viewStudent.payments.length - 1].date).toLocaleDateString() : "-"}</span></div>
                      </div>
                    </div>
                    <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                      <div className="font-medium text-gray-800 dark:text-white/90">Breakdown</div>
                      <div className="mt-2 max-h-72 overflow-auto space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        {viewStudent.payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between">
                            <span>#{p.id}</span>
                            <span>₹ {p.amount.toLocaleString()}</span>
                            <span>{new Date(p.date).toLocaleDateString()}</span>
                            <Badge variant="light" color={p.status === "Success" ? "success" : p.status === "Pending" ? "warning" : "error"}>{p.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {viewTab === "enrollments" && (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {viewStudent.enrollments.map((en) => (
                      <div key={`${en.course}-${en.package}`} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-800 dark:text-white/90">{en.course}</div>
                          <Badge variant="light" color="primary">{en.package}</Badge>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Joined {new Date(en.joinedOn).toLocaleDateString()} • Expires {new Date(en.expiresOn).toLocaleDateString()}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {en.parts.map((part) => (
                            <Badge key={part} variant="light" color="dark">{part}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewTab === "lead" && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="font-medium text-gray-800 dark:text-white/90">Lead</div>
                    <div className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Source</span><span>{viewStudent.lead.source}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Created On</span><span>{new Date(viewStudent.lead.createdOn).toLocaleString()}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Owner</span><span>{viewStudent.lead.owner}</span></div>
                      <div className="flex gap-2"><span className="w-32 text-gray-500">Status</span><span>{viewStudent.lead.status}</span></div>
                      {viewStudent.lead.closedBy && (
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Closed By</span><span>{viewStudent.lead.closedBy}</span></div>
                      )}
                      {viewStudent.lead.closedOn && (
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Closed On</span><span>{new Date(viewStudent.lead.closedOn).toLocaleString()}</span></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!editStudent} onClose={() => setEditStudent(null)} className="max-w-xl">
        {editStudent && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit Student</h3>
            <div className="mt-4 space-y-3">
              <Input value={editStudent.name} onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })} placeholder="Name" />
              <Input value={editStudent.email} onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })} placeholder="Email" />
              <Input value={editStudent.phone} onChange={(e) => setEditStudent({ ...editStudent, phone: e.target.value })} placeholder="Phone" />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditStudent(null)}>Cancel</Button>
              <Button onClick={() => onEditSave({ name: editStudent.name, email: editStudent.email, phone: editStudent.phone })}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}