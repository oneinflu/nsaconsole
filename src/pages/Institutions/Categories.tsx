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
import { PlusIcon, MoreDotIcon, PencilIcon } from "../../icons";
import Switch from "../../components/form/switch/Switch";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  status: "Active" | "Inactive";
  priority: number;
  showOnHomepage: boolean;
  programsCount: number;
};

function readCategories(): Category[] {
  try {
    const raw = localStorage.getItem("categories");
    if (raw) return JSON.parse(raw) as Category[];
  } catch { void 0 }
  return [
    { id: "accountancy", name: "Accountancy", slug: "accountancy", description: "Accounting and finance domain", status: "Active", priority: 1, showOnHomepage: true, programsCount: 12 },
    { id: "coding", name: "Coding", slug: "coding", description: "Software and development tracks", status: "Active", priority: 2, showOnHomepage: true, programsCount: 8 },
    { id: "finance", name: "Finance", slug: "finance", description: "Finance and investment", status: "Inactive", priority: 3, showOnHomepage: false, programsCount: 5 },
    { id: "taxation", name: "Taxation", slug: "taxation", description: "Taxation programs", status: "Active", priority: 4, showOnHomepage: true, programsCount: 9 },
  ];
}

function writeCategories(cats: Category[]) {
  try { localStorage.setItem("categories", JSON.stringify(cats)); } catch { void 0 }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "homepage">("all");
  const [orderBy, setOrderBy] = useState<"name" | "recent" | "priority">("name");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIcon, setFormIcon] = useState<string>("");
  const [formPriority, setFormPriority] = useState<number>(1);
  const [formShowHome, setFormShowHome] = useState<boolean>(true);
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showTree, setShowTree] = useState(false);

  useEffect(() => {
    const data = readCategories();
    setCategories(data);
  }, []);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let arr = categories.filter((c) => {
      const matchTxt = txt ? [c.name, c.slug, c.description || ""].some((v) => v.toLowerCase().includes(txt)) : true;
      const matchFilter = filter === "all" ? true : filter === "active" ? c.status === "Active" : filter === "inactive" ? c.status === "Inactive" : c.showOnHomepage;
      return matchTxt && matchFilter;
    });
    if (orderBy === "name") arr = arr.sort((a, b) => a.name.localeCompare(b.name));
    if (orderBy === "priority") arr = arr.sort((a, b) => a.priority - b.priority);
    if (orderBy === "recent") arr = arr.sort((a, b) => b.slug.localeCompare(a.slug));
    return arr;
  }, [categories, search, filter, orderBy]);

  const openAdd = () => {
    setPanelMode("add");
    setEditingId(null);
    setFormName("");
    setFormSlug("");
    setFormDesc("");
    setFormIcon("");
    setFormPriority(categories.length + 1);
    setFormShowHome(true);
    setFormStatus("Active");
    setIsPanelOpen(true);
  };

  const openEdit = (id: string) => {
    const c = categories.find((x) => x.id === id);
    if (!c) return;
    setPanelMode("edit");
    setEditingId(id);
    setFormName(c.name);
    setFormSlug(c.slug);
    setFormDesc(c.description || "");
    setFormIcon(c.icon || "");
    setFormPriority(c.priority);
    setFormShowHome(c.showOnHomepage);
    setFormStatus(c.status);
    setIsPanelOpen(true);
  };

  const regenerateSlug = () => {
    const s = (formName || "").trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
    setFormSlug(s);
  };

  const saveCategory = () => {
    const name = formName.trim();
    if (!name) return;
    const id = (editingId || name.toLowerCase().replace(/\s+/g, "-")).replace(/[^a-z0-9-]/g, "");
    const slug = (formSlug || name.toLowerCase().replace(/\s+/g, "-")).replace(/[^a-z0-9-]/g, "");
    const item: Category = {
      id,
      name,
      slug,
      description: formDesc || "",
      icon: formIcon || "",
      status: formStatus,
      priority: formPriority || 1,
      showOnHomepage: formShowHome,
      programsCount: categories.find((c) => c.id === editingId)?.programsCount || 0,
    };
    setCategories((prev) => {
      let next: Category[];
      if (panelMode === "edit" && editingId) next = prev.map((x) => (x.id === editingId ? item : x));
      else next = [item, ...prev];
      writeCategories(next);
      return next;
    });
    setIsPanelOpen(false);
  };

  const duplicateCategory = (id: string) => {
    const c = categories.find((x) => x.id === id);
    if (!c) return;
    const copy: Category = { ...c, id: `${c.id}-copy-${Date.now()}`, slug: `${c.slug}-copy`, name: `${c.name} Copy`, priority: categories.length + 1 };
    setCategories((prev) => {
      const next = [copy, ...prev];
      writeCategories(next);
      return next;
    });
  };

  const deleteCategory = (id: string) => {
    const c = categories.find((x) => x.id === id);
    if (!c) return;
    if (c.programsCount > 0) return;
    const ok = window.confirm("Delete this category?");
    if (!ok) return;
    setCategories((prev) => {
      const next = prev.filter((x) => x.id !== id);
      writeCategories(next);
      return next;
    });
  };

  return (
    <>
      <PageMeta title="Categories" description="Manage all top-level domains across institutions" />
      <PageBreadcrumb pageTitle="Categories" />
      <ComponentCard title="Categories">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-xl">
              <Input placeholder="Search categories" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openAdd} startIcon={<PlusIcon className="w-4 h-4" />}>Add Category</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className={`px-3 py-1.5 rounded-full text-sm ${filter === "all" ? "bg-brand-500 text-white shadow-sm" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`} onClick={() => setFilter("all")}>All</button>
            <button className={`px-3 py-1.5 rounded-full text-sm ${filter === "active" ? "bg-brand-500 text-white shadow-sm" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`} onClick={() => setFilter("active")}>Active</button>
            <button className={`px-3 py-1.5 rounded-full text-sm ${filter === "inactive" ? "bg-brand-500 text-white shadow-sm" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`} onClick={() => setFilter("inactive")}>Inactive</button>
            <button className={`px-3 py-1.5 rounded-full text-sm ${filter === "homepage" ? "bg-brand-500 text-white shadow-sm" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`} onClick={() => setFilter("homepage")}>Show on Homepage</button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">Order By</span>
              <Select options={[{ value: "name", label: "Name" }, { value: "recent", label: "Recent" }, { value: "priority", label: "Priority" }]} defaultValue={orderBy} onChange={(v) => setOrderBy(v as typeof orderBy)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-3xl">📂</div>
              <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">No Categories Yet</div>
              <div className="mt-1 text-theme-xs text-gray-500">Categories help organize programs and courses across institutions.</div>
              <div className="mt-4">
                <Button onClick={openAdd} startIcon={<PlusIcon className="w-4 h-4" />}>Create First Category</Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Icon</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Category Name</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Programs</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Status</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Priority</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {filtered.map((c) => (
                      <TableRow key={c.id} className="transition hover:bg-gray-50">
                        <TableCell className="px-5 py-4 text-start">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg">{c.icon ? <img src={c.icon} alt={c.name} className="w-8 h-8 rounded-lg object-cover" /> : "📘"}</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          <button className="underline decoration-dotted" onClick={() => setShowTree(true)}>{c.name}</button>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{String(c.programsCount).padStart(2, "0")}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          {c.status === "Active" ? (
                            <span className="inline-flex items-center text-success-600">• Active</span>
                          ) : (
                            <span className="inline-flex items-center text-gray-400">• Inactive</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{c.priority}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="relative">
                            <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === c.id ? null : c.id))}>
                              <MoreDotIcon className="w-4 h-4" />
                            </button>
                            <Dropdown isOpen={openMenuId === c.id} onClose={() => setOpenMenuId(null)}>
                              <DropdownItem onClick={() => { setOpenMenuId(null); openEdit(c.id); }}>
                                Edit
                              </DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); duplicateCategory(c.id); }}>
                                Duplicate
                              </DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); setShowTree(true); }}>
                                View Programs
                              </DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); deleteCategory(c.id); }}>
                                Delete
                              </DropdownItem>
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

          <ComponentCard title="Category Hierarchy">
            <div className="space-y-2">
              <div className="text-theme-xs text-gray-500">A quick visual of programs under categories</div>
              <div className={`${showTree ? "max-h-[500px]" : "max-h-0"} overflow-hidden transition-all duration-300`}>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  {categories.map((c) => (
                    <div key={c.id} className="mb-3">
                      <div className="font-medium text-gray-800 dark:text-white/90">{c.name}</div>
                      <ul className="mt-1 ml-4 list-disc text-theme-xs text-gray-600">
                        {Array.from({ length: Math.min(Math.max(c.programsCount, 1), 4) }).map((_, i) => (
                          <li key={i}>Program {i + 1}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>
      </ComponentCard>

      <Modal isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} isFullscreen>
        <div className="fixed inset-0 flex justify-end">
          <div className="h-full w-full max-w-xl bg-white shadow-2xl dark:bg-gray-900 animate-[slideIn_0.28s_ease-out]">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={() => setIsPanelOpen(false)}>←</button>
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">{panelMode === "add" ? "Add New Category" : "Edit Category"}</div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div>
                  <div className="text-theme-xs text-gray-600 dark:text-gray-400">Category Name</div>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600 dark:text-gray-400">Slug</div>
                  <div className="flex items-center gap-2">
                    <Input value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
                    <Button size="sm" variant="outline" onClick={regenerateSlug} startIcon={<PencilIcon className="w-4 h-4" />}>Recreate</Button>
                  </div>
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600 dark:text-gray-400">Description</div>
                  <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600 dark:text-gray-400">Upload Icon</div>
                  <label className="mt-1 flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                    <input type="file" accept="image/*,.svg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; try { const url = URL.createObjectURL(f); setFormIcon(url); } catch { void 0 } }} />
                    {formIcon ? <img src={formIcon} alt="icon" className="h-16 w-16 rounded" /> : <span>Drop or click to upload</span>}
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-theme-xs text-gray-600 dark:text-gray-400">Priority</div>
                    <Input value={String(formPriority)} onChange={(e) => setFormPriority(Number(e.target.value) || 1)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600 dark:text-gray-400">Status</div>
                    <Select options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} defaultValue={formStatus} onChange={(v) => setFormStatus(v as typeof formStatus)} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="text-theme-sm text-gray-800 dark:text-white/90">Show on homepage?</div>
                  <Switch label="" defaultChecked={formShowHome} onChange={(v) => setFormShowHome(v)} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                <Button variant="outline" onClick={() => setIsPanelOpen(false)}>Cancel</Button>
                <Button onClick={saveCategory}>Save Category</Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}