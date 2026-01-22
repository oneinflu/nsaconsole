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
import Switch from "../../components/form/switch/Switch";
import MultiSelect from "../../components/form/MultiSelect";
import { PlusIcon, MoreDotIcon } from "../../icons";
import { useNavigate } from "react-router";

type BatchStatus = "Draft" | "Enrolling" | "Active" | "Paused" | "Completed" | "Cancelled";
type BatchType = "Live" | "Hybrid" | "RecordedOnly";
type Program = { id: string; name: string };
type CourseItem = { id: string; name: string; programId: string; programName: string };
type Faculty = { id: string; name: string };

type BatchItem = {
  id: string;
  name: string;
  code: string;
  courseId: string;
  programId: string;
  type: BatchType;
  visibility?: "Public" | "Private";
  tags?: string[];
  mode?: "weekday" | "weekend" | "custom";
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
  notifyBeforeMinutes?: number;
  notifySmsBeforeClass?: boolean;
  notifySmsMinutes?: number;
  notifyAfterClass?: boolean;
  notifyDailyAttendance?: boolean;
  autoRecord?: boolean;
  autoArchiveDays?: number;
  priorityOrder?: number;
  publishDate?: number;
  facultyNotes?: string;
  changeNotes?: string;
  studentsCount: number;
  status: BatchStatus;
  createdAt: number;
};

function readPrograms(): Program[] {
  try {
    const raw = localStorage.getItem("programs");
    if (raw) return JSON.parse(raw) as Program[];
  } catch {}
  return [
    { id: "cpa-us", name: "CPA US" },
    { id: "acca", name: "ACCA" },
  ];
}

function readCourses(): CourseItem[] {
  try {
    const raw = localStorage.getItem("courses");
    if (raw) return JSON.parse(raw) as CourseItem[];
  } catch {}
  return [
    { id: "far", name: "CPA US – FAR", programId: "cpa-us", programName: "CPA US" },
    { id: "aud", name: "CPA US – AUD", programId: "cpa-us", programName: "CPA US" },
    { id: "acca-skills", name: "ACCA – Skills", programId: "acca", programName: "ACCA" },
    { id: "mern", name: "MERN Bootcamp", programId: "coding", programName: "Coding" },
  ];
}

function readFaculty(): Faculty[] {
  try {
    const raw = localStorage.getItem("faculty");
    if (raw) return JSON.parse(raw) as Faculty[];
  } catch {}
  return [
    { id: "john", name: "John Mathew" },
    { id: "sarah", name: "Sarah Johnson" },
    { id: "rahul", name: "Rahul Dev" },
  ];
}

function seedBatches(faculty: Faculty[]): BatchItem[] {
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  return [
    { id: "batch-far-jan-25", name: "FAR – Jan 2025", code: "FAR-JAN-25", courseId: "far", programId: "cpa-us", type: "Live", startDate: now + 46 * day, endDate: now + 106 * day, classDays: ["Monday", "Wednesday"], timeFrom: 18 * 3600 * 1000, timeTo: 20 * 3600 * 1000, timezone: "IST", primaryFacultyId: faculty[0]?.id, studentsCount: 42, status: "Active", createdAt: now - 2 * day },
    { id: "batch-aud-weekend", name: "AUD – Weekend", code: "AUD-WKND-25", courseId: "aud", programId: "cpa-us", type: "Live", startDate: now + 60 * day, endDate: now + 130 * day, classDays: ["Saturday"], timeFrom: 10 * 3600 * 1000, timeTo: 12 * 3600 * 1000, timezone: "IST", primaryFacultyId: faculty[1]?.id, studentsCount: 30, status: "Enrolling", createdAt: now - 10 * day },
    { id: "batch-acca-skill-mk1", name: "ACCA Skill Mk1", code: "ACCA-MK1", courseId: "acca-skills", programId: "acca", type: "Hybrid", classDays: ["Tuesday"], studentsCount: 18, status: "Completed", createdAt: now - 200 * day },
    { id: "batch-mern-cohort-1", name: "MERN Cohort 1", code: "MERN-1", courseId: "mern", programId: "coding", type: "Live", classDays: ["Monday", "Wednesday", "Friday"], timeFrom: 18 * 3600 * 1000, timeTo: 20 * 3600 * 1000, timezone: "IST", primaryFacultyId: faculty[2]?.id, studentsCount: 52, status: "Active", createdAt: now - 5 * day },
  ];
}

function readBatches(): BatchItem[] {
  try {
    const raw = localStorage.getItem("batches");
    if (raw) return JSON.parse(raw) as BatchItem[];
  } catch {}
  const faculty = readFaculty();
  return seedBatches(faculty);
}

