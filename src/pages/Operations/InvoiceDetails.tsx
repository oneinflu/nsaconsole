import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";

type InvoiceStatus = "Paid" | "Unpaid" | "Overdue" | "Partially Paid" | "Refunded" | "Cancelled";
type PaymentMethod = "UPI" | "Card" | "Netbanking" | "Cash" | "Bank" | "Razorpay" | "Stripe" | "Other";
type InvoiceType = "Auto-generated" | "Manual Invoice" | "Add-on Invoice" | "Renewal Invoice";

type InvoiceItem = {
  id: string;
  invoiceId: string;
  studentName: string;
  studentEmail: string;
  amount: number;
  status: InvoiceStatus;
  date: number;
  orderCode?: string;
  method?: PaymentMethod;
  type?: InvoiceType;
};

type TimelineEvent = { date: number; text: string };

function readInvoices(): InvoiceItem[] {
  try { const raw = localStorage.getItem("invoices"); if (raw) return JSON.parse(raw) as InvoiceItem[]; } catch { void 0 }
  return [];
}
function writeInvoices(items: InvoiceItem[]) { try { localStorage.setItem("invoices", JSON.stringify(items)); } catch { void 0 }
}
function readOrders(): { id: string; orderCode: string; enrollmentId?: string; itemName: string }[] {
  try { const raw = localStorage.getItem("orders"); if (raw) return JSON.parse(raw) as { id: string; orderCode: string; enrollmentId?: string; itemName: string }[]; } catch { void 0 }
  return [];
}
function readInvoiceTimeline(): Record<string, TimelineEvent[]> {
  try { const raw = localStorage.getItem("invoiceTimeline"); if (raw) return JSON.parse(raw) as Record<string, TimelineEvent[]>; } catch { void 0 }
  return {};
}
function writeInvoiceTimeline(map: Record<string, TimelineEvent[]>) { try { localStorage.setItem("invoiceTimeline", JSON.stringify(map)); } catch { void 0 }
}
function readInvoiceNotes(): Record<string, { date: number; text: string }[]> {
  try { const raw = localStorage.getItem("invoiceNotes"); if (raw) return JSON.parse(raw) as Record<string, { date: number; text: string }[]>; } catch { void 0 }
  return {};
}
function writeInvoiceNotes(map: Record<string, { date: number; text: string }[]>) { try { localStorage.setItem("invoiceNotes", JSON.stringify(map)); } catch { void 0 }
}
function readInvoiceHistory(): Record<string, { date: number; text: string }[]> {
  try { const raw = localStorage.getItem("invoiceHistory"); if (raw) return JSON.parse(raw) as Record<string, { date: number; text: string }[]>; } catch { void 0 }
  return {};
}
function writeInvoiceHistory(map: Record<string, { date: number; text: string }[]>) { try { localStorage.setItem("invoiceHistory", JSON.stringify(map)); } catch { void 0 }
}

