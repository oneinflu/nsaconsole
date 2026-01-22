import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import { Modal } from "../../components/ui/modal";
import DatePicker from "../../components/form/date-picker";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";

type BatchStatus = "Draft" | "Enrolling" | "Active" | "Paused" | "Completed" | "Cancelled";
type BatchType = "Live" | "Hybrid" | "RecordedOnly";
type CourseItem = { id: string; name: string; programId: string; programName: string };
type Faculty = { id: string; name: string };

type BatchItem = {
  id: string;
  name: string;
  code: string;
  courseId: string;
  programId: string;
  type: BatchType;
  startDate?: number;
  endDate?: number;
  classDays: string[];
  timeFrom?: number;
  timeTo?: number;
  timezone?: string;
  primaryFacultyId?: string;
  coFacultyIds?: string[];
  meetingPlatform?: "Zoom" | "GoogleMeet" | "Custom";
  meetingLink?: string;
  recurring?: boolean;
  capacity?: number;
  autoClose?: boolean;
  allowMidEnroll?: "Anytime" | "AdminOnlyAfterX" | "No";
  midEnrollAfterSessions?: number;
  notifyBeforeClass?: boolean;
  notifyAfterClass?: boolean;
  notifyDailyAttendance?: boolean;
  studentsCount: number;
  status: BatchStatus;
  createdAt: number;
};

type SessionStatus = "Completed" | "Upcoming" | "Cancelled";
type SessionItem = {
  id: string;
  batchId: string;
  title: string;
  date: number;
  from?: number;
  to?: number;
  facultyId?: string;
  status: SessionStatus;
};

function readCourses(): CourseItem[] {
  try { const raw = localStorage.getItem("courses"); if (raw) return JSON.parse(raw) as CourseItem[]; } catch {}
  return [];
}
function readFaculty(): Faculty[] {
  try { const raw = localStorage.getItem("faculty"); if (raw) return JSON.parse(raw) as Faculty[]; } catch {}
  return [ { id: "john", name: "John Mathew" }, { id: "sarah", name: "Sarah Johnson" }, { id: "rahul", name: "Rahul Dev" } ];
}
function readBatches(): BatchItem[] {
  try { const raw = localStorage.getItem("batches"); if (raw) return JSON.parse(raw) as BatchItem[]; } catch {}
  return [];
}
function writeBatches(items: BatchItem[]) { try { localStorage.setItem("batches", JSON.stringify(items)); } catch {} }

function readSessions(batchId: string): SessionItem[] {
  try { const raw = localStorage.getItem(`sessions:${batchId}`); if (raw) return JSON.parse(raw) as SessionItem[]; } catch {}
  return [];
}
function writeSessions(batchId: string, items: SessionItem[]) { try { localStorage.setItem(`sessions:${batchId}`, JSON.stringify(items)); } catch {} }

