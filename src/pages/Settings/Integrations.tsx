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
import Switch from "../../components/form/switch/Switch";
import MultiSelect from "../../components/form/MultiSelect";

type IntegrationCategory = "Payments" | "CDN" | "Email" | "Video" | "Auth" | "SMS" | "Webhooks" | "Storage" | "Custom";
type Environment = "Production" | "Staging" | "Development";
type TestResult = "pass" | "warn" | "fail";

type IntegrationItem = {
  id: string;
  provider: string;
  label: string;
  category: IntegrationCategory;
  environments: Environment[];
  status: "Active" | "Inactive" | "Test Failed";
  lastTest?: { date: number; result: TestResult };
  tags?: string[];
  roles?: string[];
};

function seedIntegrations(): IntegrationItem[] {
  const now = Date.now();
  return [
    { id: "int-razorpay-primary", provider: "Razorpay", label: "Primary", category: "Payments", environments: ["Production"], status: "Active", lastTest: { date: now - 5*60*1000, result: "pass" } },
    { id: "int-bunny-cdn", provider: "Bunny.net", label: "CDN", category: "CDN", environments: ["Production","Staging"], status: "Active", lastTest: { date: now - 50*60*1000, result: "warn" } },
    { id: "int-smtp-mail", provider: "SMTP", label: "Transactional", category: "Email", environments: ["Production","Development"], status: "Inactive", lastTest: { date: now - 2*24*60*60*1000, result: "fail" } },
    { id: "int-zoom-video", provider: "Zoom", label: "Meetings", category: "Video", environments: ["Staging"], status: "Active", lastTest: { date: now - 15*60*1000, result: "pass" } },
    { id: "int-webhook-generic", provider: "Webhook", label: "Accounting", category: "Webhooks", environments: ["Production","Staging"], status: "Active", lastTest: { date: now - 10*60*1000, result: "pass" } },
  ];
}
function readIntegrations(): IntegrationItem[] {
  try { const raw = localStorage.getItem("integrations"); if (raw) return JSON.parse(raw) as IntegrationItem[]; } catch { void 0 }
  return seedIntegrations();
}
function writeIntegrations(items: IntegrationItem[]) { try { localStorage.setItem("integrations", JSON.stringify(items)); } catch { void 0 }
}

