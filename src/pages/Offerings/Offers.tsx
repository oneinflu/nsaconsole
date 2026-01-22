import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router";
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

type Status = "Active" | "Paused" | "Expired";

type OfferType =
  | "Flat"
  | "Percentage"
  | "FlashSale"
  | "Seasonal"
  | "CouponLinked"
  | "BulkGroup"
  | "UserSegment"
  | "BundleOffer";

type Program = { id: string; name: string };
type CourseItem = { id: string; name: string; programId: string; programName: string };
type BundleItem = { id: string; name: string; programId: string; programName: string };

type AppliesTo = "All" | "Program" | "Course" | "Bundle";

type OfferItem = {
  id: string;
  name: string;
  type: OfferType;
  valueAmount?: number;
  valuePercent?: number;
  appliesTo: AppliesTo;
  appliesToIds?: string[];
  durationStart?: number;
  durationEnd?: number;
  alwaysOn?: boolean;
  status: Status;
  couponCode?: string;
  createdAt: number;
  showOnCoursePage?: boolean;
  showOnOffersPage?: boolean;
  showOnHomepageBanner?: boolean;
  badge?: "Limited Time" | "Hot Deal" | "Bestseller" | "Flash Sale";
  minPriceThreshold?: number;
  maxUsesPerUser?: number;
  maxTotalUses?: number;
  applicableRegion?: "India Only" | "International" | "Both";
  showCountdown?: boolean;
};

function readPrograms(): Program[] {
  try {
    const raw = localStorage.getItem("programs");
    if (raw) return JSON.parse(raw) as Program[];
  } catch { void 0 }
  return [
    { id: "cpa-us", name: "CPA US" },
    { id: "acca", name: "ACCA" },
  ];
}

function readCourses(): CourseItem[] {
  try {
    const raw = localStorage.getItem("courses");
    if (raw) return JSON.parse(raw) as CourseItem[];
  } catch { void 0 }
  return [];
}

function readBundles(): BundleItem[] {
  try {
    const raw = localStorage.getItem("bundles");
    if (raw) return JSON.parse(raw) as BundleItem[];
  } catch { void 0 }
  return [];
}

function seedOffers(programs: Program[]): OfferItem[] {
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  return [
    { id: "offer-diwali", name: "Diwali Sale", type: "Percentage", valuePercent: 20, appliesTo: "Program", appliesToIds: [programs[0]?.id || "cpa-us"], durationStart: now - 30 * day, durationEnd: now + 10 * day, status: "Active", createdAt: now - 40 * day },
    { id: "offer-flash-48", name: "Flash 48-Hour Deal", type: "Flat", valueAmount: 1000, appliesTo: "Program", appliesToIds: [programs[1]?.id || "acca"], durationStart: now - day, durationEnd: now + 0.5 * day, status: "Active", createdAt: now - 2 * day },
    { id: "offer-newuser50", name: "NewUser50", type: "CouponLinked", valuePercent: 50, appliesTo: "All", alwaysOn: true, status: "Active", couponCode: "NEWUSER50", createdAt: now - 100 * day },
    { id: "offer-far-aud-combo", name: "FAR+AUD Combo Deal", type: "BundleOffer", valueAmount: 3000, appliesTo: "Bundle", appliesToIds: ["bundle-gold"], durationStart: now - 20 * day, durationEnd: now + 40 * day, status: "Paused", createdAt: now - 25 * day },
  ];
}

function readOffers(): OfferItem[] {
  try {
    const raw = localStorage.getItem("offers");
    if (raw) return JSON.parse(raw) as OfferItem[];
  } catch { void 0 }
  const programs = readPrograms();
  return seedOffers(programs);
}

function writeOffers(items: OfferItem[]) {
  try { localStorage.setItem("offers", JSON.stringify(items)); } catch { void 0 }
}

