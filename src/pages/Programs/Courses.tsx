import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import Switch from "../../components/form/switch/Switch";
import RichTextEditor from "../../components/form/richtext/RichTextEditor";
import Radio from "../../components/form/input/Radio";
import FileInput from "../../components/form/input/FileInput";
import { PlusIcon, MoreDotIcon, PencilIcon } from "../../icons";
import { useNavigate } from "react-router";

type Status = "Active" | "Draft" | "Hidden";

type Program = {
  id: string;
  name: string;
  institution: string;
  category: string;
  type: "SingleCourse" | "MultiPart" | "Levels" | "Custom";
  parts?: string[];
  levels?: { name: string; papers: string[] }[];
};

type CourseItem = {
  id: string;
  name: string;
  slug: string;
  code?: string;
  programId: string;
  programName: string;
  institution: string;
  category: string;
  levelOrPart?: string;
  paper?: string;
  lessons: number;
  shortDescription?: string;
  longDescription?: string;
  courseType?: "Standard Course" | "Single Paper Course" | "Project / Practical Course" | "Module Collection";
  durationWeeks?: number;
  durationHours?: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  language?: string;
  thumbnailName?: string;
  promoVideo?: string;
  attachments?: { name: string; url?: string }[];
  price?: number;
  discountPrice?: number;
  publish?: boolean;
  status: Status;
  order?: number;
  createdAt: number;
};

function readPrograms(): Program[] {
  try {
    const raw = localStorage.getItem("programs");
    if (raw) return JSON.parse(raw) as Program[];
  } catch { void 0 }
  return [
    { id: "cpa-us", name: "CPA US", institution: "NorthStar", category: "Accountancy", type: "MultiPart", parts: ["FAR", "AUD", "REG", "BEC"] },
    { id: "acca", name: "ACCA", institution: "NorthStar", category: "Accountancy", type: "Levels", levels: [ { name: "Applied Knowledge", papers: ["BT", "MA", "FA"] }, { name: "Applied Skills", papers: ["CBL", "PM", "TX", "FR", "AA", "FM"] } ] },
    { id: "fsd", name: "Full Stack Web (MERN)", institution: "Dev Institute", category: "Coding", type: "Custom" },
  ];
}

function seedCourses(programs: Program[]): CourseItem[] {
  const items: CourseItem[] = [];
  programs.forEach((p) => {
    if (p.type === "MultiPart" && p.parts) {
      p.parts.forEach((pt, i) => {
        items.push({ id: `${p.id}-course-${pt.toLowerCase()}`, name: `${p.name} – ${pt}`, slug: `${p.id}-${pt.toLowerCase()}`, programId: p.id, programName: p.name, institution: p.institution, category: p.category, levelOrPart: pt, lessons: 30 + i * 8, status: "Active", order: i + 1, createdAt: Date.now() - 10000 });
      });
    }
    if (p.type === "Levels" && p.levels) {
      const names: Record<string, string> = { CBL: "Corporate & Business Law", PM: "Performance Management", TX: "Taxation", FR: "Financial Reporting", AA: "Audit & Assurance", FM: "Financial Management", BT: "Business & Technology", MA: "Management Accounting", FA: "Financial Accounting" };
      p.levels.forEach((lv, idx) => {
        lv.papers.forEach((code, j) => {
          const paperName = names[code] || code;
          items.push({ id: `${p.id}-course-${code.toLowerCase()}`, name: `${p.name} – ${paperName}`, slug: `${p.id}-${code.toLowerCase()}`, programId: p.id, programName: p.name, institution: p.institution, category: p.category, levelOrPart: lv.name, paper: paperName, lessons: 40 + j * 5, status: j % 3 === 0 ? "Draft" : "Active", order: (idx + 1) * 10 + j, createdAt: Date.now() - 9000 });
        });
      });
    }
    if (p.type === "Custom") {
      items.push({ id: `${p.id}-course`, name: p.name, slug: p.id, programId: p.id, programName: p.name, institution: p.institution, category: p.category, lessons: 120, status: "Active", createdAt: Date.now() - 8000 });
    }
  });
  return items;
}

function readCourses(): CourseItem[] {
  try {
    const raw = localStorage.getItem("courses");
    if (raw) return JSON.parse(raw) as CourseItem[];
  } catch { void 0 }
  const programs = readPrograms();
  return seedCourses(programs);
}

