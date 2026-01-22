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

type ItemType = "Part" | "Level" | "Paper" | "Custom";
type ItemStatus = "Active" | "Inactive";

type Program = {
  id: string;
  name: string;
  institution: string;
  category: string;
  type: "SingleCourse" | "MultiPart" | "Levels" | "Custom";
  parts?: string[];
  levels?: { name: string; papers: string[] }[];
  sections?: string[];
};

type PartLevelItem = {
  id: string;
  name: string;
  slug: string;
  programId: string;
  programName: string;
  institution: string;
  category: string;
  type: ItemType;
  parentName?: string;
  order?: number;
  mappedLabel?: string;
  status: ItemStatus;
  showOnProgram?: boolean;
  description?: string;
  createdAt: number;
};

function readPrograms(): Program[] {
  try {
    const raw = localStorage.getItem("programs");
    if (raw) return JSON.parse(raw) as Program[];
  } catch { void 0 }
  return [
    { id: "cpa-us", name: "CPA US", institution: "NorthStar", category: "Accountancy", type: "MultiPart", parts: ["FAR", "AUD", "REG", "BEC"] },
    { id: "acca", name: "ACCA", institution: "NorthStar", category: "Accountancy", type: "Levels", levels: [ { name: "Applied Knowledge", papers: ["BT", "MA", "FA"] }, { name: "Applied Skills", papers: ["LW", "PM", "TX"] } ] },
    { id: "fsd", name: "Full Stack Development", institution: "Dev Institute", category: "Coding", type: "Custom", sections: ["MERN Modules"] },
  ];
}

function seedFromPrograms(programs: Program[]): PartLevelItem[] {
  const items: PartLevelItem[] = [];
  programs.forEach((p) => {
    if (p.type === "MultiPart" && p.parts) {
      p.parts.forEach((part, idx) => {
        items.push({ id: `${p.id}-part-${part.toLowerCase()}`, name: part, slug: part.toLowerCase(), programId: p.id, programName: p.name, institution: p.institution, category: p.category, type: "Part", order: idx + 1, mappedLabel: "1 Course", status: "Active", createdAt: Date.now() - 10000 });
      });
    }
    if (p.type === "Levels" && p.levels) {
      p.levels.forEach((lv, idx) => {
        items.push({ id: `${p.id}-level-${lv.name.toLowerCase().replace(/\s+/g, "-")}`, name: lv.name, slug: lv.name.toLowerCase().replace(/\s+/g, "-"), programId: p.id, programName: p.name, institution: p.institution, category: p.category, type: "Level", order: idx + 1, mappedLabel: `${lv.papers.length} Papers`, status: "Active", createdAt: Date.now() - 9000 });
        lv.papers.forEach((pp) => {
          items.push({ id: `${p.id}-paper-${pp.toLowerCase().replace(/\s+/g, "-")}`, name: pp, slug: pp.toLowerCase().replace(/\s+/g, "-"), programId: p.id, programName: p.name, institution: p.institution, category: p.category, type: "Paper", parentName: lv.name, mappedLabel: "1 Course", status: "Active", createdAt: Date.now() - 8000 });
        });
      });
    }
    if (p.type === "Custom" && p.sections) {
      p.sections.forEach((sec) => {
        items.push({ id: `${p.id}-custom-${sec.toLowerCase().replace(/\s+/g, "-")}`, name: sec, slug: sec.toLowerCase().replace(/\s+/g, "-"), programId: p.id, programName: p.name, institution: p.institution, category: p.category, type: "Custom", mappedLabel: "3 Modules", status: "Inactive", createdAt: Date.now() - 7000 });
      });
    }
  });
  return items;
}

function readItems(): PartLevelItem[] {
  try {
    const raw = localStorage.getItem("partsLevels");
    if (raw) return JSON.parse(raw) as PartLevelItem[];
  } catch { void 0 }
  const programs = readPrograms();
  return seedFromPrograms(programs);
}

function writeItems(items: PartLevelItem[]) {
  try { localStorage.setItem("partsLevels", JSON.stringify(items)); } catch { void 0 }
}