export default function IntegrationsPage() {
  const [items, setItems] = useState<IntegrationItem[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"All" | "Enabled" | "Disabled" | "Needs Attention">("All");
  const [category, setCategory] = useState<"All" | IntegrationCategory>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const [wProvider, setWProvider] = useState<string>("Razorpay");
  const [wEnvProd, setWEnvProd] = useState<boolean>(true);
  const [wEnvStaging, setWEnvStaging] = useState<boolean>(false);
  const [wEnvDev, setWEnvDev] = useState<boolean>(false);
  const [wCloneFrom, setWCloneFrom] = useState<string>("");
  const [wLabel, setWLabel] = useState<string>("");
  const [wTags, setWTags] = useState<string[]>(["payments"]);
  const [wRoles, setWRoles] = useState<string[]>([]);
  const [wFailover, setWFailover] = useState<boolean>(false);
  const [wFallback, setWFallback] = useState<string>("");

  const [wFields, setWFields] = useState<Record<string, string>>({});

  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>("pass");

  useEffect(() => { setItems(readIntegrations()); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(it => {
      if (q) { const t = `${it.provider} ${it.label}`.toLowerCase(); if (!t.includes(q)) return false; }
      if (category !== "All" && it.category !== category) return false;
      if (tab === "Enabled" && it.status !== "Active") return false;
      if (tab === "Disabled" && it.status !== "Inactive") return false;
      if (tab === "Needs Attention" && (it.lastTest?.result || "pass") === "pass") return false;
      return true;
    });
  }, [items, search, tab, category]);

  const statusClass = (s: IntegrationItem["status"]) => s === "Active" ? "text-success-600" : s === "Inactive" ? "text-gray-600" : "text-error-600";
  const testIcon = (r?: TestResult) => r === "pass" ? "✓" : r === "warn" ? "⚠" : r === "fail" ? "✖" : "";

  const testIntegration = (id: string) => {
    const outcomes: TestResult[] = ["pass","warn","fail"]; const result = outcomes[Math.floor(Math.random()*outcomes.length)];
    const now = Date.now();
    setItems(prev => { const next = prev.map(i => i.id===id ? { ...i, lastTest: { date: now, result }, status: (result === "fail" ? ("Test Failed" as IntegrationItem["status"]) : i.status) } : i); writeIntegrations(next); return next; });
    setTestResult(result); setIsTestOpen(true);
  };
  const disableIntegration = (id: string) => { setItems(prev => { const next = prev.map(i => i.id===id ? { ...i, status: ("Inactive" as IntegrationItem["status"]) } : i); writeIntegrations(next); return next; }); };
  const deleteIntegration = (id: string) => { setItems(prev => { const next = prev.filter(i => i.id!==id); writeIntegrations(next); return next; }); };
  const rotateKey = (id: string) => { setItems(prev => { const next = prev.map(i => i.id===id ? { ...i, lastTest: { date: Date.now(), result: i.lastTest?.result || "pass" } } : i); writeIntegrations(next); return next; }); };

  const openWizard = () => { setWizardStep(1); setIsWizardOpen(true); setWProvider("Razorpay"); setWEnvProd(true); setWEnvStaging(false); setWEnvDev(false); setWCloneFrom(""); setWLabel(""); setWTags(["payments"]); setWRoles([]); setWFailover(false); setWFallback(""); setWFields({}); };
  const saveIntegration = () => {
    const envs: Environment[] = []; if (wEnvProd) envs.push("Production"); if (wEnvStaging) envs.push("Staging"); if (wEnvDev) envs.push("Development");
    const cat: IntegrationCategory = wProvider === "Razorpay" ? "Payments" : wProvider === "Bunny.net" ? "CDN" : wProvider === "SMTP" || wProvider === "SendGrid" ? "Email" : wProvider === "Zoom" ? "Video" : wProvider === "Google OAuth" || wProvider === "Firebase" ? "Auth" : wProvider === "AWS S3" ? "Storage" : wProvider === "Webhook" ? "Webhooks" : "Custom";
    const item: IntegrationItem = { id: `int-${Date.now()}`, provider: wProvider, label: wLabel || `${wProvider} Integration`, category: cat, environments: envs, status: "Active", lastTest: { date: Date.now(), result: "pass" }, tags: wTags, roles: wRoles };
    setItems(prev => { const next = [item, ...prev]; writeIntegrations(next); return next; });
    setIsWizardOpen(false);
    testIntegration(item.id);
  };

  return (
    <>
      <PageMeta title="Integrations" description="Add & manage API keys, hostnames, webhooks and test connections." />
      <PageBreadcrumb pageTitle="Settings / Integrations" />
      <ComponentCard title="Add & manage third-party API keys, hostnames, webhooks and test connections.">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Integrations</div>
              <div className="text-theme-xs text-gray-600">Add & manage third-party API keys, hostnames, webhooks and test connections.</div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openWizard}>+ Add Integration</Button>
              <Button variant="outline">Import Integrations</Button>
              <Button variant="outline">Export (encrypted)</Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <button className={`rounded-md border px-3 py-1 text-theme-sm ${tab==="All"?"border-brand-500":"border-gray-200 dark:border-gray-800"}`} onClick={()=>setTab("All")}>All</button>
              <button className={`rounded-md border px-3 py-1 text-theme-sm ${tab==="Enabled"?"border-brand-500":"border-gray-200 dark:border-gray-800"}`} onClick={()=>setTab("Enabled")}>Enabled</button>
              <button className={`rounded-md border px-3 py-1 text-theme-sm ${tab==="Disabled"?"border-brand-500":"border-gray-200 dark:border-gray-800"}`} onClick={()=>setTab("Disabled")}>Disabled</button>
              <button className={`rounded-md border px-3 py-1 text-theme-sm ${tab==="Needs Attention"?"border-brand-500":"border-gray-200 dark:border-gray-800"}`} onClick={()=>setTab("Needs Attention")}>Needs Attention</button>
            </div>
            <div className="flex-1 min-w-[220px]"><Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by provider, name, label..." /></div>
            <div className="min-w-[220px]"><Select options={[{value:"All",label:"All"},{value:"Payments",label:"Payments"},{value:"CDN",label:"CDN"},{value:"Email",label:"Email"},{value:"Video",label:"Video"},{value:"Auth",label:"Auth"},{value:"SMS",label:"SMS"},{value:"Webhooks",label:"Webhooks"},{value:"Storage",label:"Storage"},{value:"Custom",label:"Custom"}]} defaultValue={category} onChange={(v)=>setCategory(v as IntegrationCategory | "All")} /></div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Provider</TableCell>
                  <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Label</TableCell>
                  <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Environments</TableCell>
                  <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Status</TableCell>
                  <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Last test</TableCell>
                  <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(it => (
                  <>
                    <TableRow key={it.id} className="cursor-default">
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{it.provider}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{it.label}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{it.environments.join(" / ")}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm"><span className={`font-medium ${statusClass(it.status)}`}>{it.status}</span></TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{it.lastTest ? `${Math.max(Math.floor((Date.now()-it.lastTest.date)/60000),0)}m ago ${testIcon(it.lastTest.result)}` : "—"}</TableCell>
                      <TableCell className="relative px-5 py-4 text-start">
                        <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={(e) => { e.stopPropagation(); setOpenMenuId((m) => (m === it.id ? null : it.id)); }}>⋮</button>
                        <Dropdown isOpen={openMenuId===it.id} onClose={() => setOpenMenuId(null)}>
                          <DropdownItem onClick={()=>testIntegration(it.id)}>Test</DropdownItem>
                          <DropdownItem onClick={openWizard}>Edit</DropdownItem>
                          <DropdownItem onClick={()=>rotateKey(it.id)}>Rotate Key</DropdownItem>
                          <DropdownItem onClick={()=>setExpandedId(it.id)}>View</DropdownItem>
                          <DropdownItem onClick={()=>disableIntegration(it.id)}>Disable</DropdownItem>
                          <DropdownItem onClick={()=>deleteIntegration(it.id)}>Delete</DropdownItem>
                          <DropdownItem>Logs</DropdownItem>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                    
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {expandedId && (() => { const it = items.find(x=>x.id===expandedId); if (!it) return null; return (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{it.provider} — {it.label}</div>
            <div className="mt-1 text-theme-xs text-gray-600">Category: {it.category} · Environments: {it.environments.join(", ")}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={()=>testIntegration(it.id)}>Test Connection</Button>
              <Button variant="outline" onClick={openWizard}>Edit</Button>
              <Button variant="outline" onClick={()=>rotateKey(it.id)}>Rotate Key</Button>
              <Button variant="outline" onClick={()=>disableIntegration(it.id)}>Disable</Button>
              <Button variant="outline" onClick={()=>deleteIntegration(it.id)}>Delete</Button>
            </div>
          </div>
        ); })()}

        <Modal isOpen={isWizardOpen} onClose={()=>setIsWizardOpen(false)} isFullscreen>
          <div className="fixed inset-0 flex justify-end">
            <div className="flex-1" onClick={()=>setIsWizardOpen(false)} />
            <div className="h-full w-full max-w-3xl bg-white shadow-2xl dark:bg-gray-900 animate-[slideIn_0.28s_ease-out]">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={()=>setIsWizardOpen(false)}>←</button>
                  <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Integration</div>
                </div>
                <div className="flex items-center gap-2">
                  {wizardStep>1 && <Button variant="outline" onClick={()=>setWizardStep(s=>s-1)}>Back</Button>}
                  {wizardStep<6 && <Button onClick={()=>setWizardStep(s=>s+1)}>Next</Button>}
                  {wizardStep===6 && <Button onClick={saveIntegration}>Save & Test</Button>}
                </div>
              </div>
              <div className="flex h-[calc(100%-64px)] flex-col">
                <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
                  {wizardStep===1 && (
                    <div className="space-y-4">
                      <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Choose Provider</div>
                      <Select options={[{value:"Razorpay",label:"Razorpay"},{value:"Bunny.net",label:"Bunny.net"},{value:"Zoom",label:"Zoom"},{value:"SendGrid",label:"SendGrid"},{value:"SMTP",label:"SMTP"},{value:"Google OAuth",label:"Google OAuth"},{value:"AWS S3",label:"AWS S3"},{value:"Firebase",label:"Firebase"},{value:"Webhook",label:"Webhook"},{value:"Custom",label:"Custom / Generic API"}]} defaultValue={wProvider} onChange={(v)=>setWProvider(v as string)} />
                    </div>
                  )}
                  {wizardStep===2 && (
                    <div className="space-y-4">
                      <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Choose Environment(s)</div>
                      <div className="flex items-center gap-4">
                        <Switch label="Production" defaultChecked={wEnvProd} onChange={(c)=>setWEnvProd(c)} />
                        <Switch label="Staging" defaultChecked={wEnvStaging} onChange={(c)=>setWEnvStaging(c)} />
                        <Switch label="Development" defaultChecked={wEnvDev} onChange={(c)=>setWEnvDev(c)} />
                      </div>
                      <div>
                        <Select options={[{value:"",label:"Clone from existing"}, ...items.map(i=>({ value: i.id, label: `${i.provider} — ${i.label}` }))]} defaultValue={wCloneFrom} onChange={(v)=>setWCloneFrom(v as string)} />
                      </div>
                    </div>
                  )}
                  {wizardStep===3 && (
                    <div className="space-y-4">
                      <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Provider-specific fields</div>
                      {wProvider==="Razorpay" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Input placeholder="Key ID" value={wFields["key_id"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, key_id: e.target.value }))} />
                          <Input type="password" placeholder="Key Secret" value={wFields["key_secret"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, key_secret: e.target.value }))} />
                          <Input type="password" placeholder="Webhook Secret" value={wFields["webhook_secret"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, webhook_secret: e.target.value }))} />
                          <Input placeholder="Webhook URL (suggested)" value={wFields["webhook_url"]||"https://example.com/api/webhook/razorpay"} onChange={(e)=>setWFields(prev=>({ ...prev, webhook_url: e.target.value }))} />
                        </div>
                      )}
                      {wProvider==="Bunny.net" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Input type="password" placeholder="API Key" value={wFields["api_key"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, api_key: e.target.value }))} />
                          <Input placeholder="Pull/Storage Zone" value={wFields["zone"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, zone: e.target.value }))} />
                          <Input placeholder="Hostname / CDN Host" value={wFields["host"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, host: e.target.value }))} />
                        </div>
                      )}
                      {wProvider==="SMTP" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <Input placeholder="Host" value={wFields["host"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, host: e.target.value }))} />
                          <Input type="number" placeholder="Port" value={wFields["port"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, port: e.target.value }))} />
                          <Input placeholder="Username" value={wFields["user"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, user: e.target.value }))} />
                          <Input type="password" placeholder="Password" value={wFields["pass"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, pass: e.target.value }))} />
                          <Input placeholder="From Address" value={wFields["from"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, from: e.target.value }))} />
                          <div className="flex items-center gap-3"><div className="text-theme-xs text-gray-600">TLS</div><Switch label="" defaultChecked={Boolean(wFields["tls"]) } onChange={(c)=>setWFields(prev=>({ ...prev, tls: c ? "true" : "" }))} /></div>
                        </div>
                      )}
                      {wProvider==="Webhook" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Input placeholder="Endpoint URL" value={wFields["endpoint"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, endpoint: e.target.value }))} />
                          <Input type="password" placeholder="Secret" value={wFields["secret"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, secret: e.target.value }))} />
                          <Input type="number" placeholder="Retry Count" value={wFields["retry"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, retry: e.target.value }))} />
                          <Select options={[{value:"exponential",label:"Exponential"},{value:"linear",label:"Linear"}]} defaultValue={wFields["backoff"]||"exponential"} onChange={(v)=>setWFields(prev=>({ ...prev, backoff: v as string }))} />
                        </div>
                      )}
                    </div>
                  )}
                  {wizardStep===4 && (
                    <div className="space-y-4">
                      <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Advanced options</div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input placeholder="Optional headers (JSON)" value={wFields["headers"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, headers: e.target.value }))} />
                        <Input placeholder="Custom host" value={wFields["custom_host"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, custom_host: e.target.value }))} />
                        <Input type="number" placeholder="Timeout (ms)" value={wFields["timeout"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, timeout: e.target.value }))} />
                        <Input placeholder="Retry policy" value={wFields["retry_policy"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, retry_policy: e.target.value }))} />
                        <Input placeholder="Whitelisted IPs (comma)" value={wFields["whitelist"]||""} onChange={(e)=>setWFields(prev=>({ ...prev, whitelist: e.target.value }))} />
                        <div className="flex items-center gap-3"><div className="text-theme-xs text-gray-600">Certificate pinning</div><Switch label="" defaultChecked={Boolean(wFields["pinning"]) } onChange={(c)=>setWFields(prev=>({ ...prev, pinning: c ? "true" : "" }))} /></div>
                      </div>
                      <div className="flex items-center gap-3"><div className="text-theme-xs text-gray-600">Enable automatic failover</div><Switch label="" defaultChecked={wFailover} onChange={(c)=>setWFailover(c)} /></div>
                      {wFailover && (
                        <div className="mt-2">
                          <Select options={[{value:"",label:"Select fallback"}, ...items.map(i=>({ value: i.id, label: `${i.provider} — ${i.label}` }))]} defaultValue={wFallback} onChange={(v)=>setWFallback(v as string)} />
                        </div>
                      )}
                    </div>
                  )}
                  {wizardStep===5 && (
                    <div className="space-y-4">
                      <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Labels & Access</div>
                      <Input placeholder="Integration Label" value={wLabel} onChange={(e)=>setWLabel(e.target.value)} />
                      <MultiSelect label="Tags" options={[{value:"payments",text:"payments"},{value:"production",text:"production"},{value:"primary",text:"primary"},{value:"cdn",text:"cdn"},{value:"email",text:"email"},{value:"webhook",text:"webhook"}]} defaultSelected={wTags} onChange={(vals)=>setWTags(vals)} />
                      <MultiSelect label="Roles allowed" options={[{value:"Admin",text:"Admin"},{value:"Manager",text:"Manager"},{value:"Ops",text:"Ops"},{value:"Dev",text:"Dev"}]} defaultSelected={wRoles} onChange={(vals)=>setWRoles(vals)} />
                    </div>
                  )}
                  {wizardStep===6 && (
                    <div className="space-y-4">
                      <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Save & Test</div>
                      <div className="text-theme-xs text-gray-600">Save creates the integration securely and triggers an immediate test.</div>
                      <div className="flex items-center justify-end gap-2">
                        <Button onClick={saveIntegration}>Save & Test</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>

        <Modal isOpen={isTestOpen} onClose={()=>setIsTestOpen(false)} className="w-auto max-w-md">
          <div className="p-6">
            <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Test Connection</div>
            <div className="mt-2 text-theme-sm text-gray-700">Result: {testResult === "pass" ? "Success" : testResult === "warn" ? "Warning" : "Failed"} {testIcon(testResult)}</div>
            <div className="mt-4 flex items-center justify-end"><Button variant="outline" onClick={()=>setIsTestOpen(false)}>Close</Button></div>
          </div>
        </Modal>
      </ComponentCard>
    </>
  );
}
