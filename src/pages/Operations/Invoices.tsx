import { useEffect, useMemo, useState } from "react";
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
import { useNavigate } from "react-router";
import Switch from "../../components/form/switch/Switch";

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

function seedInvoices(): InvoiceItem[] {
  const now = Date.now();
  return [
    { id: "inv-rahul", invoiceId: "INV-2025-091", studentName: "Rahul Singh", studentEmail: "r@gmail.com", amount: 19999, status: "Paid", date: now - 12*24*3600*1000, orderCode: "#NSA12578", method: "UPI", type: "Auto-generated" },
    { id: "inv-meera", invoiceId: "INV-2025-092", studentName: "Meera Patel", studentEmail: "meera@outlook.com", amount: 79999, status: "Unpaid", date: now - 11*24*3600*1000, orderCode: "#NSA12644", method: "Card", type: "Auto-generated" },
    { id: "inv-peter", invoiceId: "INV-2025-093", studentName: "Peter Johnson", studentEmail: "peter@yahoo.com", amount: 39999, status: "Refunded", date: now - 10*24*3600*1000, orderCode: "#NSA12670", method: "Netbanking", type: "Manual Invoice" },
    { id: "inv-kiran", invoiceId: "INV-2025-094", studentName: "Kiran Kumar", studentEmail: "k@outlook.com", amount: 11999, status: "Overdue", date: now - 9*24*3600*1000, orderCode: "#NSA12685", method: "Razorpay", type: "Renewal Invoice" },
  ];
}

