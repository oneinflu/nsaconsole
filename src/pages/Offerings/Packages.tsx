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
import { PlusIcon, MoreDotIcon } from "../../icons";
import MultiSelect from "../../components/form/MultiSelect";
import Switch from "../../components/form/switch/Switch";
import Radio from "../../components/form/input/Radio";
import FileInput from "../../components/form/input/FileInput";
import RichTextEditor from "../../components/form/richtext/RichTextEditor";
import { useNavigate } from "react-router";

type Status = "Active" | "Inactive";

type Program = {
  id: string;
  name: string;
  institution: string;
  category: string;
  type: "SingleCourse" | "MultiPart" | "Levels" | "Custom";
};

type CourseItem = {
  id: string;
  name: string;
  programId: string;
  programName: string;
};

type FeatureItem = {
  name: string;
  selected?: boolean;
  weight?: number;
  tags?: string[];
};

type BundleItem = {
  id: string;
  name: string;
  tag?: string;
  programId: string;
  programName: string;
  price: number;
  discountPrice?: number;
  showStrike?: boolean;
  offerTag?: string;
  packageType?: "SingleCourse" | "MultiCourseBundle" | "FullProgramBundle";
  coursesIncluded?: string[];
  thumbnailName?: string;
  features: FeatureItem[];
  inheritFromId?: string | null;
  inheritedFeatures?: FeatureItem[];
  shortDescription?: string;
  longDescription?: string;
  status: Status;
  order?: number;
  createdAt: number;
  advantages?: string[];
  crossSellCourseIds?: string[];
};

function readPrograms(): Program[] {
  try {
    const raw = localStorage.getItem("programs");
    if (raw) return JSON.parse(raw) as Program[];
  } catch {
    void 0;
  }
  return [
    { id: "cpa-us", name: "CPA US", institution: "NorthStar", category: "Accountancy", type: "MultiPart" },
    { id: "acca", name: "ACCA", institution: "NorthStar", category: "Accountancy", type: "Levels" },
    { id: "fsd", name: "Full Stack Web (MERN)", institution: "Dev Institute", category: "Coding", type: "Custom" },
  ];
}

function seedCourses(programs: Program[]): CourseItem[] {
  const items: CourseItem[] = [];
  programs.forEach((p) => {
    if (p.id === "cpa-us") {
      ["FAR", "AUD", "REG", "BEC"].forEach((pt) => items.push({ id: `${p.id}-course-${pt.toLowerCase()}`, name: `${p.name} – ${pt}`, programId: p.id, programName: p.name }));
    } else if (p.id === "acca") {
      const names: Record<string, string> = { CBL: "Corporate & Business Law", PM: "Performance Management", TX: "Taxation", FR: "Financial Reporting", AA: "Audit & Assurance", FM: "Financial Management", BT: "Business & Technology", MA: "Management Accounting", FA: "Financial Accounting" };
      ["CBL", "PM", "TX", "FR", "AA", "FM", "BT", "MA", "FA"].forEach((code) => items.push({ id: `${p.id}-course-${code.toLowerCase()}`, name: `${p.name} – ${names[code] || code}`, programId: p.id, programName: p.name }));
    } else {
      items.push({ id: `${p.id}-course`, name: p.name, programId: p.id, programName: p.name });
    }
  });
  return items;
}

function readCourses(): CourseItem[] {
  try {
    const raw = localStorage.getItem("courses");
    if (raw) return JSON.parse(raw) as CourseItem[];
  } catch {
    void 0;
  }
  const programs = readPrograms();
  return seedCourses(programs);
}

