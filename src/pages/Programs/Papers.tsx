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
import Checkbox from "../../components/form/input/Checkbox";
import Switch from "../../components/form/switch/Switch";
import { PlusIcon, MoreDotIcon, PencilIcon } from "../../icons";

type ProgramType = "SingleCourse" | "MultiPart" | "Levels" | "Custom";
type Status = "Active" | "Inactive";

type Program = {
  id: string;
  name: string;
  institution: string;
  category: string;
  type: ProgramType;
  parts?: string[];
  levels?: { name: string; papers: string[] }[];
};

type PaperItem = {
  id: string;
  name: string;
  code: string;
  slug: string;
  programId: string;
  programName: string;
  levelOrPart: string;
  institution: string;
  category: string;
  courseLinked?: string;
  status: Status;
  order?: number;
  showPublic?: boolean;
  description?: string;
  createdAt: number;
};

function readPrograms(): Program[] {
  try {
    const raw = localStorage.getItem("programs");
    if (raw) return JSON.parse(raw) as Program[];
  } catch { void 0 }
  return [
    { id: "acca", name: "ACCA", institution: "NorthStar", category: "Accountancy", type: "Levels", levels: [ { name: "Applied Knowledge", papers: ["BT", "MA", "FA"] }, { name: "Applied Skills", papers: ["LW", "PM", "TX", "FR", "AA", "FM"] } ] },
    { id: "cpa-us", name: "CPA US", institution: "NorthStar", category: "Accountancy", type: "MultiPart", parts: ["FAR", "AUD", "REG", "BEC"] },
  ];
}

function seedPapers(programs: Program[]): PaperItem[] {
  const items: PaperItem[] = [];
  programs.forEach((p) => {
    if (p.type === "Levels" && p.levels) {
      p.levels.forEach((lv) => {
        lv.papers.forEach((code) => {
          const nameMap: Record<string, string> = { BT: "Business & Technology", MA: "Management Accounting", FA: "Financial Accounting", LW: "Corporate & Business Law", PM: "Performance Management", TX: "Taxation", FR: "Financial Reporting", AA: "Audit & Assurance", FM: "Financial Management" };
          const name = nameMap[code] || code;
          items.push({ id: `${p.id}-paper-${code.toLowerCase()}`, name, code, slug: code.toLowerCase(), programId: p.id, programName: p.name, levelOrPart: lv.name, institution: p.institution, category: p.category, courseLinked: `1 Course`, status: "Active", order: undefined, showPublic: true, createdAt: Date.now() - 10000 });
        });
      });
    }
    if (p.type === "MultiPart" && p.parts) {
      p.parts.forEach((part) => {
        const code = part.toUpperCase();
        items.push({ id: `${p.id}-paper-${code.toLowerCase()}`, name: part, code, slug: code.toLowerCase(), programId: p.id, programName: p.name, levelOrPart: part, institution: p.institution, category: p.category, courseLinked: `1 Course`, status: "Active", order: undefined, showPublic: true, createdAt: Date.now() - 9000 });
      });
    }
  });
  return items;
}

function readPaperItems(): PaperItem[] {
  try {
    const raw = localStorage.getItem("papers");
    if (raw) return JSON.parse(raw) as PaperItem[];
  } catch { void 0 }
  const programs = readPrograms();
  return seedPapers(programs);
}

function writePaperItems(items: PaperItem[]) {
  try { localStorage.setItem("papers", JSON.stringify(items)); } catch { void 0 }
}