function writeBatches(items: BatchItem[]) {
  try { localStorage.setItem("batches", JSON.stringify(items)); } catch {}
}

export default function BatchesPage() {
  const navigate = useNavigate();
  const programs = readPrograms();
  const courses = readCourses();
  const faculty = readFaculty();

  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string | "All">("All");
  const [programFilter, setProgramFilter] = useState<string | "All">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | BatchStatus>("All");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [dName, setDName] = useState("");
  const [dCode, setDCode] = useState("");
  const [dCourseId, setDCourseId] = useState<string>(courses[0]?.id || "");
  const [dProgramId, setDProgramId] = useState<string>(courses[0]?.programId || "");
  const [dType, setDType] = useState<BatchType>("Live");
  const [dStart, setDStart] = useState<number | undefined>(undefined);
  const [dEnd, setDEnd] = useState<number | undefined>(undefined);
  const [dDays, setDDays] = useState<string[]>([]);
  const [dFrom, setDFrom] = useState<number | undefined>(undefined);
  const [dTo, setDTo] = useState<number | undefined>(undefined);
  const [dTimezone, setDTimezone] = useState<string>("IST");
  const [dPrimaryFaculty, setDPrimaryFaculty] = useState<string>(faculty[0]?.id || "");
  const [dCoFaculty, setDCoFaculty] = useState<string[]>([]);
  const [dMeetingPlatform, setDMeetingPlatform] = useState<"Zoom" | "GoogleMeet" | "Custom">("Zoom");
  const [dMeetingLink, setDMeetingLink] = useState<string>("");
  const [dRecurring, setDRecurring] = useState<boolean>(false);
  const [dCapacity, setDCapacity] = useState<number>(50);
  const [dAutoClose, setDAutoClose] = useState<boolean>(true);
  const [dAllowMidEnroll, setDAllowMidEnroll] = useState<"Anytime" | "AdminOnlyAfterX" | "No">("Anytime");
  const [dMidAfter, setDMidAfter] = useState<number>(0);
  const [dNotifyBefore, setDNotifyBefore] = useState<boolean>(true);
  const [dNotifyAfter, setDNotifyAfter] = useState<boolean>(true);
  const [dNotifyDaily, setDNotifyDaily] = useState<boolean>(true);
  const [dStatus, setDStatus] = useState<BatchStatus>("Active");
  const [dStudentsCount, setDStudentsCount] = useState<number>(0);
  const [dVisibility, setDVisibility] = useState<"Public" | "Private">("Public");
  const [dTags, setDTags] = useState<string>("");
  const [dMode, setDMode] = useState<"weekday" | "weekend" | "custom">("weekday");
  const [dNotifyBeforeMinutes, setDNotifyBeforeMinutes] = useState<number>(30);
  const [dNotifySmsBefore, setDNotifySmsBefore] = useState<boolean>(false);
  const [dNotifySmsMinutes, setDNotifySmsMinutes] = useState<number>(30);
  const [dAutoRecord, setDAutoRecord] = useState<boolean>(false);
  const [dAutoArchiveDays, setDAutoArchiveDays] = useState<number>(0);
  const [dPriorityOrder, setDPriorityOrder] = useState<number>(0);
  const [dPublishDate, setDPublishDate] = useState<number | undefined>(undefined);
  const [dFacultyNotes, setDFacultyNotes] = useState<string>("");
  const [dChangeNotes, setDChangeNotes] = useState<string>("");
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [showGuard, setShowGuard] = useState<boolean>(false);
  const [guardMessage, setGuardMessage] = useState<string>("");

  useEffect(() => {
    setBatches(readBatches());
  }, []);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let arr = batches.filter((b) => {
      const matchTxt = txt ? [b.name, b.code].some((v) => v.toLowerCase().includes(txt)) : true;
      const matchCourse = courseFilter === "All" ? true : b.courseId === courseFilter;
      const matchProgram = programFilter === "All" ? true : b.programId === programFilter;
      const matchStatus = statusFilter === "All" ? true : b.status === statusFilter;
      return matchTxt && matchCourse && matchProgram && matchStatus;
    });
    arr = arr.sort((a, b) => b.createdAt - a.createdAt);
    return arr;
  }, [batches, search, courseFilter, programFilter, statusFilter]);

  const openCreate = () => {
    setIsDrawerOpen(true);
    setDName("");
    setDCode("");
    setDCourseId(courses[0]?.id || "");
    setDProgramId(courses[0]?.programId || "");
    setDType("Live");
    setDStart(undefined);
    setDEnd(undefined);
    setDDays([]);
    setDFrom(undefined);
    setDTo(undefined);
    setDTimezone("IST");
    setDPrimaryFaculty(faculty[0]?.id || "");
    setDCoFaculty([]);
    setDMeetingPlatform("Zoom");
    setDMeetingLink("");
    setDRecurring(false);
    setDCapacity(50);
    setDAutoClose(true);
    setDAllowMidEnroll("Anytime");
    setDMidAfter(0);
    setDNotifyBefore(true);
    setDNotifyBeforeMinutes(30);
    setDNotifySmsBefore(false);
    setDNotifySmsMinutes(30);
    setDNotifyAfter(true);
    setDNotifyDaily(true);
    setDStatus("Draft");
    setDStudentsCount(0);
    setDVisibility("Public");
    setDTags("");
    setDMode("weekday");
    setDAutoRecord(false);
    setDAutoArchiveDays(0);
    setDPriorityOrder(0);
    setDPublishDate(undefined);
    setDFacultyNotes("");
    setDChangeNotes("");
    setDraftSavedAt(null);
  };

  const saveBatch = () => {
    const name = dName.trim();
    const code = dCode.trim();
    if (!name || !code || !dCourseId) return;
    const id = `batch-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const item: BatchItem = {
      id,
      name,
      code,
      courseId: dCourseId,
      programId: dProgramId,
      type: dType,
      visibility: dVisibility,
      tags: dTags ? dTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      mode: dMode,
      startDate: dStart,
      endDate: dEnd,
      classDays: dDays,
      timeFrom: dFrom,
      timeTo: dTo,
      timezone: dTimezone,
      primaryFacultyId: dPrimaryFaculty || undefined,
      coFacultyIds: dCoFaculty.length ? dCoFaculty : undefined,
      meetingPlatform: dMeetingPlatform,
      meetingLink: dMeetingLink || undefined,
      recurring: dRecurring || undefined,
      capacity: dCapacity || undefined,
      autoClose: dAutoClose || undefined,
      allowMidEnroll: dAllowMidEnroll || undefined,
      midEnrollAfterSessions: dAllowMidEnroll === "AdminOnlyAfterX" ? dMidAfter || 0 : undefined,
      notifyBeforeClass: dNotifyBefore || undefined,
      notifyBeforeMinutes: dNotifyBefore ? dNotifyBeforeMinutes : undefined,
      notifySmsBeforeClass: dNotifySmsBefore || undefined,
      notifySmsMinutes: dNotifySmsBefore ? dNotifySmsMinutes : undefined,
      notifyAfterClass: dNotifyAfter || undefined,
      notifyDailyAttendance: dNotifyDaily || undefined,
      autoRecord: dAutoRecord || undefined,
      autoArchiveDays: dAutoArchiveDays || undefined,
      priorityOrder: dPriorityOrder || undefined,
      publishDate: dPublishDate,
      facultyNotes: dFacultyNotes || undefined,
      changeNotes: dChangeNotes || undefined,
      studentsCount: dStudentsCount || 0,
      status: dStatus,
      createdAt: Date.now(),
    };
    setBatches((prev) => {
      const exists = prev.some((x) => x.id === id);
      const next = exists ? prev.map((x) => (x.id === id ? item : x)) : [item, ...prev];
      writeBatches(next);
      return next;
    });
    setIsDrawerOpen(false);
  };

  const duplicateBatch = (id: string) => {
    const it = batches.find((x) => x.id === id);
    if (!it) return;
    const copy: BatchItem = { ...it, id: `${it.id}-copy-${Date.now()}`, name: `${it.name} Copy`, code: `${it.code}-COPY`, createdAt: Date.now() };
    setBatches((prev) => {
      const next = [copy, ...prev];
      writeBatches(next);
      return next;
    });
  };

  const deleteBatch = (id: string) => {
    const ok = window.confirm("Delete this batch?");
    if (!ok) return;
    setBatches((prev) => {
      const next = prev.filter((x) => x.id !== id);
      writeBatches(next);
      return next;
    });
  };

  const openEdit = (it: BatchItem) => {
    setEditId(it.id);
    setIsEditOpen(true);
    setDName(it.name);
    setDCode(it.code);
    setDCourseId(it.courseId);
    setDProgramId(it.programId);
    setDType(it.type);
    setDVisibility(it.visibility || "Public");
    setDTags((it.tags || []).join(", "));
    setDMode(it.mode || "weekday");
    setDStart(it.startDate);
    setDEnd(it.endDate);
    setDDays(it.classDays || []);
    setDFrom(it.timeFrom);
    setDTo(it.timeTo);
    setDTimezone(it.timezone || "IST");
    setDPrimaryFaculty(it.primaryFacultyId || "");
    setDCoFaculty(it.coFacultyIds || []);
    setDMeetingPlatform(it.meetingPlatform || "Zoom");
    setDMeetingLink(it.meetingLink || "");
    setDRecurring(!!it.recurring);
    setDCapacity(it.capacity || 0);
    setDAutoClose(!!it.autoClose);
    setDAllowMidEnroll(it.allowMidEnroll || "Anytime");
    setDMidAfter(it.midEnrollAfterSessions || 0);
    setDNotifyBefore(!!it.notifyBeforeClass);
    setDNotifyBeforeMinutes(it.notifyBeforeMinutes || 30);
    setDNotifySmsBefore(!!it.notifySmsBeforeClass);
    setDNotifySmsMinutes(it.notifySmsMinutes || 30);
    setDNotifyAfter(!!it.notifyAfterClass);
    setDNotifyDaily(!!it.notifyDailyAttendance);
    setDStatus(it.status);
    setDStudentsCount(it.studentsCount || 0);
    setDAutoRecord(!!it.autoRecord);
    setDAutoArchiveDays(it.autoArchiveDays || 0);
    setDPriorityOrder(it.priorityOrder || 0);
    setDPublishDate(it.publishDate);
    setDFacultyNotes(it.facultyNotes || "");
    setDChangeNotes(it.changeNotes || "");
    setDraftSavedAt(null);
  };

  const savePublishEdit = () => {
    if (!editId) return;
    const it = batches.find((x) => x.id === editId);
    if (!it) return;
    const earlierStart = it.startDate && dStart && dStart < it.startDate;
    const timezoneChanged = (it.timezone || "") !== (dTimezone || "");
    const daysChanged = (it.classDays || []).join(",") !== (dDays || []).join(",");
    const criticalChange = (it.studentsCount || 0) > 0 && (earlierStart || timezoneChanged || daysChanged);
    if (criticalChange) {
      setGuardMessage("Changing schedule/timezone affects enrolled students. Confirm to proceed.");
      setShowGuard(true);
      return;
    }
    const updated: BatchItem = { ...it, name: dName, code: dCode, courseId: dCourseId, programId: dProgramId, type: dType, visibility: dVisibility, tags: dTags ? dTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined, mode: dMode, startDate: dStart, endDate: dEnd, classDays: dDays, timeFrom: dFrom, timeTo: dTo, timezone: dTimezone, primaryFacultyId: dPrimaryFaculty || undefined, coFacultyIds: dCoFaculty.length ? dCoFaculty : undefined, meetingPlatform: dMeetingPlatform, meetingLink: dMeetingLink || undefined, recurring: dRecurring || undefined, capacity: dCapacity || undefined, autoClose: dAutoClose || undefined, allowMidEnroll: dAllowMidEnroll || undefined, midEnrollAfterSessions: dAllowMidEnroll === "AdminOnlyAfterX" ? dMidAfter || 0 : undefined, notifyBeforeClass: dNotifyBefore || undefined, notifyBeforeMinutes: dNotifyBefore ? dNotifyBeforeMinutes : undefined, notifySmsBeforeClass: dNotifySmsBefore || undefined, notifySmsMinutes: dNotifySmsBefore ? dNotifySmsMinutes : undefined, notifyAfterClass: dNotifyAfter || undefined, notifyDailyAttendance: dNotifyDaily || undefined, autoRecord: dAutoRecord || undefined, autoArchiveDays: dAutoArchiveDays || undefined, priorityOrder: dPriorityOrder || undefined, publishDate: dPublishDate, facultyNotes: dFacultyNotes || undefined, changeNotes: dChangeNotes || undefined, status: "Active", studentsCount: dStudentsCount };
    const next = batches.map((x) => (x.id === editId ? updated : x));
    writeBatches(next);
    setBatches(next);
    setIsEditOpen(false);
  };

  const confirmGuardProceed = () => {
    setShowGuard(false);
    savePublishEdit();
  };

  const formatSchedule = (b: BatchItem) => {
    if (b.startDate && b.endDate) {
      const f = (t: number) => new Date(t).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      return `${f(b.startDate)}–${f(b.endDate)}`;
    }
    return "Ongoing";
  };

  return (
    <>
      <PageMeta title="Batch Management" description="Manage live class batches, schedule sessions, track attendance & assign faculty." />
      <PageBreadcrumb pageTitle="Batch Management" />
      <ComponentCard title="Batch Management">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-xl">
              <Input placeholder="Search batch" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Select options={[{ value: "All", label: "All Courses" }, ...courses.map((c) => ({ value: c.id, label: c.name }))]} defaultValue={courseFilter} onChange={(v) => setCourseFilter(v as typeof courseFilter)} />
              <Select options={[{ value: "All", label: "All Programs" }, ...readPrograms().map((p) => ({ value: p.id, label: p.name }))]} defaultValue={programFilter} onChange={(v) => setProgramFilter(v as typeof programFilter)} />
              <Select options={[{ value: "All", label: "All" }, { value: "Active", label: "Active" }, { value: "Enrolling", label: "Enrolling" }, { value: "Completed", label: "Completed" }, { value: "Cancelled", label: "Cancelled" }]} defaultValue={statusFilter} onChange={(v) => setStatusFilter(v as typeof statusFilter)} />
              <Button onClick={openCreate} startIcon={<PlusIcon className="w-4 h-4" />}>Create Batch</Button>
            </div>
          </div>

          {batches.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-3xl">📅</div>
              <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">No batches created yet</div>
              <div className="mt-1 text-theme-xs text-gray-500">Batches help organize live classes and track student progress.</div>
              <div className="mt-4">
                <Button onClick={openCreate} startIcon={<PlusIcon className="w-4 h-4" />}>Create First Batch</Button>
              </div>
            </div>
          )}

          {batches.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Batch Name</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Course</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Start–End</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Faculty</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Students</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Status</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {filtered.map((b) => (
                      <TableRow key={b.id} className="transition hover:bg-gray-50">
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          <button className="underline decoration-dotted" onClick={() => navigate(`/batches/${b.id}`)}>{b.name}</button>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{courses.find((c) => c.id === b.courseId)?.name || b.courseId}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{formatSchedule(b)}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{b.primaryFacultyId ? faculty.find((f) => f.id === b.primaryFacultyId)?.name || b.primaryFacultyId : "-"}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{b.studentsCount}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          {b.status === "Active" ? (
                            <span className="inline-flex items-center text-success-600">• Active</span>
                          ) : b.status === "Enrolling" ? (
                            <span className="inline-flex items-center text-brand-600">• Enrolling</span>
                          ) : b.status === "Completed" ? (
                            <span className="inline-flex items-center text-gray-400">• Completed</span>
                          ) : (
                            <span className="inline-flex items-center text-error-600">• Cancelled</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="relative flex items-center gap-2">
                            <Button variant="outline" onClick={() => navigate(`/batches/${b.id}`)}>Manage</Button>
                            <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === b.id ? null : b.id))}>
                              <MoreDotIcon className="w-4 h-4" />
                            </button>
                            <Dropdown isOpen={openMenuId === b.id} onClose={() => setOpenMenuId(null)}>
                              <DropdownItem onClick={() => { setOpenMenuId(null); openEdit(b); }}>Edit</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); duplicateBatch(b.id); }}>Duplicate</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); deleteBatch(b.id); }}>Delete</DropdownItem>
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
          <div className="h-full w-full max-w-xl bg-white shadow-2xl dark:bg-gray-900 animate-[slideIn_0.28s_ease-out]">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={() => setIsDrawerOpen(false)}>←</button>
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Create Batch</div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div>
                  <div className="text-theme-xs text-gray-600">Batch Name</div>
                  <Input value={dName} onChange={(e) => setDName(e.target.value)} />
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Batch Code</div>
                  <Input value={dCode} onChange={(e) => setDCode(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-theme-xs text-gray-600">Course</div>
                    <Select options={courses.map((c) => ({ value: c.id, label: c.name }))} defaultValue={dCourseId} onChange={(v) => { setDCourseId(v as string); const c = courses.find((x) => x.id === (v as string)); setDProgramId(c?.programId || ""); }} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Program</div>
                    <Input value={programs.find((p) => p.id === dProgramId)?.name || dProgramId} onChange={() => {}} />
                  </div>
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Batch Type</div>
                  <Select options={[{ value: "Live", label: "Live Classes" }, { value: "Hybrid", label: "Hybrid" }, { value: "RecordedOnly", label: "Recorded Only" }]} defaultValue={dType} onChange={(v) => setDType(v as BatchType)} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DatePicker id="batch-start" mode="single" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setDStart(d.getTime()); }} label="Start Date" />
                  <DatePicker id="batch-end" mode="single" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setDEnd(d.getTime()); }} label="End Date" />
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Class Days</div>
                  <MultiSelect label="Select Days" options={["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) => ({ value: d, text: d }))} value={dDays} onChange={(vals) => setDDays(vals)} placeholder="Select" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DatePicker id="batch-from" mode="time" enableTime dateFormat="h:i K" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setDFrom(d.getHours() * 3600 * 1000 + d.getMinutes() * 60 * 1000); }} label="From" />
                  <DatePicker id="batch-to" mode="time" enableTime dateFormat="h:i K" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setDTo(d.getHours() * 3600 * 1000 + d.getMinutes() * 60 * 1000); }} label="To" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-theme-xs text-gray-600">Timezone</div>
                    <Select options={[{ value: "IST", label: "IST" }, { value: "UTC", label: "UTC" }]} defaultValue={dTimezone} onChange={(v) => setDTimezone(v as string)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Primary Faculty</div>
                    <Select options={faculty.map((f) => ({ value: f.id, label: f.name }))} defaultValue={dPrimaryFaculty} onChange={(v) => setDPrimaryFaculty(v as string)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Co-Faculty / TA</div>
                    <MultiSelect label="Select" options={faculty.map((f) => ({ value: f.id, text: f.name }))} value={dCoFaculty} onChange={(vals) => setDCoFaculty(vals)} placeholder="Add" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-theme-xs text-gray-600">Live Class Platform</div>
                    <Select options={[{ value: "Zoom", label: "Zoom Meeting" }, { value: "GoogleMeet", label: "Google Meet" }, { value: "Custom", label: "Custom Link" }]} defaultValue={dMeetingPlatform} onChange={(v) => setDMeetingPlatform(v as typeof dMeetingPlatform)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Meeting Link</div>
                    <Input value={dMeetingLink} onChange={(e) => setDMeetingLink(e.target.value)} placeholder="https://" />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="text-theme-sm text-gray-800 dark:text-white/90">Recurring?</div>
                  <Switch label="" defaultChecked={dRecurring} onChange={(v) => setDRecurring(v)} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-theme-xs text-gray-600">Batch Capacity</div>
                    <Input value={String(dCapacity)} onChange={(e) => setDCapacity(Number(e.target.value) || 0)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                    <div className="text-theme-sm text-gray-800 dark:text-white/90">Auto-close after full?</div>
                    <Switch label="" defaultChecked={dAutoClose} onChange={(v) => setDAutoClose(v)} />
                  </div>
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Allow Mid-Batch Enrollment?</div>
                  <Select options={[{ value: "Anytime", label: "Yes, allow anytime" }, { value: "AdminOnlyAfterX", label: "Yes, only via admin after X sessions" }, { value: "No", label: "No" }]} defaultValue={dAllowMidEnroll} onChange={(v) => setDAllowMidEnroll(v as typeof dAllowMidEnroll)} />
                  {dAllowMidEnroll === "AdminOnlyAfterX" && (
                    <div className="mt-2">
                      <div className="text-theme-xs text-gray-600">After X sessions</div>
                      <Input value={String(dMidAfter)} onChange={(e) => setDMidAfter(Number(e.target.value) || 0)} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                    <div className="text-theme-sm text-gray-800 dark:text-white/90">Before class (30 mins)</div>
                    <Switch label="" defaultChecked={dNotifyBefore} onChange={(v) => setDNotifyBefore(v)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                    <div className="text-theme-sm text-gray-800 dark:text-white/90">After class summary</div>
                    <Switch label="" defaultChecked={dNotifyAfter} onChange={(v) => setDNotifyAfter(v)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                    <div className="text-theme-sm text-gray-800 dark:text-white/90">Daily attendance alerts</div>
                    <Switch label="" defaultChecked={dNotifyDaily} onChange={(v) => setDNotifyDaily(v)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-theme-xs text-gray-600">Status</div>
                    <Select options={[{ value: "Draft", label: "Draft" }, { value: "Enrolling", label: "Enrolling" }, { value: "Active", label: "Active" }, { value: "Paused", label: "Paused" }, { value: "Completed", label: "Completed" }, { value: "Cancelled", label: "Cancelled" }]} defaultValue={dStatus} onChange={(v) => setDStatus(v as BatchStatus)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Initial Students</div>
                    <Input value={String(dStudentsCount)} onChange={(e) => setDStudentsCount(Number(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                <Button onClick={saveBatch}>Create Batch</Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} isFullscreen>
        <div className="fixed inset-0 flex justify-end">
          <div className="flex-1" onClick={() => setIsEditOpen(false)} />
          <div className="h-full w-full max-w-3xl bg-white shadow-2xl dark:bg-gray-900 animate-[slideIn_0.28s_ease-out]">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={() => setIsEditOpen(false)}>←</button>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit Batch</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setDraftSavedAt(Date.now())}>Save Draft</Button>
                <Button onClick={savePublishEdit}>Save & Publish</Button>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              </div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {draftSavedAt && (<div className="mb-3 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-theme-xs text-brand-700">Draft saved</div>)}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <div className="text-theme-xs text-gray-600">Batch Name</div>
                      <Input value={dName} onChange={(e) => setDName(e.target.value)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Batch Code</div>
                      <Input value={dCode} onChange={(e) => setDCode(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-theme-xs text-gray-600">Course</div>
                        <Select options={courses.map((c) => ({ value: c.id, label: c.name }))} defaultValue={dCourseId} onChange={(v) => { setDCourseId(v as string); const c = courses.find((x) => x.id === (v as string)); setDProgramId(c?.programId || ""); }} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Program</div>
                        <Input value={programs.find((p) => p.id === dProgramId)?.name || dProgramId} onChange={() => {}} />
                      </div>
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Tags</div>
                      <Input value={dTags} onChange={(e) => setDTags(e.target.value)} placeholder="Comma separated" />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Batch Type</div>
                      <Select options={[{ value: "Live", label: "Live Classes" }, { value: "Hybrid", label: "Hybrid" }, { value: "RecordedOnly", label: "Recorded Only" }]} defaultValue={dType} onChange={(v) => setDType(v as BatchType)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Mode</div>
                      <Select options={[{ value: "weekday", label: "Weekday" }, { value: "weekend", label: "Weekend" }, { value: "custom", label: "Custom" }]} defaultValue={dMode} onChange={(v) => setDMode(v as typeof dMode)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DatePicker id="edit-start" mode="single" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setDStart(d.getTime()); }} label="Start Date" />
                      <DatePicker id="edit-end" mode="single" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setDEnd(d.getTime()); }} label="End Date" />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Class Days</div>
                      <MultiSelect label="Select Days" options={["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) => ({ value: d, text: d }))} value={dDays} onChange={(vals) => setDDays(vals)} placeholder="Select" />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DatePicker id="edit-from" mode="time" enableTime dateFormat="h:i K" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setDFrom(d.getHours() * 3600 * 1000 + d.getMinutes() * 60 * 1000); }} label="From" />
                      <DatePicker id="edit-to" mode="time" enableTime dateFormat="h:i K" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setDTo(d.getHours() * 3600 * 1000 + d.getMinutes() * 60 * 1000); }} label="To" />
                    </div>
                    <div className="text-theme-xs text-gray-600">Recurrence summary</div>
                    <div className="text-theme-xs text-gray-700">Every {(dDays || []).join(" & ")} {dFrom !== undefined && dTo !== undefined ? `, ${String(Math.floor((dFrom||0)/3600000)).padStart(2,"0")}:${String(Math.floor(((dFrom||0)%3600000)/60000)).padStart(2,"0")}–${String(Math.floor((dTo||0)/3600000)).padStart(2,"0")}:${String(Math.floor(((dTo||0)%3600000)/60000)).padStart(2,"0")}` : ""} ({dTimezone})</div>
                    <div>
                      <Button variant="outline" onClick={() => navigate(`/batches/${editId || ""}`)}>Manage Sessions</Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-theme-xs text-gray-600">Status</div>
                        <Select options={[{ value: "Draft", label: "Draft" }, { value: "Enrolling", label: "Enrolling" }, { value: "Active", label: "Active" }, { value: "Paused", label: "Paused" }, { value: "Completed", label: "Completed" }, { value: "Cancelled", label: "Cancelled" }]} defaultValue={dStatus} onChange={(v) => setDStatus(v as BatchStatus)} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Visibility</div>
                        <Select options={[{ value: "Public", label: "Public" }, { value: "Private", label: "Private" }]} defaultValue={dVisibility} onChange={(v) => setDVisibility(v as typeof dVisibility)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-theme-xs text-gray-600">Primary Faculty</div>
                        <Select options={faculty.map((f) => ({ value: f.id, label: f.name }))} defaultValue={dPrimaryFaculty} onChange={(v) => setDPrimaryFaculty(v as string)} />
                        <div className="mt-1 text-error-600 text-theme-xs">⚠ {dPrimaryFaculty ? `${faculty.find((f) => f.id === dPrimaryFaculty)?.name || dPrimaryFaculty} has another class at 6 PM` : "No conflicts"}</div>
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Co-Faculty / TAs</div>
                        <MultiSelect label="Select" options={faculty.map((f) => ({ value: f.id, text: f.name }))} value={dCoFaculty} onChange={(vals) => setDCoFaculty(vals)} placeholder="Add" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-theme-xs text-gray-600">Live Platform</div>
                        <Select options={[{ value: "Zoom", label: "Zoom" }, { value: "GoogleMeet", label: "Google Meet" }, { value: "Custom", label: "Custom" }]} defaultValue={dMeetingPlatform} onChange={(v) => setDMeetingPlatform(v as typeof dMeetingPlatform)} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Meeting Link</div>
                        <Input value={dMeetingLink} onChange={(e) => setDMeetingLink(e.target.value)} placeholder="https://" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                        <div className="text-theme-sm text-gray-800 dark:text-white/90">Auto-record sessions</div>
                        <Switch label="" defaultChecked={dAutoRecord} onChange={(v) => setDAutoRecord(v)} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Auto-archive recordings (days)</div>
                        <Input value={String(dAutoArchiveDays)} onChange={(e) => setDAutoArchiveDays(Number(e.target.value) || 0)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                        <div className="text-theme-sm text-gray-800 dark:text-white/90">Email reminders</div>
                        <Switch label="" defaultChecked={dNotifyBefore} onChange={(v) => setDNotifyBefore(v)} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Time before class (mins)</div>
                        <Input value={String(dNotifyBeforeMinutes)} onChange={(e) => setDNotifyBeforeMinutes(Number(e.target.value) || 0)} />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                        <div className="text-theme-sm text-gray-800 dark:text-white/90">SMS reminders</div>
                        <Switch label="" defaultChecked={dNotifySmsBefore} onChange={(v) => setDNotifySmsBefore(v)} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">SMS time (mins)</div>
                        <Input value={String(dNotifySmsMinutes)} onChange={(e) => setDNotifySmsMinutes(Number(e.target.value) || 0)} />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                        <div className="text-theme-sm text-gray-800 dark:text-white/90">Post-class summary email</div>
                        <Switch label="" defaultChecked={dNotifyAfter} onChange={(v) => setDNotifyAfter(v)} />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                        <div className="text-theme-sm text-gray-800 dark:text-white/90">Attendance reminders</div>
                        <Switch label="" defaultChecked={dNotifyDaily} onChange={(v) => setDNotifyDaily(v)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-theme-xs text-gray-600">Capacity</div>
                        <Input value={String(dCapacity)} onChange={(e) => setDCapacity(Number(e.target.value) || 0)} />
                        {dCapacity < dStudentsCount && (<div className="mt-1 text-theme-xs text-error-600">Capacity below enrolled. Choose Waitlist or force reduce.</div>)}
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                        <div className="text-theme-sm text-gray-800 dark:text-white/90">Auto-close when full</div>
                        <Switch label="" defaultChecked={dAutoClose} onChange={(v) => setDAutoClose(v)} />
                      </div>
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Allow mid-batch enrollment</div>
                      <Select options={[{ value: "Anytime", label: "Allowed" }, { value: "AdminOnlyAfterX", label: "Allowed with limit" }, { value: "No", label: "Disallowed" }]} defaultValue={dAllowMidEnroll} onChange={(v) => setDAllowMidEnroll(v as typeof dAllowMidEnroll)} />
                      {dAllowMidEnroll === "AdminOnlyAfterX" && (<div className="mt-2"><Input value={String(dMidAfter)} onChange={(e) => setDMidAfter(Number(e.target.value) || 0)} placeholder="After X sessions" /></div>)}
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Publish Date</div>
                      <DatePicker id="edit-publish" mode="single" onChange={(dates) => { const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date); if (d && d instanceof Date) setDPublishDate(d.getTime()); }} label="" />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Faculty notes (private)</div>
                      <Input value={dFacultyNotes} onChange={(e) => setDFacultyNotes(e.target.value)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Version / change notes</div>
                      <Input value={dChangeNotes} onChange={(e) => setDChangeNotes(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                <Button variant="outline" onClick={() => { if (!editId) return; deleteBatch(editId); setIsEditOpen(false); }}>Delete Batch</Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setDraftSavedAt(Date.now())}>Save Draft</Button>
                  <Button onClick={savePublishEdit}>Save & Publish</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showGuard} onClose={() => setShowGuard(false)}>
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Confirm Changes</div>
          <div className="mt-2 text-theme-xs text-gray-600">{guardMessage}</div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setShowGuard(false)}>Cancel</Button>
            <Button onClick={confirmGuardProceed}>Confirm</Button>
          </div>
        </div>
      </Modal>
      <button className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-white shadow-lg sm:hidden" onClick={openCreate}>
        <PlusIcon className="w-5 h-5" />
        <span>Batch</span>
      </button>
    </>
  );
}