export default function BatchDetailsPage() {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const courses = readCourses();
  const faculty = readFaculty();

  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [batch, setBatch] = useState<BatchItem | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [tab, setTab] = useState<"overview" | "sessions" | "students" | "attendance" | "faculty" | "resources">("overview");
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dragSessionId, setDragSessionId] = useState<string | null>(null);

  const [sTitle, setSTitle] = useState("");
  const [sDate, setSDate] = useState<number | undefined>(undefined);
  const [sFrom, setSFrom] = useState<number | undefined>(undefined);
  const [sTo, setSTo] = useState<number | undefined>(undefined);
  const [sFacultyId, setSFacultyId] = useState<string>(faculty[0]?.id || "");
  const [sStatus, setSStatus] = useState<SessionStatus>("Upcoming");

  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => { setBatches(readBatches()); }, []);
  useEffect(() => { const it = batches.find((x) => x.id === batchId); setBatch(it || null); }, [batches, batchId]);
  useEffect(() => { if (batchId) setSessions(readSessions(batchId)); }, [batchId]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);

  const courseName = useMemo(() => (batch ? courses.find((c) => c.id === batch.courseId)?.name || batch.courseId : ""), [batch, courses]);
  const facultyName = useMemo(() => (batch && batch.primaryFacultyId ? faculty.find((f) => f.id === batch.primaryFacultyId)?.name || batch.primaryFacultyId : "-"), [batch, faculty]);

  const formatDateRange = (b: BatchItem | null) => {
    if (!b) return "";
    if (b.startDate && b.endDate) {
      const f = (t: number) => new Date(t).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      return `${f(b.startDate)} – ${f(b.endDate)}`;
    }
    return "Ongoing";
  };

  const nextSession = useMemo(() => {
    const upcoming = sessions.filter((s) => s.status === "Upcoming" && s.date >= now).sort((a, b) => a.date - b.date);
    return upcoming[0] || null;
  }, [sessions, now]);

  const quickStats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === "Completed").length;
    const upcoming = sessions.filter((s) => s.status === "Upcoming").length;
    return { total, completed, upcoming, attendanceAvg: 82 };
  }, [sessions]);

  const saveSession = () => {
    if (!batch) return;
    const title = sTitle.trim();
    if (!title || !sDate) return;
    const id = `session-${Date.now()}`;
    const item: SessionItem = { id, batchId: batch.id, title, date: sDate, from: sFrom, to: sTo, facultyId: sFacultyId || undefined, status: sStatus };
    setSessions((prev) => { const next = [...prev, item].sort((a, b) => a.date - b.date); writeSessions(batch.id, next); return next; });
    setIsSessionDrawerOpen(false);
  };

  const updateBatch = (updater: (b: BatchItem) => BatchItem) => {
    if (!batch) return;
    setBatches((prev) => { const next = prev.map((x) => (x.id === batch.id ? updater(x) : x)); writeBatches(next); return next; });
    setBatch((b) => (b ? updater(b) : b));
  };

  const closeBatch = () => { updateBatch((b) => ({ ...b, status: "Completed" })); };
  const editBatch = () => { if (!batch) return; navigate(`/batches?edit=${batch.id}`); };

  return (
    <>
      <PageMeta title={batch ? batch.name : "Manage Batch"} description="Manage sessions, students, attendance and faculty" />
      <PageBreadcrumb pageTitle="Manage Batch" />
      <ComponentCard title={batch ? `${batch.name} (${batch.status})` : "Manage Batch"}>
        {!batch ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="text-3xl">📅</div>
            <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">No batches created yet</div>
            <div className="mt-1 text-theme-xs text-gray-500">Batches help organize live classes and track student progress.</div>
            <div className="mt-4"><Button onClick={() => navigate("/batches")}>Create First Batch</Button></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="text-theme-xs text-gray-600">Course: {courseName}</div>
              <div className="text-theme-xs text-gray-600">Faculty: {facultyName}</div>
              <div className="text-theme-xs text-gray-600">Students: {batch.studentsCount}</div>
              <div className="mt-2 flex items-center gap-2">
                <Button variant="outline" onClick={editBatch}>Edit Batch</Button>
                <Button variant="outline" onClick={() => setIsSessionDrawerOpen(true)}>Add Session</Button>
                <Button variant="outline" onClick={() => setTab("attendance")}>View Attendance</Button>
                <Button variant="outline" onClick={() => setTab("students")}>Add Students</Button>
                <Button variant="outline" onClick={closeBatch}>Close Batch</Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button className={`inline-flex items-center rounded-full border px-3 py-1 text-theme-xs ${tab === "overview" ? "border-brand-500 text-brand-600" : "border-gray-200 text-gray-600"}`} onClick={() => setTab("overview")}>Overview</button>
              <button className={`inline-flex items-center rounded-full border px-3 py-1 text-theme-xs ${tab === "sessions" ? "border-brand-500 text-brand-600" : "border-gray-200 text-gray-600"}`} onClick={() => setTab("sessions")}>Sessions</button>
              <button className={`inline-flex items-center rounded-full border px-3 py-1 text-theme-xs ${tab === "students" ? "border-brand-500 text-brand-600" : "border-gray-200 text-gray-600"}`} onClick={() => setTab("students")}>Students</button>
              <button className={`inline-flex items-center rounded-full border px-3 py-1 text-theme-xs ${tab === "attendance" ? "border-brand-500 text-brand-600" : "border-gray-200 text-gray-600"}`} onClick={() => setTab("attendance")}>Attendance</button>
              <button className={`inline-flex items-center rounded-full border px-3 py-1 text-theme-xs ${tab === "faculty" ? "border-brand-500 text-brand-600" : "border-gray-200 text-gray-600"}`} onClick={() => setTab("faculty")}>Faculty</button>
              <button className={`inline-flex items-center rounded-full border px-3 py-1 text-theme-xs ${tab === "resources" ? "border-brand-500 text-brand-600" : "border-gray-200 text-gray-600"}`} onClick={() => setTab("resources")}>Resources</button>
            </div>

            {tab === "overview" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Batch Summary</div>
                  <div className="mt-2 text-theme-xs text-gray-600">Dates: {formatDateRange(batch)}</div>
                  <div className="mt-1 text-theme-xs text-gray-600">Class days: {(batch.classDays || []).join(", ")}</div>
                  <div className="mt-1 text-theme-xs text-gray-600">Meeting link: {batch.meetingLink || "-"}</div>
                  <div className="mt-1 text-theme-xs text-gray-600">Faculty: {facultyName}</div>
                  <div className="mt-1 text-theme-xs text-gray-600">Capacity: {batch.capacity || "-"}</div>
                  <div className="mt-1 text-theme-xs text-gray-600">Status: {batch.status}</div>
                  <div className="mt-2 text-theme-xs text-gray-600">Next session: {nextSession ? new Date(nextSession.date).toLocaleString("en-IN", { month: "short", day: "numeric" }) : "—"}</div>
                  {nextSession && (
                    <div className="mt-2 inline-flex items-center rounded-full border px-3 py-1 text-theme-xs text-gray-700">Live in {Math.ceil((nextSession.date - now) / (3600 * 1000))}h</div>
                  )}
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Quick Stats</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-gray-200 p-3 text-theme-xs text-gray-700">Total Sessions: {quickStats.total}</div>
                    <div className="rounded-lg border border-gray-200 p-3 text-theme-xs text-gray-700">Completed: {quickStats.completed}</div>
                    <div className="rounded-lg border border-gray-200 p-3 text-theme-xs text-gray-700">Upcoming: {quickStats.upcoming}</div>
                    <div className="rounded-lg border border-gray-200 p-3 text-theme-xs text-gray-700">Attendance Avg: {quickStats.attendanceAvg}%</div>
                  </div>
                </div>
              </div>
            )}

            {tab === "sessions" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-theme-sm text-gray-800 dark:text-white/90">Session List</div>
                  <Button variant="outline" onClick={() => setIsSessionDrawerOpen(true)}>Add Session</Button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="max-w-full overflow-x-auto">
                    <Table>
                      <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <TableRow>
                          <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">#</TableCell>
                          <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Date</TableCell>
                          <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Title</TableCell>
                          <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Time</TableCell>
                          <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Status</TableCell>
                          <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                        {sessions.map((s, idx) => (
                          <TableRow key={s.id} className={`${s.status === "Cancelled" ? "opacity-50" : s.status === "Completed" ? "" : ""}`}>
                            <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">
                              <div draggable onDragStart={() => setDragSessionId(s.id)} onDragOver={(e: any) => e.preventDefault()} onDrop={() => { const fromId = dragSessionId; const toId = s.id; if (!fromId || fromId === toId || !batch) return; setSessions((prev) => { const fromIndex = prev.findIndex((x) => x.id === fromId); const toIndex = prev.findIndex((x) => x.id === toId); if (fromIndex < 0 || toIndex < 0) return prev; const next = [...prev]; const [m] = next.splice(fromIndex, 1); next.splice(toIndex, 0, m); writeSessions(batch.id, next); return next; }); }}>
                                #{idx + 1}
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</TableCell>
                            <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{s.title}</TableCell>
                            <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{s.from && s.to ? `${String(Math.floor((s.from || 0)/3600000)).padStart(2,"0")}:${String(Math.floor(((s.from || 0)%3600000)/60000)).padStart(2,"0")} – ${String(Math.floor((s.to || 0)/3600000)).padStart(2,"0")}:${String(Math.floor(((s.to || 0)%3600000)/60000)).padStart(2,"0")}` : "-"}</TableCell>
                            <TableCell className="px-5 py-4 text-start">{s.status === "Completed" ? (<span className="inline-flex items-center text-success-600">• Completed</span>) : s.status === "Upcoming" ? (<span className="inline-flex items-center text-brand-600">• Upcoming</span>) : (<span className="inline-flex items-center text-error-600">• Cancelled</span>)}</TableCell>
                            <TableCell className="px-5 py-4 text-start">
                              <div className="relative">
                                <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === s.id ? null : s.id))}>⋮</button>
                                <Dropdown isOpen={openMenuId === s.id} onClose={() => setOpenMenuId(null)}>
                                  <DropdownItem onClick={() => { setOpenMenuId(null); setIsSessionDrawerOpen(true); setSTitle(s.title); setSDate(s.date); setSFrom(s.from); setSTo(s.to); setSFacultyId(s.facultyId || ""); setSStatus(s.status); }}>Edit Session</DropdownItem>
                                  <DropdownItem onClick={() => { setOpenMenuId(null); setSessions((prev) => { const next = prev.map((x) => (x.id === s.id ? { ...x, status: "Completed" as SessionStatus } : x)); if (batch) writeSessions(batch.id, next); return next; }); }}>Mark Completed</DropdownItem>
                                  <DropdownItem onClick={() => { setOpenMenuId(null); }}>Upload Recording</DropdownItem>
                                  <DropdownItem onClick={() => { setOpenMenuId(null); }}>Send Notification</DropdownItem>
                                  <DropdownItem onClick={() => { setOpenMenuId(null); setSessions((prev) => { const next = prev.map((x) => (x.id === s.id ? { ...x, date: (x.date || Date.now()) + 24*3600*1000 } : x)).sort((a,b)=>a.date-b.date); if (batch) writeSessions(batch.id, next); return next; }); }}>Reschedule +1 day</DropdownItem>
                                  <DropdownItem onClick={() => { setOpenMenuId(null); setSessions((prev) => { const next = prev.map((x) => (x.id === s.id ? { ...x, status: "Cancelled" as SessionStatus } : x)); if (batch) writeSessions(batch.id, next); return next; }); }}>Cancel Session</DropdownItem>
                                </Dropdown>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {tab === "students" && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Students</div>
                <div className="mt-2 text-theme-xs text-gray-600">Attach, remove or move students between batches.</div>
              </div>
            )}

            {tab === "attendance" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Session-wise Attendance</div>
                  <div className="mt-2 text-theme-xs text-gray-600">Pick a session to mark attendance.</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Student-wise Attendance</div>
                  <div className="mt-2 text-theme-xs text-gray-600">Shows per-student attendance summary.</div>
                </div>
              </div>
            )}

            {tab === "faculty" && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Faculty Assignment</div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-theme-xs text-gray-600">Primary Faculty</div>
                    <Select options={faculty.map((f) => ({ value: f.id, label: f.name }))} defaultValue={batch.primaryFacultyId || faculty[0]?.id} onChange={(v) => { const id = v as string; updateBatch((b) => ({ ...b, primaryFacultyId: id })); }} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Co-Faculty</div>
                    <Input value={(batch.coFacultyIds || []).map((id) => faculty.find((f) => f.id === id)?.name || id).join(", ")} onChange={() => {}} />
                  </div>
                </div>
                <div className="mt-2 text-error-600 text-theme-xs">⚠ {facultyName !== "-" ? `${facultyName} has another class at 6 PM` : "No conflicts"}</div>
              </div>
            )}

            {tab === "resources" && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Resources</div>
                <div className="mt-2 text-theme-xs text-gray-600">Upload PDFs, assignments and recordings.</div>
              </div>
            )}
          </div>
        )}
      </ComponentCard>

      <Modal isOpen={isSessionDrawerOpen} onClose={() => setIsSessionDrawerOpen(false)} isFullscreen>
        <div className="fixed inset-0 flex justify-end">
          <div className="flex-1" onClick={() => setIsSessionDrawerOpen(false)} />
          <div className="h-full w-full max-w-xl bg-white shadow-2xl dark:bg-gray-900 animate-[slideIn_0.28s_ease-out]">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={() => setIsSessionDrawerOpen(false)}>←</button>
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Create Session</div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div>
                  <div className="text-theme-xs text-gray-600">Session Title</div>
                  <Input value={sTitle} onChange={(e) => setSTitle(e.target.value)} />
                </div>
                <div>
                  <DatePicker id="sess-date" mode="single" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setSDate(d.getTime()); }} label="Date" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DatePicker id="sess-from" mode="time" enableTime dateFormat="h:i K" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setSFrom(d.getHours() * 3600 * 1000 + d.getMinutes() * 60 * 1000); }} label="From" />
                  <DatePicker id="sess-to" mode="time" enableTime dateFormat="h:i K" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setSTo(d.getHours() * 3600 * 1000 + d.getMinutes() * 60 * 1000); }} label="To" />
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Faculty</div>
                  <Select options={faculty.map((f) => ({ value: f.id, label: f.name }))} defaultValue={sFacultyId} onChange={(v) => setSFacultyId(v as string)} />
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Status</div>
                  <Select options={[{ value: "Upcoming", label: "Upcoming" }, { value: "Completed", label: "Completed" }, { value: "Cancelled", label: "Cancelled" }]} defaultValue={sStatus} onChange={(v) => setSStatus(v as SessionStatus)} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                <Button variant="outline" onClick={() => setIsSessionDrawerOpen(false)}>Cancel</Button>
                <Button onClick={saveSession}>Create Session</Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <button className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-white shadow-lg sm:hidden" onClick={() => setIsSessionDrawerOpen(true)}>
        <span>+ Add Session</span>
      </button>
    </>
  );
}