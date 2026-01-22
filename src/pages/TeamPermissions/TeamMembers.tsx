import { useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import Avatar from "../../components/ui/avatar/Avatar";
import { PlusIcon, ChevronDownIcon } from "../../icons";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  joinedOn: string;
};

const roles = ["Admin", "Editor", "Support", "Viewer"];

function makeMembers(count = 24): TeamMember[] {
  const names = [
    "Akash Mehta",
    "Sana Iyer",
    "Rahul Verma",
    "Megha Rao",
    "Ankit Sharma",
    "Neha Kapoor",
    "Vikas Nair",
    "Rhea Dutta",
    "Kunal Joshi",
    "Aisha Khan",
    "Dev Patel",
    "Ira Singh",
  ];
  const out: TeamMember[] = [];
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
    const role = roles[i % roles.length];
    const status = i % 5 === 0 ? "Inactive" : "Active";
    const joinedOn = new Date(Date.now() - i * 86400000).toISOString();
    out.push({ id: String(i + 1), name, email, role, status, joinedOn });
  }
  return out;
}

export default function TeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>(() => makeMembers(48));
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<string>("25");
  const [pageIndex, setPageIndex] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>(roles[0]);
  const [newStatus, setNewStatus] = useState<"Active" | "Inactive">("Active");
  const [showSummary, setShowSummary] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  const filteredSorted = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let rows = members.filter((m) => {
      const matchTxt = txt
        ? [m.name, m.email, m.role].some((v) => v.toLowerCase().includes(txt))
        : true;
      const matchRole = roleFilter ? m.role === roleFilter : true;
      const matchStatus = statusFilter ? m.status === statusFilter : true;
      return matchTxt && matchRole && matchStatus;
    });
    if (sortBy) {
      rows = rows.slice().sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
        if (sortBy === "joinedOn")
          return (
            new Date(a.joinedOn).getTime() - new Date(b.joinedOn).getTime()
          ) * dir;
        if (sortBy === "role") return a.role.localeCompare(b.role) * dir;
        return 0;
      });
    }
    return rows;
  }, [members, search, roleFilter, statusFilter, sortBy, sortDir]);

  const total = filteredSorted.length;
  const pageCount = Math.max(1, Math.ceil(total / Number(pageSize)));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = filteredSorted.slice(
    currentPage * Number(pageSize),
    currentPage * Number(pageSize) + Number(pageSize)
  );

  const toggleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  return (
    <>
      <PageMeta title="Team Members" description="View and manage team members" />
      <PageBreadcrumb pageTitle="Team Members" />
      <ComponentCard title="Team Members">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">Controls</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSummary((v) => !v)} endIcon={<ChevronDownIcon className={`w-4 h-4 transition-transform ${showSummary ? "rotate-180 text-brand-500" : ""}`} />}>Summary</Button>
              <Button variant="outline" onClick={() => setShowFilters((v) => !v)} endIcon={<ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180 text-brand-500" : ""}`} />}>Filters</Button>
              <Button onClick={() => setIsAddOpen(true)} startIcon={<PlusIcon className="w-4 h-4" />}>Add New Team</Button>
            </div>
          </div>
          {showSummary && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Members</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="text-title-sm font-bold text-gray-800 dark:text-white/90">{members.length}</div>
                  <Badge variant="light" color="dark">{new Set(members.map((m) => m.role)).size} roles</Badge>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="text-title-sm font-bold text-gray-800 dark:text-white/90">{members.filter((m) => m.status === "Active").length}</div>
                  <Badge variant="light" color="success">Active</Badge>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="text-sm text-gray-500 dark:text-gray-400">Inactive</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="text-title-sm font-bold text-gray-800 dark:text-white/90">{members.filter((m) => m.status === "Inactive").length}</div>
                  <Badge variant="light" color="error">Inactive</Badge>
                </div>
              </div>
            </div>
          )}
          {showFilters && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Input
                placeholder="Search name, email, role"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0);
                }}
              />
              <Select
                options={[
                  { value: "", label: "Filter by Role" },
                  ...roles.map((r) => ({ value: r, label: r })),
                ]}
                defaultValue={roleFilter}
                onChange={(v) => {
                  setRoleFilter(v);
                  setPageIndex(0);
                }}
              />
              <Select
                options={[
                  { value: "", label: "Filter by Status" },
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ]}
                defaultValue={statusFilter}
                onChange={(v) => {
                  setStatusFilter(v);
                  setPageIndex(0);
                }}
              />
              <Select
                options={[
                  { value: "", label: "Sort by" },
                  { value: "name", label: "Name" },
                  { value: "joinedOn", label: "Joined On" },
                  { value: "role", label: "Role" },
                ]}
                defaultValue={sortBy}
                onChange={(v) => {
                  setSortBy(v);
                  setSortDir("asc");
                }}
              />
              <Select
                options={[
                  { value: "10", label: "10 / page" },
                  { value: "25", label: "25 / page" },
                  { value: "50", label: "50 / page" },
                  { value: "100", label: "100 / page" },
                ]}
                defaultValue={pageSize}
                onChange={(v) => {
                  setPageSize(v);
                  setPageIndex(0);
                }}
              />
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      <button className="flex items-center gap-2" onClick={() => toggleSort("name")}>
                        Member {sortBy === "name" && (
                          <span className="text-gray-400">{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      <button className="flex items-center gap-2" onClick={() => toggleSort("role")}>
                        Role {sortBy === "role" && (
                          <span className="text-gray-400">{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      <button className="flex items-center gap-2" onClick={() => toggleSort("joinedOn")}>
                        Joined {sortBy === "joinedOn" && (
                          <span className="text-gray-400">{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageRows.map((m) => (
                    <TableRow key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                        <div className="flex items-center gap-3">
                          <Avatar src="/images/user/user-01.jpg" size="small" status={m.status === "Active" ? "online" : "offline"} />
                          <div>
                            <div className="font-medium text-gray-800 dark:text-white/90">{m.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{m.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge variant="light" color="info">{m.role}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge variant="light" color={m.status === "Active" ? "success" : "error"}>{m.status}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                        {new Date(m.joinedOn).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pageRows.length === 0 && (
                    <TableRow>
                      <TableCell className="px-5 py-6 text-sm text-gray-500">No team members found</TableCell>
                      <TableCell className="px-5 py-6"><span /></TableCell>
                      <TableCell className="px-5 py-6"><span /></TableCell>
                      <TableCell className="px-5 py-6"><span /></TableCell>
                      <TableCell className="px-5 py-6"><span /></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/[0.05]">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {currentPage + 1} of {pageCount}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
                >
                  Next
                </Button>
              </div>
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
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Role</label>
                  <Select
                    options={[...roles.map((r) => ({ value: r, label: r }))]}
                    defaultValue={newRole}
                    onChange={(v) => setNewRole(v)}
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
                    const nextIdNum = Math.max(0, ...members.map((m) => Number(m.id) || 0)) + 1;
                    const now = new Date().toISOString();
                    const m: TeamMember = {
                      id: String(nextIdNum),
                      name: newName || `Member ${nextIdNum}`,
                      email: newEmail || `member${nextIdNum}@example.com`,
                      role: newRole || roles[0],
                      status: newStatus,
                      joinedOn: now,
                    };
                    setMembers((prev) => [m, ...prev]);
                    setIsAddOpen(false);
                    setNewName("");
                    setNewEmail("");
                    setNewRole(roles[0]);
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