export default function PartsLevelsPage() {
  const [items, setItems] = useState<PartLevelItem[]>([]);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState<string>("");
  const [institution, setInstitution] = useState<string>("");
  const [type, setType] = useState<"All" | ItemType>("All");
  const [status, setStatus] = useState<"All" | ItemStatus>("All");
  const [sortBy, setSortBy] = useState<"order" | "name" | "program">("order");

  const programs = readPrograms();
  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }));
  const institutionOptions = Array.from(new Set(programs.map((p) => p.institution))).map((n) => ({ value: n, label: n }));

  useEffect(() => {
    setItems(readItems());
  }, []);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let arr = items.filter((it) => {
      const matchTxt = txt ? [it.name, it.programName, it.category, it.institution].some((v) => v.toLowerCase().includes(txt)) : true;
      const matchProg = program ? it.programId === program : true;
      const matchInst = institution ? it.institution === institution : true;
      const matchType = type === "All" ? true : it.type === type;
      const matchStatus = status === "All" ? true : it.status === status;
      return matchTxt && matchProg && matchInst && matchType && matchStatus;
    });
    if (sortBy === "order") arr = arr.sort((a, b) => (a.order || 999) - (b.order || 999));
    if (sortBy === "name") arr = arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "program") arr = arr.sort((a, b) => a.programName.localeCompare(b.programName));
    return arr;
  }, [items, search, program, institution, type, status, sortBy]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState(1);
  const [dProgramId, setDProgramId] = useState<string>("");
  const [dName, setDName] = useState("");
  const [dSlug, setDSlug] = useState("");
  const [dDescription, setDDescription] = useState("");
  const [dType, setDType] = useState<ItemType>("Part");
  const [dParentName, setDParentName] = useState<string>("");
  const [dPapers, setDPapers] = useState<string[]>([]);
  const [dAutoCourse, setDAutoCourse] = useState(true);
  const [dAutoTemplate, setDAutoTemplate] = useState(false);
  const [dOrder, setDOrder] = useState<number>(1);
  const [dStatus, setDStatus] = useState<ItemStatus>("Active");
  const [dShowOnProgram, setDShowOnProgram] = useState(true);

  const openAdd = () => {
    setIsDrawerOpen(true);
    setDrawerStep(1);
    setDProgramId(program || programOptions[0]?.value || "");
    setDName("");
    setDSlug("");
    setDDescription("");
    setDType("Part");
    setDParentName("");
    setDPapers([]);
    setDAutoCourse(true);
    setDAutoTemplate(false);
    setDOrder((items.length || 0) + 1);
    setDStatus("Active");
    setDShowOnProgram(true);
  };

  const regenerateSlug = () => {
    const s = (dName || "").trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
    setDSlug(s);
  };

  const saveItem = () => {
    const name = dName.trim();
    if (!name || !dProgramId) return;
    const prog = programs.find((p) => p.id === dProgramId);
    if (!prog) return;
    const id = `${prog.id}-${dType.toLowerCase()}-${(dSlug || name.toLowerCase().replace(/\s+/g, "-")).replace(/[^a-z0-9-]/g, "")}`;
    const item: PartLevelItem = {
      id,
      name,
      slug: dSlug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      programId: prog.id,
      programName: prog.name,
      institution: prog.institution,
      category: prog.category,
      type: dType,
      parentName: dType === "Paper" ? dParentName || undefined : undefined,
      order: dOrder || undefined,
      mappedLabel: dType === "Part" || dType === "Paper" ? (dAutoCourse ? "1 Course" : undefined) : dType === "Level" ? (dPapers.length ? `${dPapers.length} Papers` : undefined) : undefined,
      status: dStatus,
      showOnProgram: dShowOnProgram,
      description: dDescription || undefined,
      createdAt: Date.now(),
    };
    setItems((prev) => {
      const next = [item, ...prev];
      writeItems(next);
      return next;
    });
    setIsDrawerOpen(false);
  };

  const duplicateItem = (id: string) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const copy: PartLevelItem = { ...it, id: `${it.id}-copy-${Date.now()}`, name: `${it.name} Copy`, createdAt: Date.now() };
    setItems((prev) => {
      const next = [copy, ...prev];
      writeItems(next);
      return next;
    });
  };

  const deleteItem = (id: string) => {
    const ok = window.confirm("Delete this item?");
    if (!ok) return;
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      writeItems(next);
      return next;
    });
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <>
      <PageMeta title="Program Parts / Levels" description="Manage sub-structures inside each program" />
      <PageBreadcrumb pageTitle="Program Parts / Levels" />
      <ComponentCard title="Program Parts / Levels">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-xl">
              <Input placeholder="Search parts / levels" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openAdd} startIcon={<PlusIcon className="w-4 h-4" />}>Add Part / Level</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 animate-[slideIn_0.28s_ease-out]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Program</span>
              <Select options={programOptions} defaultValue={program} onChange={(v) => setProgram(v as string)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Institution</span>
              <Select options={institutionOptions} defaultValue={institution} onChange={(v) => setInstitution(v as string)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Type</span>
              <Select options={[{ value: "All", label: "All" }, { value: "Part", label: "Part" }, { value: "Level", label: "Level" }, { value: "Paper", label: "Paper" }, { value: "Custom", label: "Custom Section" }]} defaultValue={type} onChange={(v) => setType(v as typeof type)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Status</span>
              <Select options={[{ value: "All", label: "All" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} defaultValue={status} onChange={(v) => setStatus(v as typeof status)} />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort</span>
              <Select options={[{ value: "order", label: "Order" }, { value: "name", label: "Name" }, { value: "program", label: "Program" }]} defaultValue={sortBy} onChange={(v) => setSortBy(v as typeof sortBy)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-3xl">📦</div>
              <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">No Parts or Levels Added Yet</div>
              <div className="mt-1 text-theme-xs text-gray-500">Add parts, levels, or papers to structure this program.</div>
              <div className="mt-4">
                <Button onClick={openAdd} startIcon={<PlusIcon className="w-4 h-4" />}>Add Part / Level</Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Part / Level</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Program</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Type</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Order</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Mapped Courses</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Status</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {filtered.map((it) => (
                      <TableRow key={it.id} className="transition hover:bg-gray-50">
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          <button className="underline decoration-dotted">{it.name}</button>
                          {it.parentName ? <div className="text-theme-xs text-gray-500">Parent: {it.parentName}</div> : null}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{it.programName}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{it.type}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{it.order ?? "-"}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{it.mappedLabel ?? "-"}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          {it.status === "Active" ? (
                            <span className="inline-flex items-center text-success-600">Active</span>
                          ) : (
                            <span className="inline-flex items-center text-gray-400">Inactive</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="relative">
                            <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === it.id ? null : it.id))}>
                              <MoreDotIcon className="w-4 h-4" />
                            </button>
                            <Dropdown isOpen={openMenuId === it.id} onClose={() => setOpenMenuId(null)}>
                              <DropdownItem>Edit</DropdownItem>
                              <DropdownItem>Manage</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); duplicateItem(it.id); }}>Duplicate</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); deleteItem(it.id); }}>Delete</DropdownItem>
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
          <div className="h-full w-full max-w-xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={() => setIsDrawerOpen(false)}>←</button>
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Program Part / Level</div>
              <div className="ml-auto text-theme-xs text-gray-500">Step {drawerStep} of 4</div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {drawerStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-theme-xs text-gray-600">Program</div>
                      <Select options={programOptions} defaultValue={dProgramId} onChange={(v) => setDProgramId(v as string)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-theme-xs text-gray-600">Name</div>
                        <Input value={dName} onChange={(e) => setDName(e.target.value)} />
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
                      <div className="text-theme-xs text-gray-600">Description</div>
                      <Input value={dDescription} onChange={(e) => setDDescription(e.target.value)} />
                    </div>
                  </div>
                )}

                {drawerStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-theme-xs text-gray-600">Type</div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button variant={dType === "Part" ? undefined : "outline"} onClick={() => setDType("Part")}>Part</Button>
                        <Button variant={dType === "Level" ? undefined : "outline"} onClick={() => setDType("Level")}>Level</Button>
                        <Button variant={dType === "Paper" ? undefined : "outline"} onClick={() => setDType("Paper")}>Paper</Button>
                        <Button variant={dType === "Custom" ? undefined : "outline"} onClick={() => setDType("Custom")}>Custom Section</Button>
                      </div>
                    </div>
                    {dType === "Paper" && (
                      <div>
                        <div className="text-theme-xs text-gray-600">Parent Level / Part</div>
                        <Input value={dParentName} onChange={(e) => setDParentName(e.target.value)} />
                      </div>
                    )}
                    {dType === "Level" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="text-theme-xs text-gray-600">Papers</div>
                          <Button size="sm" variant="outline" onClick={() => { const name = prompt("Add Paper name") || ""; if (!name.trim()) return; setDPapers((prev) => [...prev, name.trim()]); }}>Add Paper</Button>
                        </div>
                        <div className="space-y-2">
                          {dPapers.map((pp, pi) => (
                            <div key={pi} className="flex items-center gap-2">
                              <Input value={pp} onChange={(e) => setDPapers((prev) => prev.map((x, i) => (i === pi ? e.target.value : x)))} />
                              <button className="text-gray-400" onClick={() => setDPapers((prev) => prev.filter((_, i) => i !== pi))}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {drawerStep === 3 && (
                  <div className="space-y-4">
                    <div className="text-theme-xs text-gray-600">Automation Options</div>
                    <div className="space-y-2">
                      <Checkbox label="Auto-create a Course for this Part / Paper" checked={dAutoCourse} onChange={setDAutoCourse} />
                      <Checkbox label="Auto-create default Curriculum Template" checked={dAutoTemplate} onChange={setDAutoTemplate} />
                    </div>
                  </div>
                )}

                {drawerStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-theme-xs text-gray-600">Order</div>
                        <Input value={String(dOrder)} onChange={(e) => setDOrder(Number(e.target.value) || 1)} />
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Status</div>
                        <Select options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} defaultValue={dStatus} onChange={(v) => setDStatus(v as ItemStatus)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                      <div className="text-theme-sm text-gray-800 dark:text-white/90">Show this part on program page?</div>
                      <Switch label="" defaultChecked={dShowOnProgram} onChange={(v) => setDShowOnProgram(v)} />
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
                    <Button onClick={saveItem}>Save Part / Level</Button>
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