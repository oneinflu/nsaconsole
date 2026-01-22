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

type Faculty = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  courses: string[];
  status: "Active" | "Inactive";
  joinedOn: string;
};

function makeData(count = 5): Faculty[] {
  const names = [
    "Dr. Ananya Rao",
    "Prof. Rohan Kapoor",
    "Dr. Neha Verma",
    "Prof. Kabir Joshi",
    "Dr. Saanvi Iyer",
    "Prof. Arjun Nair",
    "Dr. Meera Desai",
    "Prof. Advait Gupta",
  ];
  const depts = ["Accounting", "Finance", "Audit", "Taxation", "Economics"];
  const designations = [
    "Associate Professor",
    "Assistant Professor",
    "Professor",
    "Lecturer",
    "Adjunct",
  ];
  const coursePool = ["CPA US", "CMA US", "ACCA", "US GAAP", "Taxation Basics", "Audit Essentials"];
  const out: Faculty[] = [];
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
    const phone = `+91 98${String(700000000 + i).slice(0, 8)}`;
    const department = depts[i % depts.length];
    const designation = designations[i % designations.length];
    const courses = [coursePool[i % coursePool.length], coursePool[(i + 2) % coursePool.length]];
    const status = i % 7 === 0 ? "Inactive" : "Active";
    const joinedOn = new Date(Date.now() - i * 86400000).toISOString();
    out.push({ id: String(i + 1), name, email, phone, department, designation, courses, status, joinedOn });
  }
  return out;
}

export default function FacultyView() {
  const [rows, setRows] = useState<Faculty[]>(() => makeData(5));
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDept, setNewDept] = useState<string>("");
  const [newStatus, setNewStatus] = useState<"Active" | "Inactive">("Active");

  const filteredSorted = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let r = rows.filter((x) => {
      const mt = txt ? [x.name, x.email, x.phone, x.department].some((v) => v.toLowerCase().includes(txt)) : true;
      const md = deptFilter ? x.department === deptFilter : true;
      const ms = statusFilter ? x.status === statusFilter : true;
      return mt && md && ms;
    });
    if (sortBy) {
      r = r.slice().sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
        if (sortBy === "department") return a.department.localeCompare(b.department) * dir;
        if (sortBy === "joinedOn") return (new Date(a.joinedOn).getTime() - new Date(b.joinedOn).getTime()) * dir;
        return 0;
      });
    }
    return r;
  }, [rows, search, deptFilter, statusFilter, sortBy, sortDir]);

  return (
    <>
      <PageMeta title="Faculty" description="Browse and view faculty" />
      <PageBreadcrumb pageTitle="Faculty" />
      <ComponentCard title="Faculty">
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setIsAddOpen(true)}>Add Faculty</Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input placeholder="Search name, email, phone, department" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select
              options={[{ value: "", label: "Filter by Department" }, ...Array.from(new Set(rows.map((x) => x.department))).map((d) => ({ value: d, label: d }))]}
              defaultValue={deptFilter}
              onChange={(v) => setDeptFilter(v)}
            />
            <Select
              options={[{ value: "", label: "Filter by Status" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]}
              defaultValue={statusFilter}
              onChange={(v) => setStatusFilter(v)}
            />
            <Select
              options={[{ value: "", label: "Sort by" }, { value: "name", label: "Name" }, { value: "department", label: "Department" }, { value: "joinedOn", label: "Joined On" }]}
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
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Email</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Phone</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Department</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Designation</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Courses</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Joined On</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredSorted.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{f.name}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{f.email}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{f.phone}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{f.department}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{f.designation}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-wrap gap-2">
                          {f.courses.map((c, idx) => (
                            <Badge key={`${f.id}-c-${idx}`} variant="light" color="info">{c}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">{f.status === "Active" ? <Badge variant="light" color="success">Active</Badge> : <Badge variant="light" color="error">Inactive</Badge>}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{new Date(f.joinedOn).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredSorted.length === 0 && (
                    <TableRow>
                      <TableCell className="px-5 py-6 text-sm text-gray-500">No faculty found</TableCell>
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
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Name</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Email</label>
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Phone</label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Department</label>
                  <Select
                    options={[
                      ...Array.from(new Set(rows.map((x) => x.department))).map((d) => ({ value: d, label: d })),
                    ]}
                    defaultValue={newDept}
                    onChange={(v) => setNewDept(v)}
                  />
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
                    const f: Faculty = {
                      id: String(nextIdNum),
                      name: newName || `Faculty ${nextIdNum}`,
                      email: newEmail || `faculty${nextIdNum}@example.com`,
                      phone: newPhone || `+91 98${String(700000000 + nextIdNum).slice(0, 8)}`,
                      department: newDept || (rows[0]?.department || "Accounting"),
                      designation: rows[0]?.designation || "Assistant Professor",
                      courses: rows[0]?.courses || ["CPA US"],
                      status: newStatus,
                      joinedOn: new Date().toISOString(),
                    };
                    setRows((prev) => [f, ...prev]);
                    setIsAddOpen(false);
                    setNewName("");
                    setNewEmail("");
                    setNewPhone("");
                    setNewDept("");
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