function readInvoices(): InvoiceItem[] {
  try { const raw = localStorage.getItem("invoices"); if (raw) return JSON.parse(raw) as InvoiceItem[]; } catch {}
  return seedInvoices();
}
function writeInvoices(items: InvoiceItem[]) { try { localStorage.setItem("invoices", JSON.stringify(items)); } catch {} }

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [search, setSearch] = useState("");
  const [dateRangePreset, setDateRangePreset] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | InvoiceStatus>("All");
  const [methodFilter, setMethodFilter] = useState<"All" | PaymentMethod>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | InvoiceType>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ start?: number; end?: number }>({});

  const [drawerStudent, setDrawerStudent] = useState<{ name: string; email: string } | null>(null);
  const [drawerStudentQuery, setDrawerStudentQuery] = useState("");
  const [drawerType, setDrawerType] = useState<"Course Invoice" | "Add-on Invoice" | "Custom Invoice">("Course Invoice");
  const [drawerInvId, setDrawerInvId] = useState<string>(`INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*10000)).padStart(4,"0")}`);
  const [drawerInvDate, setDrawerInvDate] = useState<number>(Date.now());
  const [drawerDueDate, setDrawerDueDate] = useState<number | undefined>(undefined);
  const [drawerItems, setDrawerItems] = useState<{ desc: string; qty: number; price: number }[]>([{ desc: "", qty: 1, price: 0 }]);
  const [applyTax, setApplyTax] = useState(false);
  const [taxMode, setTaxMode] = useState<"CGST_SGST" | "IGST">("CGST_SGST");
  const [cgst, setCgst] = useState<number>(9);
  const [sgst, setSgst] = useState<number>(9);
  const [igst, setIgst] = useState<number>(18);
  const [discType, setDiscType] = useState<"Flat" | "Percentage">("Flat");
  const [discValue, setDiscValue] = useState<number>(0);
  const [discReason, setDiscReason] = useState<string>("");
  const [payMark, setPayMark] = useState<"Not Paid" | "Paid Fully" | "Paid Partially">("Not Paid");
  const [payPartialAmount, setPayPartialAmount] = useState<number>(0);
  const [notifyStudent, setNotifyStudent] = useState<boolean>(false);

  useEffect(() => { setInvoices(readInvoices()); }, []);

  const statusOptions = ["Paid","Unpaid","Overdue","Partially Paid","Refunded","Cancelled"].map(s=>({ value: s, label: s }));
  const methodOptions = ["UPI","Card","Netbanking","Cash","Bank","Razorpay","Stripe","Other"].map(m=>({ value: m, label: m }));
  const typeOptions = ["Auto-generated","Manual Invoice","Add-on Invoice","Renewal Invoice"].map(t=>({ value: t, label: t }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const start = customRange.start; const end = customRange.end;
    return invoices.filter(inv => {
      if (q) {
        const t = `${inv.invoiceId} ${inv.studentName} ${inv.studentEmail} ${inv.orderCode}`.toLowerCase();
        if (!t.includes(q)) return false;
      }
      if (statusFilter !== "All" && inv.status !== statusFilter) return false;
      if (methodFilter !== "All" && inv.method !== methodFilter) return false;
      if (typeFilter !== "All" && inv.type !== typeFilter) return false;
      if (dateRangePreset === "Today") { const d = new Date(); d.setHours(0,0,0,0); if (inv.date < d.getTime()) return false; }
      else if (dateRangePreset === "Yesterday") { const d1 = new Date(); d1.setDate(d1.getDate()-1); d1.setHours(0,0,0,0); const d2 = new Date(); d2.setDate(d2.getDate()-1); d2.setHours(23,59,59,999); if (inv.date < d1.getTime() || inv.date > d2.getTime()) return false; }
      else if (dateRangePreset === "This Month") { const d1 = new Date(); d1.setDate(1); d1.setHours(0,0,0,0); if (inv.date < d1.getTime()) return false; }
      else if (dateRangePreset === "Custom") { if (start && inv.date < start) return false; if (end && inv.date > end) return false; }
      return true;
    });
  }, [invoices, search, statusFilter, methodFilter, typeFilter, dateRangePreset, customRange.start, customRange.end]);

  const statusClass = (s: InvoiceStatus) => s === "Paid" ? "text-success-600" : s === "Unpaid" ? "text-gray-600" : s === "Overdue" ? "text-warning-600" : s === "Partially Paid" ? "text-orange-600" : s === "Refunded" ? "text-brand-600" : "text-error-600";

  const markPaid = (id: string) => {
    setInvoices(prev => { const next = prev.map(i => i.id===id ? { ...i, status: "Paid" as InvoiceStatus } : i); writeInvoices(next); return next; });
  };
  const addPayment = (id: string) => {
    setInvoices(prev => { const next = prev.map(i => i.id===id ? { ...i, status: "Partially Paid" as InvoiceStatus } : i); writeInvoices(next); return next; });
  };
  const refundInvoice = (id: string) => {
    setInvoices(prev => { const next = prev.map(i => i.id===id ? { ...i, status: "Refunded" as InvoiceStatus } : i); writeInvoices(next); return next; });
  };
  const cancelInvoice = (id: string) => {
    setInvoices(prev => { const next = prev.map(i => i.id===id ? { ...i, status: "Cancelled" as InvoiceStatus } : i); writeInvoices(next); return next; });
  };
  const duplicateInvoice = (id: string) => {
    const it = invoices.find(x=>x.id===id); if (!it) return;
    const copy: InvoiceItem = { ...it, id: `${it.id}-copy-${Date.now()}`, invoiceId: `${it.invoiceId}-COPY` };
    setInvoices(prev => { const next = [copy, ...prev]; writeInvoices(next); return next; });
  };

  const createInvoice = (base?: Partial<InvoiceItem>) => {
    const subtotal = drawerItems.reduce((sum, it) => sum + (it.qty * (Number.isFinite(it.price) ? it.price : 0)), 0);
    const taxAmt = applyTax ? (taxMode === "CGST_SGST" ? subtotal * ((cgst + sgst)/100) : subtotal * (igst/100)) : 0;
    const discountAmt = discType === "Flat" ? discValue : (subtotal * (discValue/100));
    const grandTotal = Math.max(subtotal + taxAmt - discountAmt, 0);
    const invId = drawerInvId || `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*10000)).padStart(4,"0")}`;
    const statusFromPay: InvoiceStatus = payMark === "Paid Fully" ? "Paid" : payMark === "Paid Partially" ? "Partially Paid" : "Unpaid";
    const mappedType: InvoiceType = drawerType === "Add-on Invoice" ? "Add-on Invoice" : "Manual Invoice";
    const item: InvoiceItem = {
      id: `inv-${Date.now()}`,
      invoiceId: invId,
      studentName: drawerStudent?.name || base?.studentName || "New Student",
      studentEmail: drawerStudent?.email || base?.studentEmail || "",
      amount: Math.round(grandTotal),
      status: statusFromPay,
      date: drawerInvDate || Date.now(),
      orderCode: base?.orderCode,
      method: "Other",
      type: mappedType,
    };
    setInvoices(prev => { const next = [item, ...prev]; writeInvoices(next); return next; });
    setIsCreateOpen(false);
    setDrawerStudent(null);
    setDrawerStudentQuery("");
    setDrawerType("Course Invoice");
    setDrawerInvId(`INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*10000)).padStart(4,"0")}`);
    setDrawerInvDate(Date.now());
    setDrawerDueDate(undefined);
    setDrawerItems([{ desc: "", qty: 1, price: 0 }]);
    setApplyTax(false);
    setTaxMode("CGST_SGST");
    setCgst(9); setSgst(9); setIgst(18);
    setDiscType("Flat"); setDiscValue(0); setDiscReason("");
    setPayMark("Not Paid"); setPayPartialAmount(0); setNotifyStudent(false);
  };

  return (
    <>
      <PageMeta title="Invoices" description="Manage all invoices, tax details, payments, and billing records." />
      <PageBreadcrumb pageTitle="Invoices" />
      <ComponentCard title="Manage all invoices, tax details, payments, and billing records.">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by invoice ID, student, email, course..." />
            </div>
            <div>
              <Select options={[{value:"All",label:"All"},{value:"Today",label:"Today"},{value:"Yesterday",label:"Yesterday"},{value:"This Month",label:"This Month"},{value:"Custom",label:"Custom"}]} defaultValue={dateRangePreset} onChange={(v)=>setDateRangePreset(v as string)} />
            </div>
            <div>
              <Select options={[{value:"All",label:"All"}, ...statusOptions]} defaultValue={statusFilter} onChange={(v)=>setStatusFilter(v as InvoiceStatus)} />
            </div>
            <div>
              <Select options={[{value:"All",label:"All"}, ...methodOptions]} defaultValue={methodFilter} onChange={(v)=>setMethodFilter(v as PaymentMethod)} />
            </div>
            <div>
              <Select options={[{value:"All",label:"All"}, ...typeOptions]} defaultValue={typeFilter} onChange={(v)=>setTypeFilter(v as InvoiceType)} />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">Export</Button>
              <Button onClick={()=>setIsCreateOpen(true)}>+ Create Invoice</Button>
            </div>
          </div>
          {dateRangePreset === "Custom" && (
            <div className="mt-3">
              <DatePicker id="invoice-range" mode="range" onChange={(dates)=>{ const ds = (dates as Date[])[0]; const de = (dates as Date[])[1]; setCustomRange({ start: ds ? ds.getTime() : undefined, end: de ? de.getTime() : undefined }); }} label="" />
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Invoice ID</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Student</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Amount</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Status</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Date</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Order ID</TableCell>
                <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{inv.invoiceId}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm">
                    <div className="text-gray-800 dark:text-white/90">{inv.studentName}</div>
                    <div className="text-theme-xs text-gray-500">{inv.studentEmail}</div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">₹{inv.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="px-5 py-4 text-start"><span className={`font-medium ${statusClass(inv.status)}`}>{inv.status}</span></TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{new Date(inv.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{inv.orderCode || "—"}</TableCell>
                  <TableCell className="relative px-5 py-4 text-start">
                    <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setOpenMenuId((m) => (m === inv.id ? null : inv.id))}>⋮</button>
                    <Dropdown isOpen={openMenuId===inv.id} onClose={() => setOpenMenuId(null)}>
                      <DropdownItem onClick={()=>navigate(`/operations/invoices/${inv.invoiceId}`)}>View Invoice</DropdownItem>
                      <DropdownItem>Download PDF</DropdownItem>
                      <DropdownItem>Email Invoice to Student</DropdownItem>
                      <DropdownItem onClick={()=>markPaid(inv.id)}>Mark as Paid</DropdownItem>
                      <DropdownItem onClick={()=>addPayment(inv.id)}>Add Payment (partial/full)</DropdownItem>
                      <DropdownItem onClick={()=>refundInvoice(inv.id)}>Issue Refund</DropdownItem>
                      <DropdownItem onClick={()=>cancelInvoice(inv.id)}>Cancel Invoice</DropdownItem>
                      <DropdownItem>Edit Invoice Details</DropdownItem>
                      <DropdownItem onClick={()=>navigate(`/operations/orders/${invoices.find(x=>x.id===inv.id)?.orderCode?.replace("#", "ord-") || ""}`)}>View Order</DropdownItem>
                      <DropdownItem>View Logs</DropdownItem>
                      <DropdownItem onClick={()=>duplicateInvoice(inv.id)}>Duplicate Invoice</DropdownItem>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Modal isOpen={isCreateOpen} onClose={()=>setIsCreateOpen(false)} isFullscreen>
          <div className="fixed inset-0 flex justify-end">
            <div className="flex-1" onClick={()=>setIsCreateOpen(false)} />
            <div className="h-full w-full max-w-3xl bg-white shadow-2xl dark:bg-gray-900 animate-[slideIn_0.28s_ease-out]">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={()=>setIsCreateOpen(false)}>←</button>
                  <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Create Invoice</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={()=>setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={()=>createInvoice()}>Create Invoice</Button>
                </div>
              </div>
              <div className="flex h-[calc(100%-64px)] flex-col">
                <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Choose Student</div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <Input value={drawerStudentQuery} onChange={(e)=>setDrawerStudentQuery(e.target.value)} placeholder="Search & Select student by name or email" />
                      </div>
                      <div className="flex items-center"><Button variant="outline" onClick={()=>setDrawerStudent({ name: "New Student", email: "" })}>+ Add New Student</Button></div>
                    </div>
                    <div className="mt-3">
                      {(() => {
                        try {
                          const raw = localStorage.getItem("orders");
                          const orders = raw ? (JSON.parse(raw) as any[]) : [];
                          const uniq: { name: string; email: string }[] = [];
                          orders.forEach(o => {
                            if (!uniq.find(u => u.email === o.studentEmail)) uniq.push({ name: o.studentName, email: o.studentEmail });
                          });
                          const filteredStu = drawerStudentQuery.trim() ? uniq.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(drawerStudentQuery.trim().toLowerCase())) : uniq;
                          return (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {filteredStu.slice(0,6).map((u, idx) => (
                                <button key={idx} className={`rounded-md border px-3 py-2 text-start ${drawerStudent?.email===u.email ? "border-brand-500" : "border-gray-200 dark:border-gray-800"}`} onClick={()=>setDrawerStudent(u)}>
                                  <div className="text-theme-sm text-gray-800 dark:text-white/90">{u.name}</div>
                                  <div className="text-theme-xs text-gray-500">{u.email}</div>
                                </button>
                              ))}
                            </div>
                          );
                        } catch { return null; }
                      })()}
                    </div>
                    <div className="mt-3 text-theme-xs text-gray-600">
                      {drawerStudent ? (
                        (() => {
                          try {
                            const raw = localStorage.getItem("orders");
                            const orders = raw ? (JSON.parse(raw) as any[]) : [];
                            const prev = orders.filter(o => o.studentEmail === drawerStudent.email);
                            const outstanding = prev.filter((o:any) => (o.status !== "Paid" && o.status !== "Refunded" && o.status !== "Failed")).reduce((sum:number, o:any) => sum + (o.pendingAmount ?? Math.max((o.totalPayable ?? o.amount ?? 0) - (o.paidAmount ?? 0), 0)), 0);
                            return <div>Previous orders: {prev.length} · Outstanding dues: ₹{outstanding.toLocaleString("en-IN")}</div>;
                          } catch { return <div>Previous orders: 0 · Outstanding dues: ₹0</div>; }
                        })()
                      ) : (<div>Select a student to view profile preview</div>)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Invoice Details</div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <Select options={[{value:"Course Invoice",label:"Course Invoice"},{value:"Add-on Invoice",label:"Add-on Invoice"},{value:"Custom Invoice",label:"Custom Invoice"}]} defaultValue={drawerType} onChange={(v)=>setDrawerType(v as any)} />
                      </div>
                      <div>
                        <Input value={drawerInvId} onChange={(e)=>setDrawerInvId(e.target.value)} placeholder="Invoice Number" />
                      </div>
                      <div>
                        <DatePicker id="invoice-date" mode="single" onChange={(d)=>{ const dt = (d as Date[])[0]; setDrawerInvDate(dt ? dt.getTime() : Date.now()); }} label="Invoice Date" />
                      </div>
                      <div>
                        <DatePicker id="due-date" mode="single" onChange={(d)=>{ const dt = (d as Date[])[0]; setDrawerDueDate(dt ? dt.getTime() : undefined); }} label="Due Date (optional)" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Line Items</div>
                    <div className="mt-3 overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableCell isHeader className="px-3 py-2 text-start text-theme-xs font-medium text-gray-600">Item</TableCell>
                            <TableCell isHeader className="px-3 py-2 text-start text-theme-xs font-medium text-gray-600">Qty</TableCell>
                            <TableCell isHeader className="px-3 py-2 text-start text-theme-xs font-medium text-gray-600">Unit Price</TableCell>
                            <TableCell isHeader className="px-3 py-2 text-start text-theme-xs font-medium text-gray-600">Total</TableCell>
                            <TableCell isHeader className="px-3 py-2 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {drawerItems.map((it, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="px-3 py-2"><Input value={it.desc} onChange={(e)=>{ const v = e.target.value; setDrawerItems(prev => prev.map((p, i) => i===idx ? { ...p, desc: v } : p)); }} placeholder="Description" /></TableCell>
                              <TableCell className="px-3 py-2"><Input type="number" value={String(it.qty)} onChange={(e)=>{ const v = Math.max(Number(e.target.value||0),1); setDrawerItems(prev => prev.map((p, i) => i===idx ? { ...p, qty: v } : p)); }} placeholder="Qty" /></TableCell>
                              <TableCell className="px-3 py-2"><Input type="number" value={String(it.price)} onChange={(e)=>{ const v = Math.max(Number(e.target.value||0),0); setDrawerItems(prev => prev.map((p, i) => i===idx ? { ...p, price: v } : p)); }} placeholder="Unit Price" /></TableCell>
                              <TableCell className="px-3 py-2 text-theme-sm text-gray-800">₹{(it.qty * (Number.isFinite(it.price) ? it.price : 0)).toLocaleString("en-IN")}</TableCell>
                              <TableCell className="px-3 py-2"><Button variant="outline" onClick={()=>setDrawerItems(prev => prev.filter((_,i)=>i!==idx))}>Remove</Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="outline" onClick={()=>setDrawerItems(prev => [...prev, { desc: "", qty: 1, price: 0 }])}>+ Add Line Item</Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Taxes</div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="text-theme-xs text-gray-600">Apply Tax?</div>
                      <Switch label="" defaultChecked={applyTax} onChange={(c)=>setApplyTax(c)} />
                    </div>
                    {applyTax && (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <Select options={[{value:"CGST_SGST",label:"CGST + SGST"},{value:"IGST",label:"IGST"}]} defaultValue={taxMode} onChange={(v)=>setTaxMode(v as any)} />
                        </div>
                        {taxMode === "CGST_SGST" ? (
                          <>
                            <div><Input type="number" value={String(cgst)} onChange={(e)=>setCgst(Number(e.target.value||0))} placeholder="CGST %" /></div>
                            <div><Input type="number" value={String(sgst)} onChange={(e)=>setSgst(Number(e.target.value||0))} placeholder="SGST %" /></div>
                          </>
                        ) : (
                          <div className="sm:col-span-2"><Input type="number" value={String(igst)} onChange={(e)=>setIgst(Number(e.target.value||0))} placeholder="IGST %" /></div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Coupons & Discounts</div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <Select options={[{value:"Flat",label:"Flat"},{value:"Percentage",label:"Percentage"}]} defaultValue={discType} onChange={(v)=>setDiscType(v as any)} />
                      </div>
                      <div>
                        <Input type="number" value={String(discValue)} onChange={(e)=>setDiscValue(Number(e.target.value||0))} placeholder="Value" />
                      </div>
                      <div className="sm:col-span-3">
                        <Input value={discReason} onChange={(e)=>setDiscReason(e.target.value)} placeholder="Reason (optional)" />
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const subtotal = drawerItems.reduce((sum, it) => sum + (it.qty * (Number.isFinite(it.price) ? it.price : 0)), 0);
                    const taxAmt = applyTax ? (taxMode === "CGST_SGST" ? subtotal * ((cgst + sgst)/100) : subtotal * (igst/100)) : 0;
                    const discountAmt = discType === "Flat" ? discValue : (subtotal * (discValue/100));
                    const grandTotal = Math.max(subtotal + taxAmt - discountAmt, 0);
                    return (
                      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                        <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Final Summary</div>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 text-theme-sm">
                          <div>Subtotal: ₹{subtotal.toLocaleString("en-IN")}</div>
                          <div>Tax: ₹{taxAmt.toLocaleString("en-IN")}</div>
                          <div>Discount: -₹{discountAmt.toLocaleString("en-IN")}</div>
                          <div className="font-semibold">Grand Total: ₹{grandTotal.toLocaleString("en-IN")}</div>
                          {drawerDueDate && (
                            <div className="sm:col-span-2 text-theme-xs text-gray-600">Due Date: {new Date(drawerDueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Actions</div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <Select options={[{value:"Not Paid",label:"Not Paid"},{value:"Paid Fully",label:"Paid Fully"},{value:"Paid Partially",label:"Paid Partially"}]} defaultValue={payMark} onChange={(v)=>setPayMark(v as any)} />
                      </div>
                      {payMark === "Paid Partially" && (
                        <div>
                          <Input type="number" value={String(payPartialAmount)} onChange={(e)=>setPayPartialAmount(Number(e.target.value||0))} placeholder="Partial amount" />
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="text-theme-xs text-gray-600">Notify student by email?</div>
                        <Switch label="" defaultChecked={notifyStudent} onChange={(c)=>setNotifyStudent(c)} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button variant="outline" onClick={()=>setIsCreateOpen(false)}>Cancel</Button>
                      <Button onClick={()=>createInvoice()}>Create Invoice</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        
      </ComponentCard>
    </>
  );
}