function seedBundles(programs: Program[]): BundleItem[] {
  const p1 = programs.find((p) => p.id === "cpa-us") || programs[0];
  const p2 = programs.find((p) => p.id === "acca") || programs[1] || programs[0];
  const baseFeatures: FeatureItem[] = [
    { name: "Live Classes", selected: true },
    { name: "Recorded Classes", selected: true },
    { name: "Doubt Support", selected: true },
    { name: "Mock Tests", selected: true },
    { name: "Printed Material" },
    { name: "1:1 Mentorship" },
    { name: "Community Support" },
    { name: "Placement Assistance" },
  ];
  return [
    { id: "bundle-gold", name: "Gold Package", programId: p1.id, programName: p1.name, price: 34999, discountPrice: 29999, showStrike: true, offerTag: "Limited Period", packageType: "MultiCourseBundle", coursesIncluded: ["cpa-us-course-far", "cpa-us-course-aud"], features: baseFeatures, status: "Active", order: 1, createdAt: Date.now() - 10000 },
    { id: "bundle-platinum", name: "Platinum Package", programId: p1.id, programName: p1.name, price: 49999, discountPrice: 44999, showStrike: true, offerTag: "Best Value", packageType: "FullProgramBundle", coursesIncluded: ["cpa-us-course-far", "cpa-us-course-aud", "cpa-us-course-reg", "cpa-us-course-bec"], features: baseFeatures.map((f) => ({ ...f, selected: true })), status: "Active", order: 2, createdAt: Date.now() - 8000 },
    { id: "bundle-starter", name: "Starter Bundle", programId: p2.id, programName: p2.name, price: 9999, discountPrice: 0, showStrike: false, offerTag: "Intro", packageType: "SingleCourse", coursesIncluded: ["acca-course-bt"], features: baseFeatures.slice(0, 4), status: "Inactive", order: 3, createdAt: Date.now() - 6000 },
  ];
}

function readBundles(): BundleItem[] {
  try {
    const raw = localStorage.getItem("bundles");
    if (raw) return JSON.parse(raw) as BundleItem[];
  } catch {
    void 0;
  }
  const programs = readPrograms();
  return seedBundles(programs);
}

function writeBundles(items: BundleItem[]) {
  try { localStorage.setItem("bundles", JSON.stringify(items)); } catch { void 0; }
}

