import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import Checkbox from "../../components/form/input/Checkbox";
import Switch from "../../components/form/switch/Switch";
import { PlusIcon, MoreDotIcon, PencilIcon } from "../../icons";

type ProgramType = "SingleCourse" | "MultiPart" | "Levels" | "Custom";
type ProgramStatus = "Active" | "Inactive";

type Program = {
  id: string;
  name: string;
  institution: string;
  category: string;
  type: ProgramType;
  description?: string;
  status: ProgramStatus;
  priority: number;
  parts?: string[];
  levels?: { name: string; papers: string[] }[];
  sections?: string[];
  coursesCount: number;
  papersCount?: number;
  partsCount?: number;
  createdAt: number;
};

type CategoryOpt = { value: string; label: string };

function readCategoriesForOptions(): CategoryOpt[] {
  try {
    const raw = localStorage.getItem("categories");
    if (raw) {
      const arr = JSON.parse(raw) as { id: string; name: string }[];
      return arr.map((c) => ({ value: c.name, label: c.name }));
    }
  } catch { void 0 }
  return [
    { value: "Accountancy", label: "Accountancy" },
    { value: "Coding", label: "Coding" },
    { value: "Finance", label: "Finance" },
    { value: "Taxation", label: "Taxation" },
  ];
}

function readPrograms(): Program[] {
  try {
    const raw = localStorage.getItem("programs");
    if (raw) return JSON.parse(raw) as Program[];
  } catch { void 0 }
  return [
    {
      id: "cpa-us",
      name: "CPA US",
      institution: "NorthStar",
      category: "Accountancy",
      type: "MultiPart",
      description: "Certified Public Accountant (US)",
      status: "Active",
      priority: 1,
      parts: ["FAR", "AUD", "REG", "BEC"],
      coursesCount: 4,
      partsCount: 4,
      createdAt: Date.now() - 100000,
    },
    {
      id: "acca",
      name: "ACCA",
      institution: "NorthStar",
      category: "Accountancy",
      type: "Levels",
      description: "Association of Chartered Certified Accountants",
      status: "Active",
      priority: 2,
      levels: [
        { name: "Applied Knowledge", papers: ["BT", "MA", "FA"] },
        { name: "Applied Skills", papers: ["LW", "PM", "TX"] },
      ],
      coursesCount: 6,
      papersCount: 6,
      createdAt: Date.now() - 90000,
    },
    {
      id: "fsd",
      name: "Full Stack Development",
      institution: "Dev Institute",
      category: "Coding",
      type: "SingleCourse",
      description: "End-to-end web development",
      status: "Inactive",
      priority: 3,
      coursesCount: 1,
      createdAt: Date.now() - 80000,
    },
  ];
}

