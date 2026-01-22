import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";

type PaymentStatus = "Paid" | "Partial" | "Pending" | "Failed" | "Refunded" | "Disputed";
type OrderType = "Course" | "Bundle" | "EnrollmentRenewal" | "AddOn";
type PaymentMethod = "UPI" | "Card" | "Netbanking" | "Razorpay" | "AdminManual";

type OrderItem = {
  id: string;
  orderCode: string;
  studentName: string;
  studentEmail: string;
  itemType: OrderType;
  itemId: string;
  itemName: string;
  programId?: string;
  courseId?: string;
  bundleId?: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  date: number;
  couponCode?: string;
  offerApplied?: string;
  enrollmentId?: string;
  source?: "Website" | "Admin" | "Counselor";
  basePrice?: number;
  discountAmount?: number;
  couponAmount?: number;
  totalPayable?: number;
  paidAmount?: number;
  pendingAmount?: number;
  gatewayFees?: number;
  netSettlement?: number;
  invoiceId?: string;
};

type TimelineEvent = { date: number; text: string };

function readOrders(): OrderItem[] {
  try { const raw = localStorage.getItem("orders"); if (raw) return JSON.parse(raw) as OrderItem[]; } catch {}
  return [];
}
function writeOrders(items: OrderItem[]) { try { localStorage.setItem("orders", JSON.stringify(items)); } catch {} }

function readTimeline(): Record<string, TimelineEvent[]> {
  try { const raw = localStorage.getItem("orderTimeline"); if (raw) return JSON.parse(raw) as Record<string, TimelineEvent[]>; } catch {}
  return {};
}
function writeTimeline(map: Record<string, TimelineEvent[]>) { try { localStorage.setItem("orderTimeline", JSON.stringify(map)); } catch {} }