export default function InvoiceDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const invCode = params.invoiceId as string;
  const [invoice, setInvoice] = useState<InvoiceItem | null>(null);
  const [lineItems, setLineItems] = useState<{ desc: string; amount: number }[]>([]);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<number | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [batchName, setBatchName] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ date: number; text: string }[]>([]);
  const [newNote, setNewNote] = useState<string>("");

  useEffect(() => {
    const list = readInvoices();
    const found = list.find(i => i.invoiceId === invCode) || null;
    setInvoice(found || null);
    if (found) {
      if (found.invoiceId === "INV-2025-091") {
        setLineItems([
          { desc: "CPA US – FAR Course", amount: 24999 },
          { desc: "Printed Books Add-on", amount: 1999 },
        ]);
        setTaxPercent(18);
        setDiscountAmount(1000);
        setDueDate(null);
        setPaymentId("rp_payment_23sdfsd");
        setBatchName("FAR – Jan 2025");
        const tl = readInvoiceTimeline();
        if (!tl[invCode] || tl[invCode].length === 0) {
          tl[invCode] = [
            { date: found.date + 6*60*1000, text: "Payment Initiated" },
            { date: found.date + 6*60*1000, text: "Payment Captured" },
            { date: found.date + 7*60*1000, text: "Invoice Generated" },
            { date: found.date + 7*60*1000, text: "Email Sent to Student" },
          ];
          writeInvoiceTimeline(tl);
        }
        const nt = readInvoiceNotes();
        if (!nt[invCode] || nt[invCode].length === 0) {
          nt[invCode] = [
            { date: found.date + 5*60*1000, text: "Student requested corporate invoice" },
            { date: found.date + 5*60*1000, text: "Discount approved by Manager" },
          ];
          writeInvoiceNotes(nt);
        }
        const hist = readInvoiceHistory();
        if (!hist[invCode] || hist[invCode].length === 0) {
          hist[invCode] = [
            { date: found.date + 7*60*1000, text: "Invoice created by Admin" },
            { date: found.date + 5*60*1000, text: "Discount updated by Admin" },
            { date: found.date + 6*60*1000, text: "Marked Paid manually" },
          ];
          writeInvoiceHistory(hist);
        }
      } else {
        setLineItems([{ desc: "Item", amount: found.amount }]);
        setTaxPercent(0);
        setDiscountAmount(0);
      }
    }
  }, [invCode]);

  const subtotal = useMemo(() => lineItems.reduce((s, it) => s + it.amount, 0), [lineItems]);
  const taxAmt = useMemo(() => Math.round(subtotal * (taxPercent/100)), [subtotal, taxPercent]);
  const grandTotal = useMemo(() => Math.max(subtotal + taxAmt - discountAmount, 0), [subtotal, taxAmt, discountAmount]);
  const timeline = useMemo(() => { const tl = readInvoiceTimeline(); return invCode ? (tl[invCode] || []) : []; }, [invCode]);
  const orderCode = invoice?.orderCode || "—";
  const order = useMemo(() => { const orders = readOrders(); return orders.find(o => o.orderCode === orderCode) || null; }, [orderCode]);

  const statusClass = (s: InvoiceStatus) => s === "Paid" ? "text-success-600" : s === "Unpaid" ? "text-gray-600" : s === "Overdue" ? "text-warning-600" : s === "Partially Paid" ? "text-orange-600" : s === "Refunded" ? "text-brand-600" : "text-error-600";

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => {
      const next = [...prev, { date: Date.now(), text: newNote.trim() }];
      const map = readInvoiceNotes(); map[invCode] = next; writeInvoiceNotes(map); return next;
    });
    setNewNote("");
  };

  useEffect(() => {
    const m = readInvoiceNotes(); setNotes(m[invCode] || []);
  }, [invCode]);

  const markCancelled = () => {
    if (!invoice) return;
    const nextStatus: InvoiceStatus = "Cancelled";
    setInvoice({ ...invoice, status: nextStatus });
    const list = readInvoices().map(i => i.id === invoice.id ? { ...i, status: nextStatus } : i);
    writeInvoices(list);
  };

  const addPayment = () => {
    if (!invoice) return;
    const nextStatus: InvoiceStatus = invoice.status === "Paid" ? "Paid" : "Partially Paid";
    setInvoice({ ...invoice, status: nextStatus });
    const list = readInvoices().map(i => i.id === invoice.id ? { ...i, status: nextStatus } : i);
    writeInvoices(list);
  };

  if (!invoice) return (
    <>
      <PageMeta title="Invoice" description="View invoice details and history" />
      <PageBreadcrumb pageTitle="Invoice" />
      <ComponentCard title="View invoice details and history">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-theme-sm text-gray-600 dark:border-white/[0.06] dark:bg-white/[0.03]">Invoice not found</div>
      </ComponentCard>
    </>
  );

  return (
    <>
      <PageMeta title={`Invoice ${invoice.invoiceId}`} description="View invoice details and history" />
      <PageBreadcrumb pageTitle="Invoice" />
      <ComponentCard title="View full invoice details, billing, timeline, and audit log.">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Invoice #{invoice.invoiceId}</div>
                <div className="mt-1 text-theme-xs text-gray-600">Date: {new Date(invoice.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div>
                <div className="text-theme-xs text-gray-600">Due Date: {dueDate ? new Date(dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "— (Paid)"}</div>
              </div>
              <div className={`text-theme-sm font-medium ${statusClass(invoice.status)}`}>Status: {invoice.status}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline">Download PDF</Button>
              <Button variant="outline">Send to Student</Button>
              <Button variant="outline" onClick={addPayment}>Add Payment</Button>
              <Button variant="outline" onClick={markCancelled}>Cancel Invoice</Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Student Billing Details</div>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3 text-theme-sm">
              <div>
                <div className="text-gray-800 dark:text-white/90">{invoice.studentName}</div>
                <div className="text-theme-xs text-gray-600">Email: {invoice.studentEmail || "—"}</div>
                <div className="text-theme-xs text-gray-600">Phone: {invoice.invoiceId === "INV-2025-091" ? "98XXXXXX10" : "—"}</div>
              </div>
              <div>
                <div className="text-theme-xs text-gray-600">Billing Address</div>
                <div className="text-theme-xs text-gray-600">City, State, Zip</div>
              </div>
              <div>
                <div className="text-theme-xs text-gray-600">GSTIN: {invoice.invoiceId === "INV-2025-091" ? "—" : "—"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Invoice Line Items</div>
            <div className="mt-3 space-y-2 text-theme-sm">
              {lineItems.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="text-gray-800 dark:text-white/90">{it.desc}</div>
                  <div className="text-gray-800 dark:text-white/90">₹{it.amount.toLocaleString("en-IN")}</div>
                </div>
              ))}
              <div className="my-2 h-px w-full bg-gray-200 dark:bg-gray-800" />
              <div className="flex items-center justify-between"><div>Subtotal</div><div>₹{subtotal.toLocaleString("en-IN")}</div></div>
              <div className="flex items-center justify-between"><div>GST ({taxPercent}%)</div><div>₹{taxAmt.toLocaleString("en-IN")}</div></div>
              <div className="flex items-center justify-between"><div>Discount</div><div>-₹{discountAmount.toLocaleString("en-IN")}</div></div>
              <div className="my-2 h-px w-full bg-gray-200 dark:bg-gray-800" />
              <div className="flex items-center justify-between font-semibold"><div>Total Amount</div><div>₹{grandTotal.toLocaleString("en-IN")}</div></div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Linked Records</div>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 text-theme-sm">
              <div>Order: {orderCode} <Button variant="outline" onClick={()=>navigate(`/operations/orders/${order?.id || orderCode.replace("#", "ord-")}`)}>View Order</Button></div>
              <div>Enrollment: {order?.itemName?.includes("FAR") ? "CPA US – FAR" : "—"} <Button variant="outline" onClick={()=>navigate(`/enrollments/${order?.enrollmentId || ""}`)}>View Enrollment</Button></div>
              <div>Batch: {batchName || "—"} <Button variant="outline" onClick={()=>navigate(`/batches`)}>View Batch</Button></div>
              <div>Payment ID: {paymentId || "—"} <Button variant="outline">View Gateway Logs</Button></div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Payment Timeline</div>
            <div className="mt-2 space-y-2">
              {timeline.map((a, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-brand-500"></div>
                  <div className="text-theme-sm text-gray-800 dark:text-white/90">{new Date(a.date).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} — {a.text}</div>
                </div>
              ))}
              {timeline.length === 0 && <div className="text-theme-xs text-gray-600">No activity yet</div>}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Notes & Admin Comments</div>
            <div className="mt-2 space-y-2">
              {notes.map((n, idx) => (
                <div key={idx} className="text-theme-xs text-gray-700 dark:text-gray-300">- {n.text}</div>
              ))}
              <div className="mt-3 flex items-center gap-2">
                <input className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-theme-sm dark:border-gray-800" value={newNote} onChange={(e)=>setNewNote(e.target.value)} placeholder="Add note" />
                <Button variant="outline" onClick={addNote}>Add Note</Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">History & Audit</div>
            <div className="mt-2 space-y-2">
              {(() => {
                const hist = readInvoiceHistory(); const arr = hist[invCode] || [];
                return arr.map((h, idx) => (
                  <div key={idx} className="text-theme-xs text-gray-700 dark:text-gray-300">- {h.text} ({new Date(h.date).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })})</div>
                ));
              })()}
            </div>
          </div>
        </div>
      </ComponentCard>
    </>
  );
}
