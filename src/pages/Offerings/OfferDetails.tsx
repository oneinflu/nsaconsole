import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";

type Status = "Active" | "Paused" | "Expired";
type OfferType = "Flat" | "Percentage" | "FlashSale" | "Seasonal" | "CouponLinked" | "BulkGroup" | "UserSegment" | "BundleOffer";
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
  return [];
}

function readBundles(): BundleItem[] {
  try {
    const raw = localStorage.getItem("bundles");
    if (raw) return JSON.parse(raw) as BundleItem[];
  } catch {}
  return [];
}

function readOffers(): OfferItem[] {
  try {
    const raw = localStorage.getItem("offers");
    if (raw) return JSON.parse(raw) as OfferItem[];
  } catch {}
  return [];
}

function writeOffers(items: OfferItem[]) {
  try { localStorage.setItem("offers", JSON.stringify(items)); } catch {}
}

export default function OfferDetailsPage() {
  const navigate = useNavigate();
  const { offerId } = useParams();
  const programs = readPrograms();
  const courses = readCourses();
  const bundles = readBundles();

  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [offer, setOffer] = useState<OfferItem | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    setOffers(readOffers());
  }, []);

  useEffect(() => {
    const it = offers.find((x) => x.id === offerId);
    setOffer(it || null);
  }, [offers, offerId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const typeLabel = useMemo(() => {
    if (!offer) return "";
    const map: Record<OfferType, string> = {
      Flat: "Flat",
      Percentage: "Percentage",
      FlashSale: "Flash Sale",
      Seasonal: "Seasonal",
      CouponLinked: "Coupon-Linked",
      BulkGroup: "Bulk/Group",
      UserSegment: "User-Segment",
      BundleOffer: "Bundle Offer",
    };
    return map[offer.type];
  }, [offer]);

  const appliesSummary = useMemo(() => {
    if (!offer) return "";
    if (offer.appliesTo === "All") return "All courses";
    if (offer.appliesTo === "Program") return (offer.appliesToIds || []).map((id) => programs.find((p) => p.id === id)?.name || id).join(", ");
    if (offer.appliesTo === "Course") return (offer.appliesToIds || []).map((id) => courses.find((c) => c.id === id)?.name || id).join(", ");
    return (offer.appliesToIds || []).map((id) => bundles.find((b) => b.id === id)?.name || id).join(", ");
  }, [offer, programs, courses, bundles]);

  const formatDuration = (o: OfferItem | null) => {
    if (!o) return "—";
    if (o.alwaysOn) return "Always On";
    if (!o.durationStart || !o.durationEnd) return "—";
    const f = (t: number) => new Date(t).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    if (o.durationEnd > now && o.durationEnd - now < 48 * 3600 * 1000) {
      const hours = Math.ceil((o.durationEnd - now) / (3600 * 1000));
      return `Ends in ${hours}h`;
    }
    return `${f(o.durationStart)} – ${f(o.durationEnd)}`;
  };

  const nearExpiry = offer && offer.durationEnd && offer.durationEnd > now && offer.durationEnd - now < 48 * 3600 * 1000;

  const updateOffer = (updater: (o: OfferItem) => OfferItem) => {
    if (!offer) return;
    setOffers((prev) => {
      const next = prev.map((x) => (x.id === offer.id ? updater(x) : x));
      writeOffers(next);
      return next;
    });
  };

  const togglePause = () => {
    if (!offer) return;
    updateOffer((o) => ({ ...o, status: (o.status === "Paused" ? "Active" : "Paused") as Status }));
    setOffer((o) => (o ? { ...o, status: (o.status === "Paused" ? "Active" : "Paused") as Status } : o));
  };

  const duplicateOffer = () => {
    if (!offer) return;
    const copy: OfferItem = { ...offer, id: `${offer.id}-copy-${Date.now()}`, name: `${offer.name} Copy`, createdAt: Date.now() };
    setOffers((prev) => {
      const next = [copy, ...prev];
      writeOffers(next);
      return next;
    });
  };

  const deleteOffer = () => {
    if (!offer) return;
    const ok = window.confirm("Delete this offer?");
    if (!ok) return;
    setOffers((prev) => {
      const next = prev.filter((x) => x.id !== offer.id);
      writeOffers(next);
      return next;
    });
    navigate("/offerings/offers");
  };

  const editOffer = () => {
    if (!offer) return;
    navigate(`/offerings/offers?edit=${offer.id}`);
  };

  const discountText = offer?.valuePercent ? `${offer.valuePercent}% OFF` : offer?.valueAmount ? `${new Intl.NumberFormat("en-IN").format(offer.valueAmount)} OFF` : "—";

  return (
    <>
      <PageMeta title={offer ? offer.name : "Offer Details"} description="View offer details and affected items" />
      <PageBreadcrumb pageTitle="Offer Details" />
      <ComponentCard title={offer ? offer.name : "Offer Details"}>
        {!offer ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="text-3xl">🎉</div>
            <div className="mt-2 text-theme-sm text-gray-800 dark:text-white/90">No Offers Yet</div>
            <div className="mt-1 text-theme-xs text-gray-500">Offers help boost conversions and seasonal sales.</div>
            <div className="mt-4">
              <Button onClick={() => navigate("/offerings/offers")}>Create Offer</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03] ${nearExpiry ? "animate-pulse" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Summary</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={editOffer}>Edit</Button>
                  <Button variant="outline" onClick={togglePause}>{offer.status === "Paused" ? "Resume" : "Pause"}</Button>
                  <Button variant="outline" onClick={duplicateOffer}>Duplicate</Button>
                  <Button variant="outline" onClick={deleteOffer}>Delete</Button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-theme-xs text-gray-600">Offer</div>
                  <div className="text-theme-sm text-gray-800 dark:text-white/90">{offer.name}</div>
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Type</div>
                  <div className="text-theme-sm text-gray-800 dark:text-white/90">{typeLabel}</div>
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Value</div>
                  <div className="inline-flex items-center rounded-full border px-3 py-1 text-theme-xs text-gray-700 transition-transform hover:scale-105">{discountText}{offer.badge ? ` • ${offer.badge}` : ""}</div>
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Duration</div>
                  <div className="text-theme-sm text-gray-800 dark:text-white/90">{formatDuration(offer)}</div>
                </div>
                <div>
                  <div className="text-theme-xs text-gray-600">Status</div>
                  <div className="text-theme-sm text-gray-800 dark:text-white/90">{offer.status}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Courses affected</div>
              <div className="mt-2 text-theme-xs text-gray-500">{appliesSummary}</div>
              {offer.appliesTo !== "All" && (
                <ul className="mt-2 list-disc pl-5 text-theme-xs text-gray-700">
                  {(offer.appliesToIds || []).map((id) => (
                    <li key={id}>
                      {offer.appliesTo === "Program"
                        ? programs.find((p) => p.id === id)?.name || id
                        : offer.appliesTo === "Course"
                        ? courses.find((c) => c.id === id)?.name || id
                        : bundles.find((b) => b.id === id)?.name || id}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03] ${nearExpiry ? "animate-pulse" : ""}`}>
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Offer Preview (Student View)</div>
              <div className="mt-2 text-2xl">🔥 {offer.name}</div>
              <div className="mt-1 text-theme-sm text-gray-800 dark:text-white/90">{offer.appliesTo === "All" ? ` ${discountText} on all courses.` : `${discountText} on ${appliesSummary}.`}</div>
              {offer.durationEnd && offer.durationEnd > now && (
                <div className="mt-1 text-theme-xs text-gray-500">Ends in {Math.max(1, Math.ceil((offer.durationEnd - now) / (60 * 1000))) > 120 ? `${Math.ceil((offer.durationEnd - now) / (3600 * 1000))} hours` : `${Math.ceil((offer.durationEnd - now) / (60 * 1000))} minutes` }.</div>
              )}
            </div>
          </div>
        )}
      </ComponentCard>
    </>
  );
}