import { useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";

type College = {
  id: string;
  name: string;
  city: string;
  pocName: string;
  pocEmail: string;
  pocPhone: string;
  status: "Active" | "Inactive";
  addedOn: string;
};

function makeData(count = 5): College[] {
  const names = [
    "Alpha Business School",
    "Beta Commerce College",
    "Gamma Institute of Finance",
    "Delta School of Accounting",
    "Epsilon Academy",
  ];
  const cities = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune"];
  const out: College[] = [];
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    const city = cities[i % cities.length];
    const pocName = [
      "Priya Singh",
      "Arun Mehta",
      "Kiran Rao",
      "Vivek Shah",
      "Sara Khan",
    ][i % 5];
    const pocEmail = `${pocName.toLowerCase().replace(/\s+/g, ".")}@example.com`;
    const pocPhone = `+91 90${String(600000000 + i).slice(0, 8)}`;
    const status = i % 6 === 0 ? "Inactive" : "Active";
    const addedOn = new Date(Date.now() - i * 86400000).toISOString();
    out.push({ id: String(i + 1), name, city, pocName, pocEmail, pocPhone, status, addedOn });
  }
  return out;
}

export default function CollegesView() {
  const [rows, setRows] = useState<College[]>(() => makeData(5));
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPocName, setNewPocName] = useState("");
  const [newPocEmail, setNewPocEmail] = useState("");
  const [newPocPhone, setNewPocPhone] = useState("");
  const [newStatus, setNewStatus] = useState<"Active" | "Inactive">("Active");

  const filteredSorted = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let r = rows.filter((x) => {
      const mt = txt ? [x.name, x.city, x.pocName, x.pocEmail, x.pocPhone].some((v) => v.toLowerCase().includes(txt)) : true;
      const mc = cityFilter ? x.city === cityFilter : true;
      const ms = statusFilter ? x.status === statusFilter : true;
      return mt && mc && ms;
    });
    if (sortBy) {
      r = r.slice().sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
        if (sortBy === "city") return a.city.localeCompare(b.city) * dir;
        if (sortBy === "addedOn") return (new Date(a.addedOn).getTime() - new Date(b.addedOn).getTime()) * dir;
        return 0;
      });
    }
    return r;
  }, [rows, search, cityFilter, statusFilter, sortBy, sortDir]);

  return (
    <>
      <PageMeta title="Colleges" description="Browse and view colleges" />
      <PageBreadcrumb pageTitle="Colleges" />
      <ComponentCard title="Colleges">
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setIsAddOpen(true)}>Add College</Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input placeholder="Search name, city, POC" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select
              options={[{ value: "", label: "Filter by City" }, ...Array.from(new Set(rows.map((x) => x.city))).map((d) => ({ value: d, label: d }))]}
              defaultValue={cityFilter}
              onChange={(v) => setCityFilter(v)}
            />
            <Select
              options={[{ value: "", label: "Filter by Status" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]}
              defaultValue={statusFilter}
              onChange={(v) => setStatusFilter(v)}
            />
            <Select
              options={[{ value: "", label: "Sort by" }, { value: "name", label: "Name" }, { value: "city", label: "City" }, { value: "addedOn", label: "Added On" }]}
              defaultValue={sortBy}
              onChange={(v) => { setSortBy(v); setSortDir("asc"); }}
            />
            <Select
              options={[{ value: "10", label: "10 / page" }, { value: "25", label: "25 / page" }, { value: "50", label: "50 / page" }]}
              defaultValue={"25"}
              onChange={() => {}}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Name</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">City</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">POC Name</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">POC Email</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">POC Phone</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Added On</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredSorted.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{c.name}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{c.city}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{c.pocName}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{c.pocEmail}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{c.pocPhone}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{c.status === "Active" ? <Badge variant="light" color="success">Active</Badge> : <Badge variant="light" color="error">Inactive</Badge>}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{new Date(c.addedOn).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredSorted.length === 0 && (
                    <TableRow>
                      <TableCell className="px-5 py-6 text-sm text-gray-500">No colleges found</TableCell>
                      <TableCell className="px-5 py-6"><span /></TableCell>
                      <TableCell className="px-5 py-6"><span /></TableCell>
                      <TableCell className="px-5 py-6"><span /></TableCell>
                      <TableCell className="px-5 py-6"><span /></TableCell>
                      <TableCell className="px-5 py-6"><span /></TableCell>
                      <TableCell className="px-5 py-6"><span /></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
            <div className="px-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">College Name</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">City</label>
                  <Select
                    options={[
                      ...Array.from(new Set(rows.map((x) => x.city))).map((d) => ({ value: d, label: d })),
                    ]}
                    defaultValue={newCity}
                    onChange={(v) => setNewCity(v)}
                  />
                </div>
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">POC Name</label>
                  <Input value={newPocName} onChange={(e) => setNewPocName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">POC Email</label>
                  <Input value={newPocEmail} onChange={(e) => setNewPocEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">POC Phone</label>
                  <Input value={newPocPhone} onChange={(e) => setNewPocPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Status</label>
                  <Select
                    options={[
                      { value: "Active", label: "Active" },
                      { value: "Inactive", label: "Inactive" },
                    ]}
                    defaultValue={newStatus}
                    onChange={(v) => setNewStatus(v as "Active" | "Inactive")}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    const nextIdNum = Math.max(0, ...rows.map((r) => Number(r.id) || 0)) + 1;
                    const c: College = {
                      id: String(nextIdNum),
                      name: newName || `College ${nextIdNum}`,
                      city: newCity || (rows[0]?.city || "Mumbai"),
                      pocName: newPocName || "POC",
                      pocEmail: newPocEmail || `poc${nextIdNum}@example.com`,
                      pocPhone: newPocPhone || `+91 90${String(600000000 + nextIdNum).slice(0, 8)}`,
                      status: newStatus,
                      addedOn: new Date().toISOString(),
                    };
                    setRows((prev) => [c, ...prev]);
                    setIsAddOpen(false);
                    setNewName("");
                    setNewCity("");
                    setNewPocName("");
                    setNewPocEmail("");
                    setNewPocPhone("");
                    setNewStatus("Active");
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </ComponentCard>
    </>
  );
}