function writeCourses(items: CourseItem[]) {
  try { localStorage.setItem("courses", JSON.stringify(items)); } catch { void 0 }
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState("");
  const programs = readPrograms();
  const institutions = Array.from(new Set(programs.map((p) => p.institution)));
  const [institution, setInstitution] = useState<string>(institutions[0] || "");
  const programOptions = programs.filter((p) => !institution || p.institution === institution).map((p) => ({ value: p.id, label: p.name }));
  const [program, setProgram] = useState<string>(programOptions[0]?.value || "");
  const [levelPart, setLevelPart] = useState<string>("");
  const [paper, setPaper] = useState<string>("");
  const [status, setStatus] = useState<"All" | Status>("All");
  const [sortBy, setSortBy] = useState<"name" | "created" | "program" | "order">("name");
  const [view, setView] = useState<"table" | "grid">("table");

  useEffect(() => {
    setCourses(readCourses());
  }, []);

  useEffect(() => {
    setProgram(programOptions[0]?.value || "");
    setLevelPart("");
    setPaper("");
  }, [institution]);

  const dynamicLevelOptions = useMemo(() => {
    const p = programs.find((x) => x.id === program);
    if (!p) return [] as { value: string; label: string }[];
    if (p.type === "Levels") return (p.levels || []).map((lv) => ({ value: lv.name, label: lv.name }));
    if (p.type === "MultiPart") return (p.parts || []).map((pt) => ({ value: pt, label: pt }));
    return [];
  }, [programs, program]);

  const dynamicPaperOptions = useMemo(() => {
    const p = programs.find((x) => x.id === program);
    if (!p) return [] as { value: string; label: string }[];
    if (p.type === "Levels") {
      const lv = (p.levels || []).find((x) => x.name === levelPart);
      const mapNames: Record<string, string> = { CBL: "Corporate & Business Law", PM: "Performance Management", TX: "Taxation", FR: "Financial Reporting", AA: "Audit & Assurance", FM: "Financial Management", BT: "Business & Technology", MA: "Management Accounting", FA: "Financial Accounting" };
      return (lv?.papers || []).map((code) => ({ value: mapNames[code] || code, label: mapNames[code] || code }));
    }
    return [];
  }, [programs, program, levelPart]);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let arr = courses.filter((c) => {
      const matchTxt = txt ? [c.name, c.programName, c.levelOrPart || "", c.paper || ""].some((v) => v.toLowerCase().includes(txt)) : true;
      const matchInst = institution ? c.institution === institution : true;
      const matchProg = program ? c.programId === program : true;
      const matchLvl = levelPart ? (c.levelOrPart || "") === levelPart : true;
      const matchPaper = paper ? (c.paper || "") === paper : true;
      const matchStatus = status === "All" ? true : c.status === status;
      return matchTxt && matchInst && matchProg && matchLvl && matchPaper && matchStatus;
    });
    if (sortBy === "name") arr = arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "created") arr = arr.sort((a, b) => b.createdAt - a.createdAt);
    if (sortBy === "program") arr = arr.sort((a, b) => a.programName.localeCompare(b.programName));
    if (sortBy === "order") arr = arr.sort((a, b) => (a.order || 999) - (b.order || 999));
    return arr;
  }, [courses, search, institution, program, levelPart, paper, status, sortBy]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dProgramId, setDProgramId] = useState<string>(program);
  const [dLevelPart, setDLevelPart] = useState<string>("");
  const [dPaper, setDPaper] = useState<string>("");
  const [dName, setDName] = useState("");
  const [dSlug, setDSlug] = useState("");
  const [dCode, setDCode] = useState("");
  const [dLessons, setDLessons] = useState<number>(30);
  const [dShortDesc, setDShortDesc] = useState("");
  const [dLongDesc, setDLongDesc] = useState("");
  const [dCourseType, setDCourseType] = useState<"Standard Course" | "Single Paper Course" | "Project / Practical Course" | "Module Collection">("Standard Course");
  const [dWeeks, setDWeeks] = useState<number>(0);
  const [dHours, setDHours] = useState<number>(0);
  const [dDifficulty, setDDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [dLanguage, setDLanguage] = useState<string>("English");
  const [dThumbnailName, setDThumbnailName] = useState<string>("");
  const [dPromoVideo, setDPromoVideo] = useState<string>("");
  const [dAttachmentName, setDAttachmentName] = useState<string>("");
  const [dAttachmentUrl, setDAttachmentUrl] = useState<string>("");
  const [dAttachments, setDAttachments] = useState<{ name: string; url?: string }[]>([]);
  const [dPrice, setDPrice] = useState<number>(0);
  const [dDiscountPrice, setDDiscountPrice] = useState<number>(0);
  const [dPublish, setDPublish] = useState<boolean>(true);
  const [dStatus, setDStatus] = useState<Status>("Active");
  const [dOrder, setDOrder] = useState<number>(1);
  const [dCurriculumSetup, setDCurriculumSetup] = useState<"create" | "import" | "upload">("create");

  const openAdd = () => {
    setIsDrawerOpen(true);
    setDProgramId(program || programOptions[0]?.value || "");
    setDLevelPart("");
    setDPaper("");
    setDName("");
    setDSlug("");
    setDCode("");
    setDLessons(30);
    setDShortDesc("");
    setDLongDesc("");
    setDCourseType("Standard Course");
    setDWeeks(0);
    setDHours(0);
    setDDifficulty("Beginner");
    setDLanguage("English");
    setDThumbnailName("");
    setDPromoVideo("");
    setDAttachmentName("");
    setDAttachmentUrl("");
    setDAttachments([]);
    setDPrice(0);
    setDDiscountPrice(0);
    setDPublish(true);
    setDStatus("Active");
    setDOrder((courses.length || 0) + 1);
    setDCurriculumSetup("create");
  };

  const regenerateSlug = () => {
    const s = (dName || "").trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
    setDSlug(s);
  };

  const saveCourse = () => {
    const name = dName.trim();
    if (!name || !dProgramId) return;
    const prog = programs.find((p) => p.id === dProgramId);
    if (!prog) return;
    const id = `${prog.id}-course-${(dSlug || name.toLowerCase().replace(/\s+/g, "-")).replace(/[^a-z0-9-]/g, "")}`;
    const item: CourseItem = {
      id,
      name,
      slug: dSlug || name.toLowerCase().replace(/\s+/g, "-"),
      code: dCode || undefined,
      programId: prog.id,
      programName: prog.name,
      institution: prog.institution,
      category: prog.category,
      levelOrPart: dLevelPart || undefined,
      paper: dPaper || undefined,
      lessons: dLessons || 0,
      shortDescription: dShortDesc || undefined,
      longDescription: dLongDesc || undefined,
      courseType: dCourseType || undefined,
      durationWeeks: dWeeks || undefined,
      durationHours: dHours || undefined,
      difficulty: dDifficulty || undefined,
      language: dLanguage || undefined,
      thumbnailName: dThumbnailName || undefined,
      promoVideo: dPromoVideo || undefined,
      attachments: dAttachments.length ? dAttachments : undefined,
      price: dPrice || undefined,
      discountPrice: dDiscountPrice || undefined,
      publish: dPublish,
      status: dStatus,
      order: dOrder || undefined,
      createdAt: Date.now(),
    };
    setCourses((prev) => {
      const next = [item, ...prev];
      writeCourses(next);
      return next;
    });
    setIsDrawerOpen(false);
  };

  const duplicateCourse = (id: string) => {
    const it = courses.find((x) => x.id === id);
    if (!it) return;
    const copy: CourseItem = { ...it, id: `${it.id}-copy-${Date.now()}`, name: `${it.name} Copy`, createdAt: Date.now() };
    setCourses((prev) => {
      const next = [copy, ...prev];
      writeCourses(next);
      return next;
    });
  };

  const deleteCourse = (id: string) => {
    const ok = window.confirm("Delete this course?");
    if (!ok) return;
    setCourses((prev) => {
      const next = prev.filter((x) => x.id !== id);
      writeCourses(next);
      return next;
    });
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <>
      <PageMeta title="Courses" description="Manage all courses across institutions, programs, levels & papers." />
      <PageBreadcrumb pageTitle="Courses" />
      <ComponentCard title="Courses">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-xl">
              <Input placeholder="Search courses" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                <Select options={institutions.map((n) => ({ value: n, label: n }))} defaultValue={institution} onChange={(v) => setInstitution(v as string)} />
                <Select options={programOptions} defaultValue={program} onChange={(v) => { setProgram(v as string); setLevelPart(""); setPaper(""); }} />
                <Select options={dynamicLevelOptions} defaultValue={levelPart} onChange={(v) => { setLevelPart(v as string); setPaper(""); }} />
              </div>
              <Button onClick={openAdd} startIcon={<PlusIcon className="w-4 h-4" />}>Add Course</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 animate-[slideIn_0.26s_ease-out]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Institution</span>
              <Select options={institutions.map((n) => ({ value: n, label: n }))} defaultValue={institution} onChange={(v) => setInstitution(v as string)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Program</span>
              <Select options={programOptions} defaultValue={program} onChange={(v) => { setProgram(v as string); setLevelPart(""); setPaper(""); }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Part/Level</span>
              <Select options={dynamicLevelOptions} defaultValue={levelPart} onChange={(v) => { setLevelPart(v as string); setPaper(""); }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Paper</span>
              <Select options={dynamicPaperOptions} defaultValue={paper} onChange={(v) => setPaper(v as string)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Status</span>
              <Select options={[{ value: "All", label: "All" }, { value: "Active", label: "Active" }, { value: "Draft", label: "Draft" }, { value: "Hidden", label: "Hidden" }]} defaultValue={status} onChange={(v) => setStatus(v as typeof status)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort</span>
              <Select options={[{ value: "name", label: "Name" }, { value: "created", label: "Created Date" }, { value: "program", label: "Program" }, { value: "order", label: "Order" }]} defaultValue={sortBy} onChange={(v) => setSortBy(v as typeof sortBy)} />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant={view === "table" ? undefined : "outline"} onClick={() => setView("table")}>Table ▣</Button>
              <Button size="sm" variant={view === "grid" ? undefined : "outline"} onClick={() => setView("grid")}>Grid ⬚</Button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-3xl">📚</div>
              <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">No Courses Found</div>
              <div className="mt-1 text-theme-xs text-gray-500">Create a course under a program or paper.</div>
              <div className="mt-4">
                <Button onClick={openAdd} startIcon={<PlusIcon className="w-4 h-4" />}>Add Course</Button>
              </div>
            </div>
          ) : view === "table" ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Course Name</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Program</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Part/Level/Paper</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Lessons</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Status</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {filtered.map((c) => (
                      <TableRow key={c.id} className="transition hover:bg-gray-50">
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          <button className="underline decoration-dotted" onClick={() => navigate(`/courses/${c.id}`)}>{c.name}</button>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{c.programName}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{c.paper || c.levelOrPart || "—"}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{c.lessons}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{c.status}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="relative">
                            <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === c.id ? null : c.id))}>
                              <MoreDotIcon className="w-4 h-4" />
                            </button>
                            <Dropdown isOpen={openMenuId === c.id} onClose={() => setOpenMenuId(null)}>
                              <DropdownItem>Edit</DropdownItem>
                              <DropdownItem>Manage Curriculum</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); duplicateCourse(c.id); }}>Duplicate</DropdownItem>
                              <DropdownItem>Move</DropdownItem>
                              <DropdownItem>Archive</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); deleteCourse(c.id); }}>Delete</DropdownItem>
                            </Dropdown>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <div key={c.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="text-lg font-semibold text-gray-800 dark:text-white/90">{c.name}</div>
                      <div className="relative">
                        <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === c.id ? null : c.id))}>
                          <MoreDotIcon className="w-4 h-4" />
                        </button>
                        <Dropdown isOpen={openMenuId === c.id} onClose={() => setOpenMenuId(null)}>
                          <DropdownItem>Edit</DropdownItem>
                          <DropdownItem>Manage Curriculum</DropdownItem>
                          <DropdownItem onClick={() => { setOpenMenuId(null); duplicateCourse(c.id); }}>Duplicate</DropdownItem>
                          <DropdownItem onClick={() => { setOpenMenuId(null); deleteCourse(c.id); }}>Delete</DropdownItem>
                        </Dropdown>
                      </div>
                    </div>
                    <div className="mt-1 text-theme-xs text-gray-600">Program: {c.programName}</div>
                    {c.levelOrPart ? <div className="text-theme-xs text-gray-600">Part/Level: {c.levelOrPart}</div> : null}
                    {c.paper ? <div className="text-theme-xs text-gray-600">Paper: {c.paper}</div> : null}
                    <div className="text-theme-xs text-gray-600">Lessons: {c.lessons}</div>
                    <div className="mt-2 text-theme-xs">{c.status === "Active" ? <span className="text-success-600">Active</span> : c.status === "Draft" ? <span className="text-warning-600">Draft</span> : <span className="text-gray-400">Hidden</span>}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="outline" onClick={() => navigate(`/courses/${c.id}`)}>Manage</Button>
                      <Button variant="outline" startIcon={<PencilIcon className="w-4 h-4" />}>Edit</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ComponentCard>

      <Modal isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} isFullscreen>
        <div className="fixed inset-0 flex justify-end">
          <div className="h-full w-full max-w-xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={() => setIsDrawerOpen(false)}>←</button>
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Course</div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Basic Info</div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <div className="text-theme-xs text-gray-600">Course Name</div>
                        <Input value={dName} onChange={(e) => setDName(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-theme-xs text-gray-600">Program</div>
                          <Select options={programOptions} defaultValue={dProgramId} onChange={(v) => { setDProgramId(v as string); setDLevelPart(""); setDPaper(""); }} />
                        </div>
                        <div>
                          <div className="text-theme-xs text-gray-600">Part / Level / Paper</div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Select options={(() => { const p = programs.find((x) => x.id === dProgramId); if (!p) return []; if (p.type === "Levels") return (p.levels || []).map((lv) => ({ value: lv.name, label: lv.name })); if (p.type === "MultiPart") return (p.parts || []).map((pt) => ({ value: pt, label: pt })); return []; })()} defaultValue={dLevelPart} onChange={(v) => { setDLevelPart(v as string); setDPaper(""); }} />
                            <Select options={(() => { const p = programs.find((x) => x.id === dProgramId); if (!p || p.type !== "Levels") return []; const lv = (p.levels || []).find((x) => x.name === dLevelPart); const mapNames: Record<string, string> = { CBL: "Corporate & Business Law", PM: "Performance Management", TX: "Taxation", FR: "Financial Reporting", AA: "Audit & Assurance", FM: "Financial Management", BT: "Business & Technology", MA: "Management Accounting", FA: "Financial Accounting" }; return (lv?.papers || []).map((code) => ({ value: mapNames[code] || code, label: mapNames[code] || code })); })()} defaultValue={dPaper} onChange={(v) => setDPaper(v as string)} />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-theme-xs text-gray-600">Course Code</div>
                          <Input value={dCode} onChange={(e) => setDCode(e.target.value)} />
                        </div>
                        <div>
                          <div className="text-theme-xs text-gray-600">Slug</div>
                          <div className="flex items-center gap-2">
                            <Input value={dSlug} onChange={(e) => setDSlug(e.target.value)} />
                            <Button size="sm" variant="outline" onClick={regenerateSlug} startIcon={<PencilIcon className="w-4 h-4" />}>Recreate</Button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Short Description</div>
                        <Input value={dShortDesc} onChange={(e) => setDShortDesc(e.target.value)} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Long Description</div>
                        <RichTextEditor value={dLongDesc} onChange={setDLongDesc} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Course Type & Structure</div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Radio id="ct-standard" name="courseType" value="Standard Course" checked={dCourseType === "Standard Course"} label="Standard Course" onChange={(v) => setDCourseType(v as typeof dCourseType)} />
                        <Radio id="ct-single" name="courseType" value="Single Paper Course" checked={dCourseType === "Single Paper Course"} label="Single Paper Course" onChange={(v) => setDCourseType(v as typeof dCourseType)} />
                        <Radio id="ct-project" name="courseType" value="Project / Practical Course" checked={dCourseType === "Project / Practical Course"} label="Project / Practical Course" onChange={(v) => setDCourseType(v as typeof dCourseType)} />
                        <Radio id="ct-module" name="courseType" value="Module Collection" checked={dCourseType === "Module Collection"} label="Module Collection" onChange={(v) => setDCourseType(v as typeof dCourseType)} />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-theme-xs text-gray-600">Weeks</div>
                          <Input value={String(dWeeks)} onChange={(e) => setDWeeks(Number(e.target.value) || 0)} />
                        </div>
                        <div>
                          <div className="text-theme-xs text-gray-600">Hours</div>
                          <Input value={String(dHours)} onChange={(e) => setDHours(Number(e.target.value) || 0)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-theme-xs text-gray-600">Difficulty</div>
                          <Select options={[{ value: "Beginner", label: "Beginner" }, { value: "Intermediate", label: "Intermediate" }, { value: "Advanced", label: "Advanced" }]} defaultValue={dDifficulty} onChange={(v) => setDDifficulty(v as typeof dDifficulty)} />
                        </div>
                        <div>
                          <div className="text-theme-xs text-gray-600">Language</div>
                          <Select options={[{ value: "English", label: "English" }, { value: "Hindi", label: "Hindi" }, { value: "Tamil", label: "Tamil" }, { value: "Others", label: "Others" }]} defaultValue={dLanguage} onChange={(v) => setDLanguage(v as string)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Media</div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <div className="text-theme-xs text-gray-600">Thumbnail</div>
                        <FileInput onChange={(e) => { const f = e.target.files?.[0]; setDThumbnailName(f ? f.name : ""); }} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Promo Video</div>
                        <Select options={[{ value: "", label: "Select" }, { value: "promo-1", label: "Demo Promo 1" }, { value: "promo-2", label: "Demo Promo 2" }]} defaultValue={dPromoVideo} onChange={(v) => setDPromoVideo(v as string)} />
                      </div>
                      <div className="space-y-2">
                        <div className="text-theme-xs text-gray-600">Attachments</div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Input placeholder="Name" value={dAttachmentName} onChange={(e) => setDAttachmentName(e.target.value)} />
                          <Input placeholder="URL (optional)" value={dAttachmentUrl} onChange={(e) => setDAttachmentUrl(e.target.value)} />
                        </div>
                        <div>
                          <Button size="sm" variant="outline" onClick={() => { if (!dAttachmentName.trim()) return; setDAttachments((prev) => [...prev, { name: dAttachmentName.trim(), url: dAttachmentUrl.trim() || undefined }]); setDAttachmentName(""); setDAttachmentUrl(""); }}>+ Add Resource</Button>
                        </div>
                        {dAttachments.length > 0 && (
                          <div className="space-y-1">
                            {dAttachments.map((a, i) => (
                              <div key={`${a.name}-${i}`} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-theme-xs dark:border-gray-800">
                                <span className="text-gray-700 dark:text-gray-400">{a.name}</span>
                                <Button size="sm" variant="outline" onClick={() => setDAttachments((prev) => prev.filter((_, idx) => idx !== i))}>Remove</Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Pricing & Visibility</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-theme-xs text-gray-600">Price (INR)</div>
                        <Input value={String(dPrice)} onChange={(e) => setDPrice(Number(e.target.value) || 0)} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Discount Price</div>
                        <Input value={String(dDiscountPrice)} onChange={(e) => setDDiscountPrice(Number(e.target.value) || 0)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                        <div className="text-theme-sm text-gray-800 dark:text-white/90">Publish on Website</div>
                        <Switch label="" defaultChecked={dPublish} onChange={(v) => setDPublish(v)} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Status</div>
                        <Select options={[{ value: "Active", label: "Active" }, { value: "Draft", label: "Draft" }, { value: "Hidden", label: "Hidden" }]} defaultValue={dStatus} onChange={(v) => setDStatus(v as Status)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Curriculum Setup</div>
                    <div className="grid grid-cols-1 gap-2">
                      <Radio id="cur-create" name="curriculum" value="create" checked={dCurriculumSetup === "create"} label="Create curriculum now" onChange={(v) => setDCurriculumSetup(v as typeof dCurriculumSetup)} />
                      <Radio id="cur-import" name="curriculum" value="import" checked={dCurriculumSetup === "import"} label="Import from an existing course" onChange={(v) => setDCurriculumSetup(v as typeof dCurriculumSetup)} />
                      <Radio id="cur-upload" name="curriculum" value="upload" checked={dCurriculumSetup === "upload"} label="Upload syllabus PDF to auto-generate" onChange={(v) => setDCurriculumSetup(v as typeof dCurriculumSetup)} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={saveCourse}>Create Course</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}