function writePrograms(items: Program[]) {
  try { localStorage.setItem("programs", JSON.stringify(items)); } catch { void 0 }
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [search, setSearch] = useState("");
  const [institution, setInstitution] = useState("NorthStar");
  const [category, setCategory] = useState("Accountancy");
  const [programType, setProgramType] = useState<"All" | ProgramType>("All");
  const [status, setStatus] = useState<"All" | ProgramStatus>("All");
  const [orderBy, setOrderBy] = useState<"name" | "created" | "priority">("name");

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wName, setWName] = useState("");
  const [wCategory, setWCategory] = useState("Accountancy");
  const [wDescription, setWDescription] = useState("");
  const [wType, setWType] = useState<ProgramType>("SingleCourse");
  const [wCourseName, setWCourseName] = useState("");
  const [wParts, setWParts] = useState<string[]>(["FAR", "AUD", "REG", "BEC"]);
  const [wLevels, setWLevels] = useState<{ name: string; papers: string[] }[]>([
    { name: "Applied Knowledge", papers: ["Business & Technology", "Management Accounting", "Financial Accounting"] },
    { name: "Applied Skills", papers: ["Corporate & Business Law", "Performance Management", "Taxation"] },
  ]);
  const [wSections, setWSections] = useState<string[]>([]);
  const [wAutoCreateParts, setWAutoCreateParts] = useState(true);
  const [wAutoCreatePapers, setWAutoCreatePapers] = useState(true);
  const [wAutoCreateLevels, setWAutoCreateLevels] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const categoryOptions = readCategoriesForOptions();

  useEffect(() => {
    setPrograms(readPrograms());
  }, []);

  useEffect(() => {
    if (wizardStep === 1) setWCourseName(wName ? `${wName}` : "");
  }, [wizardStep, wName]);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let arr = programs.filter((p) => {
      const matchTxt = txt ? [p.name, p.description || "", p.category, p.institution].some((v) => v.toLowerCase().includes(txt)) : true;
      const matchInst = institution ? p.institution === institution : true;
      const matchCat = category ? p.category === category : true;
      const matchType = programType === "All" ? true : p.type === programType;
      const matchStatus = status === "All" ? true : p.status === status;
      return matchTxt && matchInst && matchCat && matchType && matchStatus;
    });
    if (orderBy === "name") arr = arr.sort((a, b) => a.name.localeCompare(b.name));
    if (orderBy === "priority") arr = arr.sort((a, b) => a.priority - b.priority);
    if (orderBy === "created") arr = arr.sort((a, b) => b.createdAt - a.createdAt);
    return arr;
  }, [programs, search, institution, category, programType, status, orderBy]);

  const openWizard = () => {
    setIsWizardOpen(true);
    setWizardStep(1);
    setWName("");
    setWCategory(category);
    setWDescription("");
    setWType("SingleCourse");
    setWCourseName("");
    setWParts(["FAR", "AUD", "REG", "BEC"]);
    setWLevels([
      { name: "Applied Knowledge", papers: ["Business & Technology", "Management Accounting", "Financial Accounting"] },
      { name: "Applied Skills", papers: ["Corporate & Business Law", "Performance Management", "Taxation"] },
    ]);
    setWSections([]);
    setWAutoCreateParts(true);
    setWAutoCreatePapers(true);
    setWAutoCreateLevels(false);
  };

  const addPart = () => {
    const name = prompt("Add Part name") || "";
    if (!name.trim()) return;
    setWParts((prev) => [...prev, name.trim()]);
  };

  const addLevel = () => {
    const name = prompt("Add Level name") || "";
    if (!name.trim()) return;
    setWLevels((prev) => [...prev, { name: name.trim(), papers: [] }]);
  };

  const addPaperToLevel = (li: number) => {
    const name = prompt("Add Paper name") || "";
    if (!name.trim()) return;
    setWLevels((prev) => prev.map((lv, i) => (i === li ? { ...lv, papers: [...lv.papers, name.trim()] } : lv)));
  };

  const addSection = () => {
    const name = prompt("Add Section name") || "";
    if (!name.trim()) return;
    setWSections((prev) => [...prev, name.trim()]);
  };

  const saveProgramFromWizard = () => {
    const name = wName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
    let coursesCount = 0;
    let partsCount = 0;
    let papersCount = 0;
    if (wType === "SingleCourse") coursesCount = 1;
    if (wType === "MultiPart") {
      partsCount = wParts.length;
      coursesCount = wAutoCreateParts ? wParts.length : 0;
    }
    if (wType === "Levels") {
      papersCount = wLevels.reduce((acc, lv) => acc + lv.papers.length, 0);
      coursesCount = wAutoCreatePapers ? papersCount : 0;
    }
    if (wType === "Custom") {
      coursesCount = 0;
    }
    const item: Program = {
      id,
      name,
      institution: institution,
      category: wCategory,
      type: wType,
      description: wDescription,
      status: "Active",
      priority: programs.length + 1,
      parts: wType === "MultiPart" ? [...wParts] : undefined,
      levels: wType === "Levels" ? [...wLevels] : undefined,
      sections: wType === "Custom" ? [...wSections] : undefined,
      coursesCount,
      partsCount: partsCount || undefined,
      papersCount: papersCount || undefined,
      createdAt: Date.now(),
    };
    setPrograms((prev) => {
      const next = [item, ...prev];
      writePrograms(next);
      return next;
    });
    setIsWizardOpen(false);
  };

  const duplicateProgram = (id: string) => {
    const p = programs.find((x) => x.id === id);
    if (!p) return;
    const copy: Program = { ...p, id: `${p.id}-copy-${Date.now()}`, name: `${p.name} Copy`, priority: programs.length + 1, createdAt: Date.now() };
    setPrograms((prev) => {
      const next = [copy, ...prev];
      writePrograms(next);
      return next;
    });
  };

  const deleteProgram = (id: string) => {
    const ok = window.confirm("Delete this program?");
    if (!ok) return;
    setPrograms((prev) => {
      const next = prev.filter((x) => x.id !== id);
      writePrograms(next);
      return next;
    });
  };

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eInstitution, setEInstitution] = useState("NorthStar");
  const [eCategory, setECategory] = useState("Accountancy");
  const [eStatus, setEStatus] = useState<ProgramStatus>("Active");
  const [ePriority, setEPriority] = useState<number>(1);
  const [eDescription, setEDescription] = useState("");

  const openEdit = (id: string) => {
    const p = programs.find((x) => x.id === id);
    if (!p) return;
    setEditId(id);
    setEName(p.name);
    setEInstitution(p.institution);
    setECategory(p.category);
    setEStatus(p.status);
    setEPriority(p.priority);
    setEDescription(p.description || "");
    setIsEditOpen(true);
  };

  const saveEdit = () => {
    if (!editId) return;
    setPrograms((prev) => {
      const next = prev.map((p) => (p.id === editId ? { ...p, name: eName.trim() || p.name, institution: eInstitution, category: eCategory, status: eStatus, priority: ePriority, description: eDescription } : p));
      writePrograms(next);
      return next;
    });
    setIsEditOpen(false);
  };

  return (
    <>
      <PageMeta title="Programs" description="Manage all programs across institutions & categories" />
      <PageBreadcrumb pageTitle="Programs" />
      <ComponentCard title="Programs">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-xl">
              <Input placeholder="Search programs" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openWizard} startIcon={<PlusIcon className="w-4 h-4" />}>Add Program</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 animate-[slideIn_0.28s_ease-out]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Institution</span>
              <Select options={[{ value: "NorthStar", label: "NorthStar" }, { value: "Dev Institute", label: "Dev Institute" }]} defaultValue={institution} onChange={(v) => setInstitution(v as string)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Category</span>
              <Select options={categoryOptions} defaultValue={category} onChange={(v) => setCategory(v as string)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Program Type</span>
              <Select options={[{ value: "All", label: "All" }, { value: "SingleCourse", label: "Single Course" }, { value: "MultiPart", label: "Multi-Part" }, { value: "Levels", label: "Levels" }, { value: "Custom", label: "Custom" }]} defaultValue={programType} onChange={(v) => setProgramType(v as typeof programType)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Status</span>
              <Select options={[{ value: "All", label: "All" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} defaultValue={status} onChange={(v) => setStatus(v as typeof status)} />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">Order By</span>
              <Select options={[{ value: "name", label: "Name" }, { value: "created", label: "Created Date" }, { value: "priority", label: "Priority" }]} defaultValue={orderBy} onChange={(v) => setOrderBy(v as typeof orderBy)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-3xl">📘</div>
              <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">No Programs Yet</div>
              <div className="mt-1 text-theme-xs text-gray-500">Programs define what courses belong to each category.</div>
              <div className="mt-4">
                <Button onClick={openWizard} startIcon={<PlusIcon className="w-4 h-4" />}>Create First Program</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <div key={p.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="text-lg font-semibold text-gray-800 dark:text-white/90">{p.name}</div>
                      <div className="relative">
                        <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === p.id ? null : p.id))}>
                          <MoreDotIcon className="w-4 h-4" />
                        </button>
                        <Dropdown isOpen={openMenuId === p.id} onClose={() => setOpenMenuId(null)}>
                          <DropdownItem onClick={() => { setOpenMenuId(null); duplicateProgram(p.id); }}>Duplicate</DropdownItem>
                          <DropdownItem onClick={() => { setOpenMenuId(null); deleteProgram(p.id); }}>Delete</DropdownItem>
                        </Dropdown>
                      </div>
                    </div>
                    <div className="mt-1 text-theme-xs text-gray-600">Category: {p.category}</div>
                    <div className="text-theme-xs text-gray-600">Institution: {p.institution}</div>
                    <div className="text-theme-xs text-gray-600">Type: {p.type === "SingleCourse" ? "Single Course" : p.type === "MultiPart" ? "Multi-Part" : p.type === "Levels" ? "Levels" : "Custom"}</div>
                    {p.partsCount ? <div className="text-theme-xs text-gray-600">Parts: {p.partsCount}</div> : null}
                    {p.papersCount ? <div className="text-theme-xs text-gray-600">Papers: {p.papersCount}</div> : null}
                    <div className="text-theme-xs text-gray-600">Courses: {p.coursesCount}</div>
                    <div className="mt-2 text-theme-xs">{p.status === "Active" ? <span className="text-success-600">● Active</span> : <span className="text-gray-400">● Inactive</span>}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="outline">Manage</Button>
                      <Button variant="outline" startIcon={<PencilIcon className="w-4 h-4" />} onClick={() => openEdit(p.id)}>Edit</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ComponentCard>

      <Modal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} isFullscreen>
        <div className="fixed inset-0 flex justify-end">
          <div className="h-full w-full max-w-xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={() => setIsWizardOpen(false)}>←</button>
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Program</div>
              <div className="ml-auto text-theme-xs text-gray-500">Step {wizardStep} of 4</div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-theme-xs text-gray-600">Program Name</div>
                      <Input value={wName} onChange={(e) => setWName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <div className="text-theme-xs text-gray-600">Category</div>
                        <Select options={categoryOptions} defaultValue={wCategory} onChange={(v) => setWCategory(v as string)} />
                      </div>
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Description</div>
                      <Input value={wDescription} onChange={(e) => setWDescription(e.target.value)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Program Type</div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button variant={wType === "SingleCourse" ? undefined : "outline"} onClick={() => setWType("SingleCourse")}>Single Course</Button>
                        <Button variant={wType === "MultiPart" ? undefined : "outline"} onClick={() => setWType("MultiPart")}>Multi-Part</Button>
                        <Button variant={wType === "Levels" ? undefined : "outline"} onClick={() => setWType("Levels")}>Levels → Papers</Button>
                        <Button variant={wType === "Custom" ? undefined : "outline"} onClick={() => setWType("Custom")}>Custom</Button>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    {wType === "SingleCourse" && (
                      <div>
                        <div className="text-theme-xs text-gray-600">Course Name</div>
                        <Input value={wCourseName || wName} onChange={(e) => setWCourseName(e.target.value)} />
                        <div className="mt-1 text-theme-xs text-gray-500">Will create 1 course under this program.</div>
                      </div>
                    )}
                    {wType === "MultiPart" && (
                      <div className="space-y-3">
                        <div className="text-theme-xs text-gray-600">Add Program Parts</div>
                        <div className="flex flex-wrap gap-2">
                          {wParts.map((part, idx) => (
                            <span key={idx} className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1 text-theme-xs dark:border-gray-800">
                              {part}
                              <button className="text-gray-400" onClick={() => setWParts((prev) => prev.filter((_, i) => i !== idx))}>×</button>
                            </span>
                          ))}
                          <Button size="sm" variant="outline" onClick={addPart}>Add</Button>
                        </div>
                        <div className="mt-2">
                          <Checkbox label="Automatically create a Course for each Part" checked={wAutoCreateParts} onChange={setWAutoCreateParts} />
                        </div>
                        <div className="mt-1 text-theme-xs text-gray-500">Drag to reorder later in Manage.</div>
                      </div>
                    )}
                    {wType === "Levels" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="text-theme-xs text-gray-600">Levels</div>
                          <Button size="sm" variant="outline" onClick={addLevel}>Add Level</Button>
                        </div>
                        <div className="space-y-2">
                          {wLevels.map((lv, li) => (
                            <div key={li} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                              <div className="flex items-center gap-2">
                                <Input value={lv.name} onChange={(e) => setWLevels((prev) => prev.map((x, i) => (i === li ? { ...x, name: e.target.value } : x)))} />
                                <Button size="sm" variant="outline" onClick={() => addPaperToLevel(li)}>Add Paper</Button>
                              </div>
                              <ul className="mt-2 ml-4 list-disc text-theme-xs text-gray-600">
                                {lv.papers.map((ppr, pi) => (
                                  <li key={pi} className="flex items-center gap-2">
                                    <Input value={ppr} onChange={(e) => setWLevels((prev) => prev.map((x, i) => (i === li ? { ...x, papers: x.papers.map((pp, j) => (j === pi ? e.target.value : pp)) } : x)))} />
                                    <button className="text-gray-400" onClick={() => setWLevels((prev) => prev.map((x, i) => (i === li ? { ...x, papers: x.papers.filter((_, j) => j !== pi) } : x)))}>×</button>
                                  </li>
                                ))}
                              </ul>
                              <button className="mt-2 text-theme-xs text-gray-500" onClick={() => setWLevels((prev) => prev.filter((_, i) => i !== li))}>Remove Level</button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2">
                          <Checkbox label="Auto-create courses for each Paper" checked={wAutoCreatePapers} onChange={setWAutoCreatePapers} />
                          <div className="mt-1">
                            <Checkbox label="Auto-create level courses" checked={wAutoCreateLevels} onChange={setWAutoCreateLevels} />
                          </div>
                        </div>
                      </div>
                    )}
                    {wType === "Custom" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="text-theme-xs text-gray-600">Sections</div>
                          <Button size="sm" variant="outline" onClick={addSection}>Add Section</Button>
                        </div>
                        <div className="space-y-2">
                          {wSections.map((sec, si) => (
                            <div key={si} className="flex items-center gap-2">
                              <Input value={sec} onChange={(e) => setWSections((prev) => prev.map((x, i) => (i === si ? e.target.value : x)))} />
                              <button className="text-gray-400" onClick={() => setWSections((prev) => prev.filter((_, i) => i !== si))}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div className="text-theme-xs text-gray-600">Auto-Create Courses</div>
                    <div className="space-y-2">
                      <Checkbox label="Part" checked={wAutoCreateParts} onChange={setWAutoCreateParts} />
                      <Checkbox label="Paper" checked={wAutoCreatePapers} onChange={setWAutoCreatePapers} />
                      <Checkbox label="Level (optional)" checked={wAutoCreateLevels} onChange={setWAutoCreateLevels} />
                    </div>
                    <div className="text-theme-xs text-gray-500">Naming: {wName ? `${wName} – [Part/Paper]` : "[Program Name] – [Part Name]"}</div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Final Review</div>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="text-theme-xs text-gray-600">Program: {wName}</div>
                        <div className="text-theme-xs text-gray-600">Type: {wType}</div>
                        {wType === "MultiPart" ? <div className="text-theme-xs text-gray-600">Parts: {wParts.join(", ")}</div> : null}
                        {wType === "Levels" ? <div className="text-theme-xs text-gray-600">Papers: {wLevels.reduce((acc, lv) => acc + lv.papers.length, 0)}</div> : null}
                        <div className="text-theme-xs text-gray-600">Courses to be created: {(() => {
                          if (wType === "SingleCourse") return 1;
                          if (wType === "MultiPart") return wAutoCreateParts ? wParts.length : 0;
                          if (wType === "Levels") return wAutoCreatePapers ? wLevels.reduce((acc, lv) => acc + lv.papers.length, 0) : 0;
                          return 0;
                        })()}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setWizardStep((s) => Math.max(1, s - 1))}>Back</Button>
                </div>
                <div className="flex items-center gap-2">
                  {wizardStep < 4 ? (
                    <Button onClick={() => setWizardStep((s) => Math.min(4, s + 1))}>Next</Button>
                  ) : (
                    <Button onClick={saveProgramFromWizard}>Confirm & Save</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} isFullscreen>
        <div className="fixed inset-0 flex justify-end">
          <div className="h-full w-full max-w-xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={() => setIsEditOpen(false)}>←</button>
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit Program</div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div>
                  <div className="text-theme-xs text-gray-600">Name</div>
                  <Input value={eName} onChange={(e) => setEName(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-theme-xs text-gray-600">Institution</div>
                    <Select options={[{ value: "NorthStar", label: "NorthStar" }, { value: "Dev Institute", label: "Dev Institute" }]} defaultValue={eInstitution} onChange={(v) => setEInstitution(v as string)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Category</div>
                    <Select options={categoryOptions} defaultValue={eCategory} onChange={(v) => setECategory(v as string)} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="text-theme-sm text-gray-800 dark:text-white/90">Status</div>
                  <Switch label="" defaultChecked={eStatus === "Active"} onChange={(v) => setEStatus(v ? "Active" : "Inactive")} />
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Priority</div>
                  <Input value={String(ePriority)} onChange={(e) => setEPriority(Number(e.target.value) || 1)} />
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Description</div>
                  <Input value={eDescription} onChange={(e) => setEDescription(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={saveEdit}>Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}