import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
import MultiSelect from "../../components/form/MultiSelect";

type Status = "Active" | "Inactive";

type FeatureItem = {
  name: string;
  selected?: boolean;
  weight?: number;
  tags?: string[];
  type?: "Basic" | "Premium" | "Exclusive";
};

type BundleItem = {
  id: string;
  name: string;
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

type ProgramCourse = { id: string; name: string; programId: string; programName: string };

type FeatureLibraryItem = {
  id: string;
  name: string;
  category: "Content" | "Support" | "Access" | "Exams" | "Materials" | "Bonus";
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  premiumOnly?: boolean;
};

function readBundles(): BundleItem[] {
  try {
    const raw = localStorage.getItem("bundles");
    if (raw) return JSON.parse(raw) as BundleItem[];
  } catch { void 0 }
  return [];
}

function writeBundles(items: BundleItem[]) {
  try { localStorage.setItem("bundles", JSON.stringify(items)); } catch { void 0 }
}

function readCourses(): ProgramCourse[] {
  try {
    const raw = localStorage.getItem("courses");
    if (raw) return JSON.parse(raw) as ProgramCourse[];
  } catch { void 0 }
  return [];
}

function readFeatureLibrary(): FeatureLibraryItem[] {
  try {
    const raw = localStorage.getItem("featureLibrary");
    if (raw) return JSON.parse(raw) as FeatureLibraryItem[];
  } catch { void 0 }
  return [
    { id: "f-live", name: "Live Classes", category: "Content" },
    { id: "f-recorded", name: "Recorded Classes", category: "Content" },
    { id: "f-doubt", name: "Doubt Support", category: "Support" },
    { id: "f-mock", name: "Mock Tests", category: "Exams" },
    { id: "f-printed", name: "Printed Material", category: "Materials" },
    { id: "f-mentorship", name: "1:1 Mentorship", category: "Support" },
    { id: "f-community", name: "Community Support", category: "Support" },
    { id: "f-placement", name: "Placement Assistance", category: "Bonus" },
  ];
}

function writeFeatureLibrary(items: FeatureLibraryItem[]) {
  try { localStorage.setItem("featureLibrary", JSON.stringify(items)); } catch { void 0 }
}

export default function PackageFeaturesPage() {
  const navigate = useNavigate();
  const { bundleId } = useParams();
  const [bundles, setBundles] = useState<BundleItem[]>([]);
  const [courses, setCourses] = useState<ProgramCourse[]>([]);
  const [library, setLibrary] = useState<FeatureLibraryItem[]>([]);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeatureCategory, setNewFeatureCategory] = useState<FeatureLibraryItem["category"]>("Content");
  const [newFeatureDifficulty, setNewFeatureDifficulty] = useState<FeatureLibraryItem["difficulty"]>("Beginner");
  const [newFeaturePremiumOnly, setNewFeaturePremiumOnly] = useState(false);

  useEffect(() => {
    setBundles(readBundles());
    setCourses(readCourses());
    setLibrary(readFeatureLibrary());
  }, []);

  const bundle = useMemo(() => bundles.find((b) => b.id === bundleId), [bundles, bundleId]);
  const programBundles = useMemo(() => bundles.filter((b) => bundle && b.programId === bundle.programId), [bundles, bundle]);

  const featureRows = useMemo(() => {
    const inh = bundle?.inheritedFeatures || [];
    const own = bundle?.features || [];
    return [...inh.map((f) => ({ ...f, _tier: "Inherited" as const, _locked: true })), ...own.map((f) => ({ ...f, _tier: "Added" as const, _locked: false }))];
  }, [bundle]);

  const autoInheritFromLower = () => {
    if (!bundle) return;
    const arr = programBundles.slice().sort((a, b) => (a.order || 999) - (b.order || 999));
    const idx = arr.findIndex((x) => x.id === bundle.id);
    if (idx <= 0) return;
    const lower = arr[idx - 1];
    const selected = (lower.features || []).filter((f) => f.selected);
    setBundles((prev) => {
      const next = prev.map((b) => (b.id === bundle.id ? { ...b, inheritFromId: lower.id, inheritedFeatures: selected } : b));
      writeBundles(next);
      return next;
    });
  };

  const updateOwnFeature = (index: number, updater: (f: FeatureItem) => FeatureItem) => {
    if (!bundle) return;
    setBundles((prev) => {
      const next = prev.map((b) => {
        if (b.id !== bundle.id) return b;
        const features = (b.features || []).map((f, i) => (i === index ? updater(f) : f));
        return { ...b, features };
      });
      writeBundles(next);
      return next;
    });
  };

  const removeOwnFeature = (index: number) => {
    if (!bundle) return;
    setBundles((prev) => {
      const next = prev.map((b) => {
        if (b.id !== bundle.id) return b;
        const features = (b.features || []).filter((_, i) => i !== index);
        return { ...b, features };
      });
      writeBundles(next);
      return next;
    });
  };

  const removeInheritedFeature = (index: number) => {
    if (!bundle) return;
    const ok = window.confirm("Remove inherited feature?");
    if (!ok) return;
    setBundles((prev) => {
      const next = prev.map((b) => {
        if (b.id !== bundle.id) return b;
        const inheritedFeatures = (b.inheritedFeatures || []).filter((_, i) => i !== index);
        return { ...b, inheritedFeatures };
      });
      writeBundles(next);
      return next;
    });
  };

  const addFeatureToLibraryAndBundle = () => {
    const name = newFeatureName.trim();
    if (!name || !bundle) return;
    const libItem: FeatureLibraryItem = {
      id: `lib-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name,
      category: newFeatureCategory,
      difficulty: newFeatureDifficulty,
      premiumOnly: newFeaturePremiumOnly,
    };
    const updatedLib = [libItem, ...library.filter((x) => x.id !== libItem.id)];
    setLibrary(updatedLib);
    writeFeatureLibrary(updatedLib);
    setBundles((prev) => {
      const next = prev.map((b) => (b.id === bundle.id ? { ...b, features: [...(b.features || []), { name, selected: true, type: (libItem.premiumOnly ? "Premium" : "Basic") as FeatureItem["type"] }] } : b));
      writeBundles(next);
      return next;
    });
    setOpenAddModal(false);
    setNewFeatureName("");
    setNewFeaturePremiumOnly(false);
  };

  const importFromLibrary = (ids: string[]) => {
    if (!bundle) return;
    const items = library.filter((x) => ids.includes(x.id));
    setBundles((prev) => {
      const next = prev.map((b) => (b.id === bundle.id ? { ...b, features: [...(b.features || []), ...items.map((it) => ({ name: it.name, selected: true, type: (it.premiumOnly ? "Premium" : "Basic") as FeatureItem["type"] }))] } : b));
      writeBundles(next);
      return next;
    });
    setOpenImportModal(false);
  };

  const comparisonMatrix = useMemo(() => {
    if (!bundle) return { bundles: [] as BundleItem[], rows: [] as string[] };
    const peers = programBundles;
    const setNames = new Set<string>();
    peers.forEach((b) => {
      (b.inheritedFeatures || []).forEach((f) => setNames.add(f.name));
      (b.features || []).forEach((f) => setNames.add(f.name));
    });
    const rows = Array.from(setNames).sort();
    return { bundles: peers, rows };
  }, [programBundles, bundle]);

  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);

  const [advantageInput, setAdvantageInput] = useState("");
  const addAdvantage = () => {
    if (!bundle) return;
    const text = advantageInput.trim();
    if (!text) return;
    setBundles((prev) => {
      const next = prev.map((b) => (b.id === bundle.id ? { ...b, advantages: [...(b.advantages || []), text] } : b));
      writeBundles(next);
      return next;
    });
    setAdvantageInput("");
  };

  const removeAdvantage = (index: number) => {
    if (!bundle) return;
    setBundles((prev) => {
      const next = prev.map((b) => (b.id === bundle.id ? { ...b, advantages: (b.advantages || []).filter((_, i) => i !== index) } : b));
      writeBundles(next);
      return next;
    });
  };

  const crossSellOptions = courses.map((c) => ({ value: c.id, text: c.name }));

  if (!bundle) {
    return (
      <>
        <PageMeta title="Manage Features" description="Configure package features" />
        <PageBreadcrumb pageTitle="Manage Features" />
        <ComponentCard title="Manage Features">
          <div className="p-6 text-center">
            <div className="text-theme-sm">Bundle not found</div>
            <div className="mt-3">
              <Button onClick={() => navigate("/offerings/packages")}>Back to Packages</Button>
            </div>
          </div>
        </ComponentCard>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`${bundle.name} — Features`} description="Map and manage bundle features" />
      <PageBreadcrumb pageTitle={`${bundle.name} — Features`} />
      <ComponentCard title={`${bundle.name} — Features`}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-theme-xs text-gray-500">Program: {bundle.programName}</div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setOpenAddModal(true)}>Add Feature</Button>
              <Button variant="outline" onClick={() => setOpenImportModal(true)}>Import Features</Button>
              <Button variant="outline" onClick={autoInheritFromLower}>Auto-Inherit from Lower Package</Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Feature</TableCell>
                    <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Included?</TableCell>
                    <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Type</TableCell>
                    <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Tier</TableCell>
                    <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                  {featureRows.map((f, i) => (
                    <TableRow key={`${f.name}-${i}`} className="transition hover:bg-gray-50">
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{f.name}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                        {f._locked ? (
                          <span className="inline-flex items-center gap-1 text-gray-500">🔒</span>
                        ) : (
                          <Switch label={"Included"} defaultChecked={!!f.selected} onChange={(v) => updateOwnFeature(i - (bundle.inheritedFeatures?.length || 0), (x) => ({ ...x, selected: v }))} />
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                        <Select options={[{ value: "Basic", label: "Basic" }, { value: "Premium", label: "Premium" }, { value: "Exclusive", label: "Exclusive" }]} defaultValue={f.type || "Basic"} onChange={(v) => {
                          if (f._locked) return;
                          updateOwnFeature(i - (bundle.inheritedFeatures?.length || 0), (x) => ({ ...x, type: v as FeatureItem["type"] }));
                        }} />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{f._tier}</TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="relative flex items-center gap-2">
                          {f._locked ? (
                            <Button size="sm" variant="outline" onClick={() => removeInheritedFeature(i)}>Remove</Button>
                          ) : (
                            <Dropdown isOpen={false} onClose={() => void 0}>
                              <DropdownItem onClick={() => updateOwnFeature(i - (bundle.inheritedFeatures?.length || 0), (x) => ({ ...x }))}>Edit</DropdownItem>
                              <DropdownItem onClick={() => removeOwnFeature(i - (bundle.inheritedFeatures?.length || 0))}>Delete</DropdownItem>
                            </Dropdown>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-theme-sm font-semibold">Bundle Advantages</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input placeholder="Advantage" value={advantageInput} onChange={(e) => setAdvantageInput(e.target.value)} />
              <Button size="sm" variant="outline" onClick={addAdvantage}>Add Advantage</Button>
            </div>
            <div className="space-y-1">
              {(bundle.advantages || []).map((adv, i) => (
                <div key={`${adv}-${i}`} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-theme-xs dark:border-gray-800">
                  <span className="text-gray-700 dark:text-gray-400">{adv}</span>
                  <Button size="sm" variant="outline" onClick={() => removeAdvantage(i)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-theme-sm font-semibold">Cross-Sell Options</div>
            <MultiSelect label="Cross-Sell When Viewing" options={crossSellOptions} value={bundle.crossSellCourseIds || []} onChange={(vals) => {
              setBundles((prev) => {
                const next = prev.map((b) => (b.id === bundle.id ? { ...b, crossSellCourseIds: vals } : b));
                writeBundles(next);
                return next;
              });
            }} placeholder="Select courses" />
          </div>

          <div className="space-y-3">
            <div className="text-theme-sm font-semibold">Student Comparison</div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Feature</TableCell>
                      {comparisonMatrix.bundles.map((b) => (
                        <TableCell key={b.id} isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">{b.name}</TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {comparisonMatrix.rows.map((fname) => (
                      <TableRow key={fname} className="transition hover:bg-gray-50">
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{fname}</TableCell>
                        {comparisonMatrix.bundles.map((b) => {
                          const included = ((b.inheritedFeatures || []).some((f) => f.name === fname) || (b.features || []).some((f) => f.name === fname && f.selected));
                          return (
                            <TableCell key={`${b.id}-${fname}`} className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{included ? "✓" : "×"}</TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    <TableRow className="transition hover:bg-gray-50">
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">Price</TableCell>
                      {comparisonMatrix.bundles.map((b) => (
                        <TableCell key={`${b.id}-price`} className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          {b.showStrike && b.discountPrice && b.discountPrice > 0 ? (
                            <span>
                              <span className="mr-2 line-through text-gray-400">{new Intl.NumberFormat("en-IN").format(b.price)} INR</span>
                              <span>{new Intl.NumberFormat("en-IN").format(b.discountPrice)} INR</span>
                            </span>
                          ) : (
                            <span>{new Intl.NumberFormat("en-IN").format(b.price)} INR</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>

      <Modal isOpen={openAddModal} onClose={() => setOpenAddModal(false)}>
        <div className="space-y-3 p-4">
          <div className="text-theme-sm font-semibold">Add Feature</div>
          <div>
            <div className="text-theme-xs text-gray-600">Name</div>
            <Input value={newFeatureName} onChange={(e) => setNewFeatureName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="text-theme-xs text-gray-600">Category</div>
              <Select options={["Content","Support","Access","Exams","Materials","Bonus"].map((x) => ({ value: x, label: x }))} defaultValue={newFeatureCategory} onChange={(v) => setNewFeatureCategory(v as FeatureLibraryItem["category"])} />
            </div>
            <div>
              <div className="text-theme-xs text-gray-600">Difficulty</div>
              <Select options={["Beginner","Intermediate","Advanced"].map((x) => ({ value: x, label: x }))} defaultValue={newFeatureDifficulty} onChange={(v) => setNewFeatureDifficulty(v as FeatureLibraryItem["difficulty"])} />
            </div>
            <div>
              <Switch label="Premium Only" defaultChecked={newFeaturePremiumOnly} onChange={(v) => setNewFeaturePremiumOnly(v)} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenAddModal(false)}>Cancel</Button>
            <Button onClick={addFeatureToLibraryAndBundle}>Add</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={openImportModal} onClose={() => setOpenImportModal(false)}>
        <div className="space-y-3 p-4">
          <div className="text-theme-sm font-semibold">Import Features</div>
          <div className="space-y-2">
            {library.map((it) => (
              <label key={it.id} className="flex items-center gap-2 text-theme-xs">
                <input type="checkbox" checked={selectedImportIds.includes(it.id)} onChange={(e) => {
                  const checked = e.target.checked;
                  const next = checked ? [...selectedImportIds, it.id] : selectedImportIds.filter((x) => x !== it.id);
                  setSelectedImportIds(next);
                }} />
                <span className="text-gray-700 dark:text-gray-400">{it.name}</span>
                <span className="ml-auto text-gray-400">{it.category}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenImportModal(false)}>Cancel</Button>
            <Button onClick={() => importFromLibrary(selectedImportIds)}>Import</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}