export default function OrderDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState<{ type: "paid"|"partial"|"refund"|"cancel"|null }>({ type: null });

  useEffect(() => {
    const list = readOrders();
    const found = list.find(o => o.id === orderId) || null;
    if (found) {
      if (found.orderCode === "#NSA12578") {
        const enriched: OrderItem = {
          ...found,
          basePrice: found.basePrice ?? 24999,
          discountAmount: found.discountAmount ?? 4000,
          couponCode: found.couponCode ?? "FAR20",
          couponAmount: found.couponAmount ?? 1000,
          totalPayable: found.totalPayable ?? 19999,
          paidAmount: found.paidAmount ?? 19999,
          pendingAmount: found.pendingAmount ?? 0,
          gatewayFees: found.gatewayFees ?? 543,
          netSettlement: found.netSettlement ?? 19456,
          invoiceId: found.invoiceId ?? "INV-2025-0099",
          offerApplied: found.offerApplied ?? "Republic Day Sale",
        };
        setOrder(enriched);
        const t = readTimeline();
        const tl = t[orderId] || [];
        if (tl.length === 0) {
          t[orderId] = [
            { date: enriched.date + 2*60*1000, text: "Payment Link Sent" },
            { date: enriched.date + 5*60*1000, text: "Payment Initiated (UPI)" },
            { date: enriched.date + 6*60*1000, text: "Payment Authorized" },
            { date: enriched.date + 6*60*1000, text: "Payment Captured" },
            { date: enriched.date + 7*60*1000, text: "Enrollment Created" },
            { date: enriched.date + 7*60*1000, text: "Invoice Issued" },
          ];
          writeTimeline(t);
        }
      } else {
        setOrder(found);
      }
    } else {
      setOrder(null);
    }
  }, [orderId]);

  const timeline = useMemo(() => {
    const t = readTimeline();
    return orderId ? (t[orderId] || []) : [];
  }, [orderId]);

  const markPaid = () => {
    if (!order) return;
    const nextStatus: PaymentStatus = "Paid";
    setOrder({ ...order, status: nextStatus, pendingAmount: 0, paidAmount: order.totalPayable ?? order.amount });
    const list = readOrders().map(o => o.id === order.id ? { ...o, status: nextStatus } : o);
    writeOrders(list);
    const t = readTimeline(); const arr = t[order.id] || []; arr.push({ date: Date.now(), text: "Marked as Paid" }); t[order.id] = arr; writeTimeline(t);
    setIsConfirmOpen({ type: null });
  };
  const markPartial = () => {
    if (!order) return;
    const nextStatus: PaymentStatus = "Partial";
    setOrder({ ...order, status: nextStatus });
    const list = readOrders().map(o => o.id === order.id ? { ...o, status: nextStatus } : o);
    writeOrders(list);
    const t = readTimeline(); const arr = t[order.id] || []; arr.push({ date: Date.now(), text: "Marked Partial Payment" }); t[order.id] = arr; writeTimeline(t);
    setIsConfirmOpen({ type: null });
  };
  const refund = () => {
    if (!order) return;
    const nextStatus: PaymentStatus = "Refunded";
    setOrder({ ...order, status: nextStatus });
    const list = readOrders().map(o => o.id === order.id ? { ...o, status: nextStatus } : o);
    writeOrders(list);
    const t = readTimeline(); const arr = t[order.id] || []; arr.push({ date: Date.now(), text: "Refund processed" }); t[order.id] = arr; writeTimeline(t);
    setIsConfirmOpen({ type: null });
  };
  const cancelOrder = () => {
    if (!order) return;
    const nextStatus: PaymentStatus = "Failed";
    setOrder({ ...order, status: nextStatus });
    const list = readOrders().map(o => o.id === order.id ? { ...o, status: nextStatus } : o);
    writeOrders(list);
    const t = readTimeline(); const arr = t[order.id] || []; arr.push({ date: Date.now(), text: "Order cancelled" }); t[order.id] = arr; writeTimeline(t);
    setIsConfirmOpen({ type: null });
  };

  if (!order) {
    return (
      <>
        <PageMeta title="Order" description="Order details" />
        <PageBreadcrumb pageTitle="Order" />
        <ComponentCard title="Order not found">
          <div className="p-4">
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </ComponentCard>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Order ${order.orderCode}`} description="Order details" />
      <PageBreadcrumb pageTitle="View Order" />

      <ComponentCard title="">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90">{order.orderCode} <span className="ml-2 text-theme-sm">({order.status})</span></div>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="text-theme-xs text-gray-600">Student</div>
              <div className="text-theme-sm text-gray-800 dark:text-white/90">{order.studentName}</div>
              <div className="text-theme-xs text-gray-600">{order.studentEmail}</div>
            </div>
            <div>
              <div className="text-theme-xs text-gray-600">Amount</div>
              <div className="text-theme-sm text-gray-800 dark:text-white/90">₹{(order.totalPayable ?? order.amount).toLocaleString("en-IN")}</div>
              <div className="text-theme-xs text-gray-600">Method: {order.method}</div>
            </div>
            <div>
              <div className="text-theme-xs text-gray-600">Date</div>
              <div className="text-theme-sm text-gray-800 dark:text-white/90">{new Date(order.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div>
              <div className="text-theme-xs text-gray-600">Invoice ID: {order.invoiceId || "—"}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="outline">Download Invoice</Button>
            <Button variant="outline">Resend Invoice</Button>
            <Button variant="outline" onClick={() => navigate(`/enrollments/${order.enrollmentId || ""}`)}>View Enrollment</Button>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Payment Breakdown">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 text-theme-sm">
              <div>Base Price: ₹{(order.basePrice ?? order.amount).toLocaleString("en-IN")}</div>
              <div>Discount (Offer): -₹{(order.discountAmount ?? 0).toLocaleString("en-IN")}</div>
              <div>Coupon ({order.couponCode || "—"}): -₹{(order.couponAmount ?? 0).toLocaleString("en-IN")}</div>
              <div>Total Payable: ₹{(order.totalPayable ?? order.amount).toLocaleString("en-IN")}</div>
            </div>
            <div className="space-y-1 text-theme-sm">
              <div>Paid Amount: ₹{(order.paidAmount ?? 0).toLocaleString("en-IN")}</div>
              <div>Pending Amount: ₹{(order.pendingAmount ?? Math.max((order.totalPayable ?? order.amount) - (order.paidAmount ?? 0), 0)).toLocaleString("en-IN")}</div>
              <div>Payment Status: {order.status}</div>
              <div>Gateway Fees: ₹{(order.gatewayFees ?? 0).toLocaleString("en-IN")}</div>
              <div>Net Settlement: ₹{(order.netSettlement ?? (order.paidAmount ?? 0) - (order.gatewayFees ?? 0)).toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Payment Timeline">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="space-y-2">
            {timeline.map((a, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-brand-500"></div>
                <div className="text-theme-sm text-gray-800 dark:text-white/90">
                  {new Date(a.date).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} — {a.text}
                </div>
              </div>
            ))}
            {timeline.length === 0 && <div className="text-theme-xs text-gray-600">No activity yet</div>}
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Order Items">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="text-theme-sm text-gray-800 dark:text-white/90">• {order.itemName} (₹{(order.totalPayable ?? order.amount).toLocaleString("en-IN")})</div>
        </div>
      </ComponentCard>

      <ComponentCard title="Linked Records">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-theme-sm">
            <div>Enrollment: {order.enrollmentId ? <Button variant="outline" onClick={()=>navigate(`/enrollments/${order.enrollmentId}`)}>Open</Button> : "—"}</div>
            <div>Student Profile: {order.studentName}</div>
            <div>Payment Gateway Response: <Button variant="outline">View Logs</Button></div>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Admin Actions">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={()=>setIsConfirmOpen({ type: "paid" })}>Mark as Paid</Button>
            <Button variant="outline" onClick={()=>setIsConfirmOpen({ type: "partial" })}>Add Manual Payment</Button>
            <Button variant="outline">Send Payment Link</Button>
            <Button variant="outline" onClick={()=>setIsConfirmOpen({ type: "refund" })}>Issue Refund</Button>
            <Button variant="outline" onClick={()=>setIsConfirmOpen({ type: "cancel" })}>Cancel Order</Button>
            <Button>Download Invoice</Button>
          </div>
        </div>
      </ComponentCard>

      <Modal isOpen={!!isConfirmOpen.type} onClose={()=>setIsConfirmOpen({ type: null })} className="w-auto max-w-md">
        <div className="p-6">
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Confirm</div>
          <div className="mt-2 text-theme-sm text-gray-700">Proceed with {isConfirmOpen.type === "paid" ? "marking as Paid" : isConfirmOpen.type === "partial" ? "adding manual payment" : isConfirmOpen.type === "refund" ? "issuing refund" : "cancelling order"}?</div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={()=>setIsConfirmOpen({ type: null })}>Cancel</Button>
            {isConfirmOpen.type === "paid" && <Button onClick={markPaid}>Confirm</Button>}
            {isConfirmOpen.type === "partial" && <Button onClick={markPartial}>Confirm</Button>}
            {isConfirmOpen.type === "refund" && <Button onClick={refund}>Confirm</Button>}
            {isConfirmOpen.type === "cancel" && <Button onClick={cancelOrder}>Confirm</Button>}
          </div>
        </div>
      </Modal>
    </>
  );
}