export default function OffersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const programs = readPrograms();
  const courses = readCourses();
  const bundles = readBundles();

  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [search, setSearch] = useState("");
  const [typeTab, setTypeTab] = useState<OfferType | "All">("All");
  const [status, setStatus] = useState<"All" | Status>("All");
  const [view, setView] = useState<"table" | "cards">("table");

  useEffect(() => {
    setOffers(readOffers());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eid = params.get("edit");
    if (eid && offers.some((x) => x.id === eid)) {
      openEdit(eid);
    }
  }, [location.search, offers]);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let arr = offers.filter((o) => {
      const matchTxt = txt ? [o.name, o.couponCode || ""].some((v) => v.toLowerCase().includes(txt)) : true;
      const matchType = typeTab === "All" ? true : o.type === typeTab;
      const matchStatus = status === "All" ? true : o.status === status;
      return matchTxt && matchType && matchStatus;
    });
    arr = arr.sort((a, b) => b.createdAt - a.createdAt);
    return arr;
  }, [offers, search, typeTab, status]);

  const typeTabs: { key: OfferType | "All"; label: string }[] = [
    { key: "All", label: "All" },
    { key: "Flat", label: "Flat Discount" },
    { key: "Percentage", label: "Percentage" },
    { key: "FlashSale", label: "Flash Sale" },
    { key: "Seasonal", label: "Seasonal" },
    { key: "CouponLinked", label: "Coupon-Linked" },
    { key: "BulkGroup", label: "Bulk/Group" },
    { key: "UserSegment", label: "User-Segment" },
    { key: "BundleOffer", label: "Bundle Offer" },
  ];

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dName, setDName] = useState("");
  const [dType, setDType] = useState<OfferType>("Flat");
  const [dValueAmount, setDValueAmount] = useState<number>(0);
  const [dValuePercent, setDValuePercent] = useState<number>(0);
  const [dAppliesTo, setDAppliesTo] = useState<AppliesTo>("All");
  const [dAppliesIds, setDAppliesIds] = useState<string[]>([]);
  const [dStart, setDStart] = useState<number | undefined>(undefined);
  const [dEnd, setDEnd] = useState<number | undefined>(undefined);
  const [dAlwaysOn, setDAlwaysOn] = useState<boolean>(false);
  const [dStatus, setDStatus] = useState<Status>("Active");
  const [dCoupon, setDCoupon] = useState<string>("");
  const [dShowCoursePage, setDShowCoursePage] = useState<boolean>(false);
  const [dShowOfferPage, setDShowOfferPage] = useState<boolean>(true);
  const [dShowHomepageBanner, setDShowHomepageBanner] = useState<boolean>(false);
  const [dBadge, setDBadge] = useState<"Limited Time" | "Hot Deal" | "Bestseller" | "Flash Sale" | "">("");
  const [dMinPrice, setDMinPrice] = useState<number>(0);
  const [dMaxPerUser, setDMaxPerUser] = useState<number>(0);
  const [dMaxTotal, setDMaxTotal] = useState<number>(0);
  const [dRegion, setDRegion] = useState<"India Only" | "International" | "Both">("Both");
  const [dShowCountdown, setDShowCountdown] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const openCreate = () => {
    setIsDrawerOpen(true);
    setEditingId(null);
    setDName("");
    setDType("Flat");
    setDValueAmount(0);
    setDValuePercent(0);
    setDAppliesTo("All");
    setDAppliesIds([]);
    setDStart(undefined);
    setDEnd(undefined);
    setDAlwaysOn(false);
    setDStatus("Active");
    setDCoupon("");
    setDShowCoursePage(false);
    setDShowOfferPage(true);
    setDShowHomepageBanner(false);
    setDBadge("");
    setDMinPrice(0);
    setDMaxPerUser(0);
    setDMaxTotal(0);
    setDRegion("Both");
    setDShowCountdown(false);
    setShowPreview(false);
  };

  const openEdit = (id: string) => {
    const it = offers.find((x) => x.id === id);
    if (!it) return;
    setIsDrawerOpen(true);
    setEditingId(id);
    setDName(it.name);
    setDType(it.type);
    setDValueAmount(it.valueAmount || 0);
    setDValuePercent(it.valuePercent || 0);
    setDAppliesTo(it.appliesTo);
    setDAppliesIds(it.appliesToIds || []);
    setDStart(it.durationStart);
    setDEnd(it.durationEnd);
    setDAlwaysOn(!!it.alwaysOn);
    setDStatus(it.status);
    setDCoupon(it.couponCode || "");
    setDShowCoursePage(!!it.showOnCoursePage);
    setDShowOfferPage(!!it.showOnOffersPage);
    setDShowHomepageBanner(!!it.showOnHomepageBanner);
    setDBadge((it.badge as typeof dBadge) || "");
    setDMinPrice(it.minPriceThreshold || 0);
    setDMaxPerUser(it.maxUsesPerUser || 0);
    setDMaxTotal(it.maxTotalUses || 0);
    setDRegion((it.applicableRegion as typeof dRegion) || "Both");
    setDShowCountdown(!!it.showCountdown);
    setShowPreview(false);
  };

  const saveOffer = () => {
    const name = dName.trim();
    if (!name) return;
    const id = editingId || `offer-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const item: OfferItem = {
      id,
      name,
      type: dType,
      valueAmount: dType === "Flat" || dType === "BundleOffer" ? dValueAmount || 0 : undefined,
      valuePercent: dType === "Percentage" || dType === "CouponLinked" ? dValuePercent || 0 : undefined,
      appliesTo: dAppliesTo,
      appliesToIds: dAppliesTo === "All" ? undefined : dAppliesIds,
      durationStart: dAlwaysOn ? undefined : dStart,
      durationEnd: dAlwaysOn ? undefined : dEnd,
      alwaysOn: dAlwaysOn || undefined,
      status: dStatus,
      couponCode: dType === "CouponLinked" ? dCoupon || undefined : undefined,
      createdAt: Date.now(),
      showOnCoursePage: dShowCoursePage || undefined,
      showOnOffersPage: dShowOfferPage || undefined,
      showOnHomepageBanner: dShowHomepageBanner || undefined,
      badge: dBadge || undefined,
      minPriceThreshold: dMinPrice || undefined,
      maxUsesPerUser: dMaxPerUser || undefined,
      maxTotalUses: dMaxTotal || undefined,
      applicableRegion: dRegion || undefined,
      showCountdown: dType === "FlashSale" ? dShowCountdown || undefined : undefined,
    };
    setOffers((prev) => {
      const exists = prev.some((x) => x.id === id);
      const next = exists ? prev.map((x) => (x.id === id ? item : x)) : [item, ...prev];
      writeOffers(next);
      return next;
    });
    setIsDrawerOpen(false);
  };

  const duplicateOffer = (id: string) => {
    const it = offers.find((x) => x.id === id);
    if (!it) return;
    const copy: OfferItem = { ...it, id: `${it.id}-copy-${Date.now()}`, name: `${it.name} Copy`, createdAt: Date.now() };
    setOffers((prev) => {
      const next = [copy, ...prev];
      writeOffers(next);
      return next;
    });
  };

  const deleteOffer = (id: string) => {
    const ok = window.confirm("Delete this offer?");
    if (!ok) return;
    setOffers((prev) => {
      const next = prev.filter((x) => x.id !== id);
      writeOffers(next);
      return next;
    });
  };

  const togglePause = (id: string) => {
    setOffers((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, status: (x.status === "Paused" ? "Active" : "Paused") as Status } : x));
      writeOffers(next);
      return next;
    });
  };

  const formatDuration = (o: OfferItem) => {
    if (o.alwaysOn) return "Always On";
    if (!o.durationStart || !o.durationEnd) return "—";
    const f = (t: number) => new Date(t).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    const now = Date.now();
    if (o.durationEnd > now && o.durationEnd - now < 48 * 3600 * 1000) {
      const hours = Math.ceil((o.durationEnd - now) / (3600 * 1000));
      return `Ends in ${hours}h`;
    }
    return `${f(o.durationStart)} – ${f(o.durationEnd)}`;
  };

  const appliesSummary = (o: OfferItem) => {
    if (o.appliesTo === "All") return "All courses";
    if (o.appliesTo === "Program") {
      const names = (o.appliesToIds || []).map((id) => programs.find((p) => p.id === id)?.name || id);
      return names.join(", ");
    }
    if (o.appliesTo === "Course") {
      const names = (o.appliesToIds || []).map((id) => courses.find((c) => c.id === id)?.name || id);
      return names.join(", ");
    }
    const names = (o.appliesToIds || []).map((id) => bundles.find((b) => b.id === id)?.name || id);
    return names.join(", ");
  };

  const typeOptions = [
    { value: "Flat", label: "Flat" },
    { value: "Percentage", label: "Percentage" },
    { value: "FlashSale", label: "Flash Sale" },
    { value: "Seasonal", label: "Seasonal" },
    { value: "CouponLinked", label: "Coupon-Linked" },
    { value: "BulkGroup", label: "Bulk/Group" },
    { value: "UserSegment", label: "User-Segment" },
    { value: "BundleOffer", label: "Bundle Offer" },
  ];

  const appliesOptions = [
    { value: "All", label: "All" },
    { value: "Program", label: "Program" },
    { value: "Course", label: "Course" },
    { value: "Bundle", label: "Bundle" },
  ];

  return (
    <>
      <PageMeta title="Offers & Promotions" description="Create time-bound or program-wide promotional offers." />
      <PageBreadcrumb pageTitle="Offers & Promotions" />
      <ComponentCard title="Offers & Promotions">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-xl">
              <Input placeholder="Search offers" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Select options={[{ value: "All", label: "All" }, { value: "Active", label: "Active" }, { value: "Paused", label: "Paused" }, { value: "Expired", label: "Expired" }]} defaultValue={status} onChange={(v) => setStatus(v as typeof status)} />
              <Button onClick={openCreate} startIcon={<PlusIcon className="w-4 h-4" />}>Create Offer</Button>
              <Button variant="outline" onClick={() => setView((v) => (v === "table" ? "cards" : "table"))}>{view === "table" ? "Card View" : "Table View"}</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {typeTabs.map((t) => (
              <button key={t.key} className={`inline-flex items-center rounded-full border px-3 py-1 text-theme-xs ${typeTab === t.key ? "border-brand-500 text-brand-600" : "border-gray-200 text-gray-600"}`} onClick={() => setTypeTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {offers.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-3xl">🎉</div>
              <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">No Offers Yet</div>
              <div className="mt-1 text-theme-xs text-gray-500">Offers help boost conversions and seasonal sales.</div>
              <div className="mt-4">
                <Button onClick={openCreate} startIcon={<PlusIcon className="w-4 h-4" />}>Create Offer</Button>
              </div>
            </div>
          )}

          {view === "table" ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Offer Name</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Type</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Value</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Applies To</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Duration</TableCell>
                      <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {filtered.map((o) => (
                      <TableRow key={o.id} className="transition hover:bg-gray-50">
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          <button className="underline decoration-dotted" onClick={() => navigate(`/offerings/offers/${o.id}`)}>{o.name}</button>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{typeOptions.find((x) => x.value === o.type)?.label || o.type}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{o.valuePercent ? `${o.valuePercent}% OFF` : o.valueAmount ? `${new Intl.NumberFormat("en-IN").format(o.valueAmount)} OFF` : "—"}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{appliesSummary(o)}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{formatDuration(o)}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="relative flex items-center gap-2">
                            <button className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => togglePause(o.id)}>{o.status === "Paused" ? "Resume" : "Pause"}</button>
                            <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setEditingId((m) => (m === o.id ? null : o.id))}>
                              <MoreDotIcon className="w-4 h-4" />
                            </button>
                            <Dropdown isOpen={editingId === o.id} onClose={() => setEditingId(null)}>
                              <DropdownItem onClick={() => { setEditingId(null); openEdit(o.id); }}>Edit</DropdownItem>
                              <DropdownItem onClick={() => { setEditingId(null); duplicateOffer(o.id); }}>Duplicate</DropdownItem>
                              <DropdownItem onClick={() => { setEditingId(null); deleteOffer(o.id); }}>Delete</DropdownItem>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((o) => (
                <div
                  key={o.id}
                  className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03] ${(() => { const now = Date.now(); return o.durationEnd && o.durationEnd > now && o.durationEnd - now < 48 * 3600 * 1000 ? "animate-pulse" : ""; })()}`}
                  draggable
                  onDragStart={() => setDraggingId(o.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const fromId = draggingId;
                    const toId = o.id;
                    if (!fromId || fromId === toId) return;
                    setOffers((prev) => {
                      const fromIndex = prev.findIndex((x) => x.id === fromId);
                      const toIndex = prev.findIndex((x) => x.id === toId);
                      if (fromIndex < 0 || toIndex < 0) return prev;
                      const next = [...prev];
                      const [m] = next.splice(fromIndex, 1);
                      next.splice(toIndex, 0, m);
                      writeOffers(next);
                      return next;
                    });
                  }}
                >
                  <div className="text-lg font-semibold text-gray-800 dark:text-white/90">{o.name}</div>
                  <div className="mt-1 text-theme-xs text-gray-500">{typeOptions.find((x) => x.value === o.type)?.label || o.type}</div>
                  <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">{o.valuePercent ? `${o.valuePercent}% OFF` : o.valueAmount ? `${new Intl.NumberFormat("en-IN").format(o.valueAmount)} OFF` : "—"}</div>
                  <div className="mt-1 text-theme-xs text-gray-500">{appliesSummary(o)}</div>
                  <div className="mt-1 text-theme-xs text-gray-500">Valid: {formatDuration(o)}</div>
                  <div className="mt-1 text-theme-xs text-gray-500">Status: {o.status}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate(`/offerings/offers/${o.id}`)}>View</Button>
                    <Button variant="outline" onClick={() => openEdit(o.id)}>Edit</Button>
                    <Button variant="outline" onClick={() => togglePause(o.id)}>{o.status === "Paused" ? "Resume" : "Pause"}</Button>
                    <Button variant="outline" onClick={() => deleteOffer(o.id)}>Delete</Button>
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
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">{editingId ? "Edit Offer" : "Create Offer"}</div>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div>
                  <div className="text-theme-xs text-gray-600">Offer Name</div>
                  <Input value={dName} onChange={(e) => setDName(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-theme-xs text-gray-600">Offer Type</div>
                    <Select options={typeOptions} defaultValue={dType} onChange={(v) => setDType(v as OfferType)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Status</div>
                    <Select options={[{ value: "Active", label: "Active" }, { value: "Paused", label: "Paused" }, { value: "Expired", label: "Expired" }]} defaultValue={dStatus} onChange={(v) => setDStatus(v as Status)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-theme-xs text-gray-600">Flat Amount (INR)</div>
                    <Input value={String(dValueAmount)} onChange={(e) => setDValueAmount(Number(e.target.value) || 0)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Percentage (%)</div>
                    <Input value={String(dValuePercent)} onChange={(e) => setDValuePercent(Number(e.target.value) || 0)} />
                  </div>
                </div>
                {dType === "FlashSale" && (
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                    <div className="text-theme-sm text-gray-800 dark:text-white/90">Show countdown on website?</div>
                    <Switch label="" defaultChecked={dShowCountdown} onChange={(v) => setDShowCountdown(v)} />
                  </div>
                )}
                <div>
                  <div className="text-theme-xs text-gray-600">Applies To</div>
                  <Select options={appliesOptions} defaultValue={dAppliesTo} onChange={(v) => setDAppliesTo(v as AppliesTo)} />
                </div>
                {dAppliesTo !== "All" && (
                  <div>
                    <MultiSelect label="Select Items" options={(dAppliesTo === "Program" ? programs.map((p) => ({ value: p.id, text: p.name })) : dAppliesTo === "Course" ? courses.map((c) => ({ value: c.id, text: c.name })) : bundles.map((b) => ({ value: b.id, text: b.name })))} value={dAppliesIds} onChange={(vals) => setDAppliesIds(vals)} placeholder="Select" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Switch label="Always On" defaultChecked={dAlwaysOn} onChange={(v) => setDAlwaysOn(v)} />
                  <div className="flex-1" />
                </div>
                {!dAlwaysOn && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DatePicker id="offer-start" mode="single" enableTime dateFormat="Y-m-d h:i K" onChange={(dates) => {
                      const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date);
                      if (d && d instanceof Date) setDStart(d.getTime());
                    }} label="Start Date" />
                    <DatePicker id="offer-end" mode="single" enableTime dateFormat="Y-m-d h:i K" onChange={(dates) => {
                      const d = Array.isArray(dates) ? dates[0] : (dates as unknown as Date);
                      if (d && d instanceof Date) setDEnd(d.getTime());
                    }} label="End Date" />
                  </div>
                )}
                {dType === "CouponLinked" && (
                  <div>
                    <div className="text-theme-xs text-gray-600">Coupon Code</div>
                    <Input value={dCoupon} onChange={(e) => setDCoupon(e.target.value)} />
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                    <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Visibility</div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-theme-xs text-gray-600">Course Page</div>
                        <Switch label="" defaultChecked={dShowCoursePage} onChange={(v) => setDShowCoursePage(v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-theme-xs text-gray-600">Offer Page</div>
                        <Switch label="" defaultChecked={dShowOfferPage} onChange={(v) => setDShowOfferPage(v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-theme-xs text-gray-600">Homepage Banner</div>
                        <Switch label="" defaultChecked={dShowHomepageBanner} onChange={(v) => setDShowHomepageBanner(v)} />
                      </div>
                      <div className="mt-3">
                        <div className="text-theme-xs text-gray-600">Badge</div>
                        <Select options={[{ value: "", label: "None" }, { value: "Limited Time", label: "Limited Time" }, { value: "Hot Deal", label: "Hot Deal" }, { value: "Bestseller", label: "Bestseller" }, { value: "Flash Sale", label: "Flash Sale" }]} defaultValue={dBadge} onChange={(v) => setDBadge(v as typeof dBadge)} />
                      </div>
                      <div className="mt-3">
                        <div className="inline-flex items-center rounded-full border px-3 py-1 text-theme-xs text-gray-700">
                          {dValuePercent ? `${dValuePercent}% OFF` : dValueAmount ? `${new Intl.NumberFormat("en-IN").format(dValueAmount)} OFF` : "—"}
                          {dBadge ? ` • ${dBadge}` : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                    <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Offer Restrictions</div>
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="text-theme-xs text-gray-600">Minimum Price Threshold (INR)</div>
                        <Input value={String(dMinPrice)} onChange={(e) => setDMinPrice(Number(e.target.value) || 0)} />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-theme-xs text-gray-600">Max Uses Per User</div>
                          <Input value={String(dMaxPerUser)} onChange={(e) => setDMaxPerUser(Number(e.target.value) || 0)} />
                        </div>
                        <div>
                          <div className="text-theme-xs text-gray-600">Max Total Uses</div>
                          <Input value={String(dMaxTotal)} onChange={(e) => setDMaxTotal(Number(e.target.value) || 0)} />
                        </div>
                      </div>
                      <div>
                        <div className="text-theme-xs text-gray-600">Applicable Regions</div>
                        <Select options={[{ value: "India Only", label: "India Only" }, { value: "International", label: "International" }, { value: "Both", label: "Both" }]} defaultValue={dRegion} onChange={(v) => setDRegion(v as typeof dRegion)} />
                      </div>
                    </div>
                  </div>
                </div>
                {showPreview && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
                    <div className="text-lg font-semibold text-gray-800 dark:text-white/90">{dName || "Offer Preview"}</div>
                    <div className="mt-1 text-theme-xs text-gray-500">{typeOptions.find((x) => x.value === dType)?.label || dType}</div>
                    <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">{dValuePercent ? `${dValuePercent}% OFF` : dValueAmount ? `${new Intl.NumberFormat("en-IN").format(dValueAmount)} OFF` : "—"}</div>
                    <div className="mt-1 text-theme-xs text-gray-500">{dAppliesTo === "All" ? "All courses" : dAppliesTo === "Program" ? dAppliesIds.map((id) => programs.find((p) => p.id === id)?.name || id).join(", ") : dAppliesTo === "Course" ? dAppliesIds.map((id) => courses.find((c) => c.id === id)?.name || id).join(", ") : dAppliesIds.map((id) => bundles.find((b) => b.id === id)?.name || id).join(", ")}</div>
                    <div className="mt-1 text-theme-xs text-gray-500">Valid: {dAlwaysOn ? "Always On" : dStart && dEnd ? `${new Date(dStart).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${new Date(dEnd).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}` : "—"}</div>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-theme-xs text-gray-700">{dBadge ? dBadge : "No badge"}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowPreview((p) => !p)}>{showPreview ? "Hide Preview" : "Preview Offer"}</Button>
                  <Button onClick={saveOffer}>{editingId ? "Save Changes" : "Create Offer"}</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <button
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-white shadow-lg sm:hidden"
        onClick={openCreate}
      >
        <PlusIcon className="w-5 h-5" />
        <span>Offer</span>
      </button>
    </>
  );
}