export default function PackagesPage() {
  const navigate = useNavigate();
  const programs = readPrograms();
  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }));
  const coursesAll = readCourses();

  const [bundles, setBundles] = useState<BundleItem[]>([]);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState<string>("");
  const [status, setStatus] = useState<"All" | Status>("All");

  useEffect(() => {
    setBundles(readBundles());
  }, []);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let arr = bundles.filter((b) => {
      const matchTxt = txt ? [b.name, b.programName].some((v) => v.toLowerCase().includes(txt)) : true;
      const matchProg = program ? b.programId === program : true;
      const matchStatus = status === "All" ? true : b.status === status;
      return matchTxt && matchProg && matchStatus;
    });
    arr = arr.sort((a, b) => (a.order || 999) - (b.order || 999));
    return arr;
  }, [bundles, search, program, status]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dName, setDName] = useState("");
  const [dTag, setDTag] = useState("");
  const [dProgramId, setDProgramId] = useState<string>(programOptions[0]?.value || "");
  const [dCoursesIncluded, setDCoursesIncluded] = useState<string[]>([]);
  const [dOrder, setDOrder] = useState<number>(1);
  const [dThumbnailName, setDThumbnailName] = useState<string>("");
  const [dPrice, setDPrice] = useState<number>(0);
  const [dDiscountPrice, setDDiscountPrice] = useState<number>(0);
  const [dShowStrike, setDShowStrike] = useState<boolean>(false);
  const [dOfferTag, setDOfferTag] = useState<string>("");
  const [dPackageType, setDPackageType] = useState<"SingleCourse" | "MultiCourseBundle" | "FullProgramBundle">("SingleCourse");
  const [dFeatures, setDFeatures] = useState<FeatureItem[]>([]);
  const [dInheritFromId, setDInheritFromId] = useState<string>("");
  const [dInheritedFeatures, setDInheritedFeatures] = useState<FeatureItem[]>([]);
  const [dShortDesc, setDShortDesc] = useState<string>("");
  const [dLongDesc, setDLongDesc] = useState<string>("");
  const [dFeatureInput, setDFeatureInput] = useState("");
  const [dStatus, setDStatus] = useState<Status>("Active");
  const [dAdvantages, setDAdvantages] = useState<string[]>([]);
  const [dAdvInput, setDAdvInput] = useState("");
  const [dCrossSell, setDCrossSell] = useState<string[]>([]);

  const openCreate = () => {
    setIsDrawerOpen(true);
    setEditingId(null);
    setDName("");
    setDTag("");
    setDProgramId(programOptions[0]?.value || "");
    setDCoursesIncluded([]);
    setDOrder((bundles.length || 0) + 1);
    setDThumbnailName("");
    setDPrice(0);
    setDDiscountPrice(0);
    setDShowStrike(false);
    setDOfferTag("");
    setDPackageType("SingleCourse");
    setDFeatures([]);
    setDInheritFromId("");
    setDInheritedFeatures([]);
    setDFeatureInput("");
    setDStatus("Active");
    setDShortDesc("");
    setDLongDesc("");
    setDAdvantages([]);
    setDAdvInput("");
    setDCrossSell([]);
  };

  const openEdit = (id: string) => {
    const it = bundles.find((x) => x.id === id);
    if (!it) return;
    setIsDrawerOpen(true);
    setEditingId(id);
    setDName(it.name);
    setDTag(it.tag || "");
    setDProgramId(it.programId);
    setDCoursesIncluded(it.coursesIncluded || []);
    setDOrder(it.order || 1);
    setDThumbnailName(it.thumbnailName || "");
    setDPrice(it.price);
    setDDiscountPrice(it.discountPrice || 0);
    setDShowStrike(!!it.showStrike);
    setDOfferTag(it.offerTag || "");
    setDPackageType(it.packageType || "SingleCourse");
    setDFeatures(it.features || []);
    setDInheritFromId(it.inheritFromId || "");
    setDInheritedFeatures(it.inheritedFeatures || []);
    setDFeatureInput("");
    setDStatus(it.status);
    setDShortDesc(it.shortDescription || "");
    setDLongDesc(it.longDescription || "");
    setDAdvantages(it.advantages || []);
    setDCrossSell(it.crossSellCourseIds || []);
  };

  const saveBundle = () => {
    const name = dName.trim();
    if (!name || !dProgramId) return;
    const prog = programs.find((p) => p.id === dProgramId);
    if (!prog) return;
    const id = editingId || `bundle-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const item: BundleItem = {
      id,
      name,
      tag: dTag || undefined,
      programId: prog.id,
      programName: prog.name,
      price: dPrice || 0,
      discountPrice: dDiscountPrice || undefined,
      showStrike: dShowStrike || undefined,
      offerTag: dOfferTag || undefined,
      packageType: dPackageType,
      coursesIncluded: dCoursesIncluded,
      thumbnailName: dThumbnailName || undefined,
      features: dFeatures,
      inheritFromId: dInheritFromId || undefined,
      inheritedFeatures: dInheritedFeatures,
      shortDescription: dShortDesc || undefined,
      longDescription: dLongDesc || undefined,
      advantages: dAdvantages,
      crossSellCourseIds: dCrossSell,
      status: dStatus,
      order: dOrder || undefined,
      createdAt: Date.now(),
    };
    setBundles((prev) => {
      const exists = prev.some((x) => x.id === id);
      const next = exists ? prev.map((x) => (x.id === id ? item : x)) : [item, ...prev];
      writeBundles(next);
      return next;
    });
    setIsDrawerOpen(false);
  };

  const duplicateBundle = (id: string) => {
    const it = bundles.find((x) => x.id === id);
    if (!it) return;
    const copy: BundleItem = { ...it, id: `${it.id}-copy-${Date.now()}`, name: `${it.name} Copy`, createdAt: Date.now() };
    setBundles((prev) => {
      const next = [copy, ...prev];
      writeBundles(next);
      return next;
    });
  };

  const deleteBundle = (id: string) => {
    const ok = window.confirm("Delete this package?");
    if (!ok) return;
    setBundles((prev) => {
      const next = prev.filter((x) => x.id !== id);
      writeBundles(next);
      return next;
    });
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openFeaturesId, setOpenFeaturesId] = useState<string | null>(null);
  const [featureInput, setFeatureInput] = useState("");

  const addFeatureTo = (id: string) => {
    const name = featureInput.trim();
    if (!name) return;
    setBundles((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, features: [...(b.features || []), { name, selected: true }] } : b));
      writeBundles(next);
      return next;
    });
    setFeatureInput("");
  };

  const removeFeatureFrom = (id: string, index: number) => {
    setBundles((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, features: (b.features || []).filter((_, i) => i !== index) } : b));
      writeBundles(next);
      return next;
    });
  };

  const moveOrder = (id: string, dir: -1 | 1) => {
    setBundles((prev) => {
      const arr = [...prev].sort((a, b) => (a.order || 999) - (b.order || 999));
      const idx = arr.findIndex((x) => x.id === id);
      if (idx < 0) return prev;
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= arr.length) return prev;
      const a = arr[idx];
      const b = arr[swapIdx];
      const ao = a.order || idx + 1;
      const bo = b.order || swapIdx + 1;
      a.order = bo;
      b.order = ao;
      const next = arr;
      writeBundles(next);
      return next;
    });
  };

  return (
    <>
      <PageMeta title="Course Packages / Bundles" description="Create bundles with features, pricing and comparison." />
      <PageBreadcrumb pageTitle="Course Packages / Bundles" />
      <ComponentCard title="Course Packages / Bundles">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-xl">
              <Input placeholder="Search bundles" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openCreate} startIcon={<PlusIcon className="w-4 h-4" />}>Create Package</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 animate-[slideIn_0.26s_ease-out]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Program</span>
              <Select options={[{ value: "", label: "All" }, ...programOptions]} defaultValue={program} onChange={(v) => setProgram(v as string)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Status</span>
              <Select options={[{ value: "All", label: "All" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} defaultValue={status} onChange={(v) => setStatus(v as typeof status)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-3xl">📦</div>
              <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">No Bundles Found</div>
              <div className="mt-1 text-theme-xs text-gray-500">Create a package under a program.</div>
              <div className="mt-4">
                <Button onClick={openCreate} startIcon={<PlusIcon className="w-4 h-4" />}>Create Package</Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Package Name</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Program</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Price</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Features</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Status</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {filtered.map((b) => (
                      <TableRow key={b.id} className="transition hover:bg-gray-50">
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          <button className="underline decoration-dotted" onClick={() => openEdit(b.id)}>{b.name}</button>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{b.programName}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">
                          {b.showStrike && b.discountPrice && b.discountPrice > 0 ? (
                            <span>
                              <span className="mr-2 line-through text-gray-400">{new Intl.NumberFormat("en-IN").format(b.price)} INR</span>
                              <span>{new Intl.NumberFormat("en-IN").format(b.discountPrice)} INR</span>
                            </span>
                          ) : (
                            <span>{new Intl.NumberFormat("en-IN").format(b.price)} INR</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{(b.features?.length || 0) + (b.inheritedFeatures?.length || 0)}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{b.status}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="relative flex items-center gap-2">
                            <button className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => moveOrder(b.id, -1)}>↑</button>
                            <button className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => moveOrder(b.id, 1)}>↓</button>
                            <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === b.id ? null : b.id))}>
                              <MoreDotIcon className="w-4 h-4" />
                            </button>
                            <Dropdown isOpen={openMenuId === b.id} onClose={() => setOpenMenuId(null)}>
                              <DropdownItem onClick={() => { setOpenMenuId(null); openEdit(b.id); }}>Edit</DropdownItem>
                            <DropdownItem onClick={() => { setOpenMenuId(null); navigate(`/offerings/packages/${b.id}/features`); }}>Manage Features</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); duplicateBundle(b.id); }}>Duplicate</DropdownItem>
                              <DropdownItem onClick={() => { setOpenMenuId(null); deleteBundle(b.id); }}>Delete</DropdownItem>
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
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">{editingId ? "Edit Package" : "Create Package"}</div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="space-y-3">
                  <div className="text-theme-sm font-semibold">Basic Info</div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Package Name</div>
                    <Input value={dName} onChange={(e) => setDName(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Tag (optional)</div>
                    <Input value={dTag} onChange={(e) => setDTag(e.target.value)} placeholder="Best Seller / Recommended" />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Program</div>
                    <Select options={programOptions} defaultValue={dProgramId} onChange={(v) => setDProgramId(v as string)} />
                  </div>
                  <div>
                    <MultiSelect label="Courses Included" options={coursesAll.filter((c) => c.programId === dProgramId).map((c) => ({ value: c.id, text: c.name }))} value={dCoursesIncluded} onChange={(vals) => setDCoursesIncluded(vals)} placeholder="Select courses" />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Display Order</div>
                    <Input value={String(dOrder)} onChange={(e) => setDOrder(Number(e.target.value) || 1)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Thumbnail</div>
                    <FileInput onChange={(e) => { const f = e.target.files?.[0]; setDThumbnailName(f ? f.name : ""); }} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-theme-sm font-semibold">Bundle Advantages</div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input placeholder="Advantage" value={dAdvInput} onChange={(e) => setDAdvInput(e.target.value)} />
                    <Button size="sm" variant="outline" onClick={() => { const t = dAdvInput.trim(); if (!t) return; setDAdvantages((p) => [...p, t]); setDAdvInput(""); }}>Add Advantage</Button>
                  </div>
                  <div className="space-y-1">
                    {dAdvantages.map((adv, i) => (
                      <div key={`${adv}-${i}`} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-theme-xs dark:border-gray-800">
                        <span className="text-gray-700 dark:text-gray-400">{adv}</span>
                        <Button size="sm" variant="outline" onClick={() => setDAdvantages((p) => p.filter((_, idx) => idx !== i))}>Remove</Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-theme-sm font-semibold">Cross-Sell Options</div>
                  <MultiSelect label="Cross-Sell When Viewing" options={coursesAll.map((c) => ({ value: c.id, text: c.name }))} value={dCrossSell} onChange={(vals) => setDCrossSell(vals)} placeholder="Select courses" />
                </div>
                <div className="space-y-3">
                  <div className="text-theme-sm font-semibold">Pricing</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-theme-xs text-gray-600">Base Price (INR)</div>
                      <Input value={String(dPrice)} onChange={(e) => setDPrice(Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Discount Price (INR)</div>
                      <Input value={String(dDiscountPrice)} onChange={(e) => setDDiscountPrice(Number(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch label="Show strike-through" defaultChecked={dShowStrike} onChange={(v) => setDShowStrike(v)} />
                    <div className="flex-1" />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Offer Tag</div>
                    <Input value={dOfferTag} onChange={(e) => setDOfferTag(e.target.value)} placeholder="Limited Period" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-theme-sm font-semibold">Package Type</div>
                  <div className="grid grid-cols-1 gap-2">
                    <Radio id="pkg-type-1" name="pkg-type" value="SingleCourse" checked={dPackageType === "SingleCourse"} label="Single Course Package" onChange={(v) => setDPackageType(v as typeof dPackageType)} />
                    <Radio id="pkg-type-2" name="pkg-type" value="MultiCourseBundle" checked={dPackageType === "MultiCourseBundle"} label="Multi-Course Bundle" onChange={(v) => setDPackageType(v as typeof dPackageType)} />
                    <Radio id="pkg-type-3" name="pkg-type" value="FullProgramBundle" checked={dPackageType === "FullProgramBundle"} label="Full Program Bundle (auto-add all courses)" onChange={(v) => setDPackageType(v as typeof dPackageType)} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-theme-sm font-semibold">Feature Selection</div>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Feature name" value={dFeatureInput} onChange={(e) => setDFeatureInput(e.target.value)} />
                    <Button size="sm" variant="outline" onClick={() => { const n = dFeatureInput.trim(); if (!n) return; setDFeatures((prev) => [...prev, { name: n, selected: true }]); setDFeatureInput(""); }}>Add Feature</Button>
                  </div>
                  {(dFeatures || []).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {dFeatures.map((f, i) => (
                        <div key={`${f.name}-${i}`} className="grid grid-cols-12 items-center gap-2 rounded border border-gray-200 px-3 py-2 text-theme-xs dark:border-gray-800">
                          <div className="col-span-5 text-gray-700 dark:text-gray-400">{f.name}</div>
                          <div className="col-span-2">
                            <label className="text-xs text-gray-500">Selected</label>
                            <Select options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} defaultValue={String(!!f.selected)} onChange={(v) => setDFeatures((prev) => prev.map((x, idx) => idx === i ? { ...x, selected: v === "true" } : x))} />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs text-gray-500">Weight</label>
                            <Input value={String(f.weight || 0)} onChange={(e) => setDFeatures((prev) => prev.map((x, idx) => idx === i ? { ...x, weight: Number(e.target.value) || 0 } : x))} />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs text-gray-500">Tags</label>
                            <Input value={(f.tags || []).join(", ")} onChange={(e) => setDFeatures((prev) => prev.map((x, idx) => idx === i ? { ...x, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) } : x))} />
                          </div>
                          <div className="col-span-1 text-right">
                            <Button size="sm" variant="outline" onClick={() => setDFeatures((prev) => prev.filter((_, idx) => idx !== i))}>Remove</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="text-theme-sm font-semibold">Feature Inheritance</div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Inherit Features From</div>
                    <Select options={[{ value: "", label: "None" }, ...bundles.filter((b) => b.id !== editingId).map((b) => ({ value: b.id, label: b.name }))]} defaultValue={dInheritFromId} onChange={(v) => {
                      const val = v as string;
                      setDInheritFromId(val);
                      const src = bundles.find((x) => x.id === val);
                      setDInheritedFeatures(src ? (src.features || []).filter((f) => f.selected) : []);
                    }} />
                  </div>
                  {dInheritedFeatures.length > 0 && (
                    <div className="space-y-1">
                      {dInheritedFeatures.map((f, i) => (
                        <div key={`${f.name}-inh-${i}`} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-theme-xs dark:border-gray-800">
                          <span className="text-gray-700 dark:text-gray-400">{f.name}</span>
                          <Button size="sm" variant="outline" onClick={() => { const ok = window.confirm("Remove inherited feature?"); if (!ok) return; setDInheritedFeatures((prev) => prev.filter((_, idx) => idx !== i)); }}>Remove</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="text-theme-sm font-semibold">Package Description</div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Short Description</div>
                    <Input value={dShortDesc} onChange={(e) => setDShortDesc(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Long Description</div>
                    <RichTextEditor value={dLongDesc} onChange={setDLongDesc} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Status</div>
                    <Select options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} defaultValue={dStatus} onChange={(v) => setDStatus(v as Status)} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => { saveBundle(); setOpenFeaturesId(editingId || `bundle-${dName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`); }}>Save & Manage Features</Button>
                  <Button onClick={saveBundle}>{editingId ? "Save Package" : "Create Package"}</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!openFeaturesId} onClose={() => setOpenFeaturesId(null)}>
        <div className="space-y-3 p-4">
          <div className="text-theme-sm font-semibold">Manage Features</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input placeholder="Feature name" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} />
            <Button size="sm" variant="outline" onClick={() => { if (!openFeaturesId) return; addFeatureTo(openFeaturesId); }}>Add</Button>
          </div>
          <div className="space-y-1">
            {(bundles.find((b) => b.id === openFeaturesId)?.inheritedFeatures || []).map((f, i) => (
              <div key={`inh-${f.name}-${i}`} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-theme-xs dark:border-gray-800">
                <span className="text-gray-700 dark:text-gray-400">{f.name}</span>
                <Button size="sm" variant="outline" onClick={() => { if (!openFeaturesId) return; const ok = window.confirm("Remove inherited feature?"); if (!ok) return; setBundles((prev) => { const next = prev.map((b) => b.id === openFeaturesId ? { ...b, inheritedFeatures: (b.inheritedFeatures || []).filter((_, idx) => idx !== i) } : b); writeBundles(next); return next; }); }}>Remove</Button>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {(bundles.find((b) => b.id === openFeaturesId)?.features || []).map((f, i) => (
              <div key={`own-${f.name}-${i}`} className="grid grid-cols-12 items-center gap-2 rounded border border-gray-200 px-3 py-2 text-theme-xs dark:border-gray-800">
                <div className="col-span-5 text-gray-700 dark:text-gray-400">{f.name}</div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Selected</label>
                  <Select options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} defaultValue={String(!!f.selected)} onChange={(v) => { if (!openFeaturesId) return; setBundles((prev) => { const next = prev.map((b) => b.id === openFeaturesId ? { ...b, features: (b.features || []).map((x, idx) => idx === i ? { ...x, selected: v === "true" } : x) } : b); writeBundles(next); return next; }); }} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Weight</label>
                  <Input value={String(f.weight || 0)} onChange={(e) => { if (!openFeaturesId) return; setBundles((prev) => { const next = prev.map((b) => b.id === openFeaturesId ? { ...b, features: (b.features || []).map((x, idx) => idx === i ? { ...x, weight: Number(e.target.value) || 0 } : x) } : b); writeBundles(next); return next; }); }} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Tags</label>
                  <Input value={(f.tags || []).join(", ")} onChange={(e) => { if (!openFeaturesId) return; setBundles((prev) => { const next = prev.map((b) => b.id === openFeaturesId ? { ...b, features: (b.features || []).map((x, idx) => idx === i ? { ...x, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) } : x) } : b); writeBundles(next); return next; }); }} />
                </div>
                <div className="col-span-1 text-right">
                  <Button size="sm" variant="outline" onClick={() => { if (!openFeaturesId) return; removeFeatureFrom(openFeaturesId, i); }}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenFeaturesId(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}