export default function PapersPage() {
  const [papers, setPapers] = useState<PaperItem[]>([]);
  const [search, setSearch] = useState("");
  const programs = readPrograms();
  const programOptions = [{ value: "", label: "All" }, ...programs.map((p) => ({ value: p.id, label: p.name }))];
  const [program, setProgram] = useState<string>("");
  const [levelPart, setLevelPart] = useState<string>("");
  const [status, setStatus] = useState<"All" | Status>("All");
  const [sortBy, setSortBy] = useState<"order" | "name" | "code" | "program">("order");

  useEffect(() => {
    setPapers(readPaperItems());
  }, []);

  const dynamicLevelOptions = useMemo(() => {
    if (!program) return [] as { value: string; label: string }[];
    const p = programs.find((x) => x.id === program);
    if (!p) return [];
    if (p.type === "Levels") return (p.levels || []).map((lv) => ({ value: lv.name, label: lv.name }));
    if (p.type === "MultiPart") return (p.parts || []).map((pt) => ({ value: pt, label: pt }));
    return [];
  }, [programs, program]);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let arr = papers.filter((it) => {
      const matchTxt = txt ? [it.name, it.code, it.levelOrPart, it.programName].some((v) => v.toLowerCase().includes(txt)) : true;
      const matchProg = program ? it.programId === program : true;
      const matchLvl = levelPart ? it.levelOrPart === levelPart : true;
      const matchStatus = status === "All" ? true : it.status === status;
      return matchTxt && matchProg && matchLvl && matchStatus;
    });
    if (sortBy === "order") arr = arr.sort((a, b) => (a.order || 999) - (b.order || 999));
    if (sortBy === "name") arr = arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "code") arr = arr.sort((a, b) => a.code.localeCompare(b.code));
    if (sortBy === "program") arr = arr.sort((a, b) => a.programName.localeCompare(b.programName));
    return arr;
  }, [papers, search, program, levelPart, status, sortBy]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState(1);
  const [dProgramId, setDProgramId] = useState<string>("");
  const [dLevelPart, setDLevelPart] = useState<string>("");
  const [dName, setDName] = useState("");
  const [dCode, setDCode] = useState("");
  const [dSlug, setDSlug] = useState("");
  const [dDescription, setDDescription] = useState("");
  const [dAutoCourse, setDAutoCourse] = useState(true);
  const [dCourseName, setDCourseName] = useState("");
  const [dOrder, setDOrder] = useState<number>(1);
  const [dStatus, setDStatus] = useState<Status>("Active");
  const [dShowPublic, setDShowPublic] = useState(true);

  const openAdd = () => {
    setIsDrawerOpen(true);
    setDrawerStep(1);
    setDProgramId(program || programOptions[1]?.value || "");
    setDLevelPart("");
    setDName("");
    setDCode("");
    setDSlug("");
    setDDescription("");
    setDAutoCourse(true);
    setDCourseName("");
    setDOrder((papers.length || 0) + 1);
    setDStatus("Active");
    setDShowPublic(true);
  };

  useEffect(() => {
    const p = programs.find((x) => x.id === dProgramId);
    if (!p) return;
    const base = `${p.name}${dLevelPart ? ` – ${dLevelPart}` : ""}${dName ? ` – ${dName}` : ""}`;
    setDCourseName(base);
  }, [programs, dProgramId, dLevelPart, dName]);

  const regenerateSlug = () => {
    const s = (dCode || dName || "").trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
    setDSlug(s);
  };

  const savePaper = () => {
    const name = dName.trim();
    const code = dCode.trim();
    if (!name || !code || !dProgramId || !dLevelPart) return;
    const prog = programs.find((p) => p.id === dProgramId);
    if (!prog) return;
    const id = `${prog.id}-paper-${(dSlug || code.toLowerCase()).replace(/[^a-z0-9-]/g, "")}`;
    const item: PaperItem = {
      id,
      name,
      code,
      slug: dSlug || code.toLowerCase(),
      programId: prog.id,
      programName: prog.name,
      levelOrPart: dLevelPart,
      institution: prog.institution,
      category: prog.category,
      courseLinked: dAutoCourse ? (dCourseName || `${prog.name} – ${dLevelPart} – ${code}`) : undefined,
      status: dStatus,
      order: dOrder || undefined,
      showPublic: dShowPublic,
      description: dDescription || undefined,
      createdAt: Date.now(),
    };
    setPapers((prev) => {
      const next = [item, ...prev];
      writePaperItems(next);
      return next;
    });
    setIsDrawerOpen(false);
  };

  const duplicatePaper = (id: string) => {
    const it = papers.find((x) => x.id === id);
    if (!it) return;
    const copy: PaperItem = { ...it, id: `${it.id}-copy-${Date.now()}`, name: `${it.name} Copy`, createdAt: Date.now() };
    setPapers((prev) => {
      const next = [copy, ...prev];
      writePaperItems(next);
      return next;
    });
  };

  const deletePaper = (id: string) => {
    const it = papers.find((x) => x.id === id);
    if (!it) return;
    const ok = window.confirm("Delete this paper?");
    if (!ok) return;
    setPapers((prev) => {
      const next = prev.filter((x) => x.id !== id);
      writePaperItems(next);
      return next;
    });
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <>
      <PageMeta title="Papers" description="Manage all papers across levels & programs" />
      <PageBreadcrumb pageTitle="Papers" />
      <ComponentCard title="Papers">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-xl">
              <Input placeholder="Search papers" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Program</span>
                <Select options={programOptions} defaultValue={program} onChange={(v) => { setProgram(v as string); setLevelPart(""); }} />
              </div>
              <Button onClick={openAdd} startIcon={<PlusIcon className="w-4 h-4" />}>Add Paper</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 animate-[slideIn_0.26s_ease-out]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Program</span>
              <Select options={programOptions} defaultValue={program} onChange={(v) => { setProgram(v as string); setLevelPart(""); }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Level / Part</span>
              <Select options={dynamicLevelOptions} defaultValue={levelPart} onChange={(v) => setLevelPart(v as string)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Status</span>
              <Select options={[{ value: "All", label: "All" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} defaultValue={status} onChange={(v) => setStatus(v as typeof status)} />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort</span>
              <Select options={[{ value: "order", label: "Order" }, { value: "name", label: "Name" }, { value: "code", label: "Code" }, { value: "program", label: "Program" }]} defaultValue={sortBy} onChange={(v) => setSortBy(v as typeof sortBy)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-3xl">📄</div>
              <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">No Papers Found</div>
              <div className="mt-1 text-theme-xs text-gray-500">Papers help define exam structure inside each level or part.</div>
              <div className="mt-4">
                <Button onClick={openAdd} startIcon={<PlusIcon className="w-4 h-4" />}>Add Paper</Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Paper Name</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Code</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Level/Part</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Program</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Course Linked</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {filtered.map((it) => (
                      <TableRow key={it.id} className="transition hover:bg-blue-50/40">
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          <button className="underline decoration-dotted">{it.name}</button>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{it.code}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{it.levelOrPart}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{it.programName}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{it.courseLinked || "None"}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="relative">
                            <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === it.id ? null : it.id))}>
                              <MoreDotIcon className="w-4 h-4" />
                            </button>
                            <Dropdown isOpen={openMenuId === it.id} onClose={() => setOpenMenuId(null)}>
                              <DropdownItem>Edit</DropdownItem>
                              <DropdownItem>Manage</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); duplicatePaper(it.id); }}>Duplicate</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); deletePaper(it.id); }}>Delete</DropdownItem>
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
          <div className="h-full w-full max-w-xl bg-white shadow-2xl dark:bg-gray-900 animate-[slideIn_0.26s_ease-out]">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={() => setIsDrawerOpen(false)}>←</button>
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Add New Paper</div>
              <div className="ml-auto text-theme-xs text-gray-500">Step {drawerStep} of 4</div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {drawerStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-theme-xs text-gray-600">Program</div>
                      <Select options={programOptions.slice(1)} defaultValue={dProgramId} onChange={(v) => { setDProgramId(v as string); setDLevelPart(""); }} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Level / Part</div>
                      <Select options={(() => { const p = programs.find((x) => x.id === dProgramId); if (!p) return []; if (p.type === "Levels") return (p.levels || []).map((lv) => ({ value: lv.name, label: lv.name })); if (p.type === "MultiPart") return (p.parts || []).map((pt) => ({ value: pt, label: pt })); return []; })()} defaultValue={dLevelPart} onChange={(v) => setDLevelPart(v as string)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-theme-xs text-gray-600">Paper Name</div>
                        <Input value={dName} onChange={(e) => setDName(e.target.value)} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Paper Code</div>
                        <Input value={dCode} onChange={(e) => setDCode(e.target.value.toUpperCase())} />
                      </div>
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Slug</div>
                      <div className="flex items-center gap-2">
                        <Input value={dSlug} onChange={(e) => setDSlug(e.target.value)} />
                        <Button size="sm" variant="outline" onClick={regenerateSlug} startIcon={<PencilIcon className="w-4 h-4" />}>Recreate</Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Description</div>
                      <Input value={dDescription} onChange={(e) => setDDescription(e.target.value)} />
                    </div>
                  </div>
                )}

                {drawerStep === 2 && (
                  <div className="space-y-4">
                    <div className="text-theme-xs text-gray-600">Automation Options</div>
                    <div className="space-y-2">
                      <Checkbox label="Auto-create Course for this Paper" checked={dAutoCourse} onChange={setDAutoCourse} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Course Name Convention</div>
                      <Input value={dCourseName} onChange={(e) => setDCourseName(e.target.value)} />
                    </div>
                  </div>
                )}

                {drawerStep === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-theme-xs text-gray-600">Order</div>
                        <Input value={String(dOrder)} onChange={(e) => setDOrder(Number(e.target.value) || 1)} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Status</div>
                        <Select options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} defaultValue={dStatus} onChange={(v) => setDStatus(v as Status)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                      <div className="text-theme-sm text-gray-800 dark:text-white/90">Show on public course page?</div>
                      <Switch label="" defaultChecked={dShowPublic} onChange={(v) => setDShowPublic(v)} />
                    </div>
                  </div>
                )}

                {drawerStep === 4 && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Final Review</div>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="text-theme-xs text-gray-600">Paper: {dName} ({dCode})</div>
                        <div className="text-theme-xs text-gray-600">Program: {programs.find((p) => p.id === dProgramId)?.name || ""}</div>
                        <div className="text-theme-xs text-gray-600">Level/Part: {dLevelPart}</div>
                        <div className="text-theme-xs text-gray-600">Course: {dAutoCourse ? dCourseName || "Will be created" : "None"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setDrawerStep((s) => Math.max(1, s - 1))}>Back</Button>
                </div>
                <div className="flex items-center gap-2">
                  {drawerStep < 4 ? (
                    <Button onClick={() => setDrawerStep((s) => Math.min(4, s + 1))}>Next</Button>
                  ) : (
                    <Button onClick={savePaper}>Create Paper</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}