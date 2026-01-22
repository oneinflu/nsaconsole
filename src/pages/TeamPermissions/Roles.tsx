import { useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";

type Role = {
  id: string;
  name: string;
  description: string;
  members: number;
  permissions: number;
};

function makeRoles(): Role[] {
  return [
    { id: "1", name: "Admin", description: "Full access", members: 3, permissions: 24 },
    { id: "2", name: "Editor", description: "Manage content", members: 8, permissions: 16 },
    { id: "3", name: "Support", description: "Handle tickets", members: 5, permissions: 10 },
    { id: "4", name: "Viewer", description: "Read-only access", members: 12, permissions: 6 },
  ];
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>(() => makeRoles());
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMembers, setNewMembers] = useState<string>("0");
  const [newPerms, setNewPerms] = useState<string>("0");

  const filteredSorted = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let rows = roles.filter((r) =>
      txt ? [r.name, r.description].some((v) => v.toLowerCase().includes(txt)) : true
    );
    if (sortBy) {
      rows = rows.slice().sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
        if (sortBy === "members") return (a.members - b.members) * dir;
        if (sortBy === "permissions") return (a.permissions - b.permissions) * dir;
        return 0;
      });
    }
    return rows;
  }, [roles, search, sortBy, sortDir]);

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
      <PageMeta title="Roles" description="View roles and their stats" />
      <PageBreadcrumb pageTitle="Roles" />
      <ComponentCard title="Roles">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddOpen(true)}>Add New Role</Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder="Search role name or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              options={[
                { value: "", label: "Sort by" },
                { value: "name", label: "Name" },
                { value: "members", label: "Members" },
                { value: "permissions", label: "Permissions" },
              ]}
              defaultValue={sortBy}
              onChange={(v) => {
                setSortBy(v);
                setSortDir("asc");
              }}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      <button className="flex items-center gap-2" onClick={() => toggleSort("name")}>
                        Role {sortBy === "name" && (
                          <span className="text-gray-400">{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Description</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      <button className="flex items-center gap-2" onClick={() => toggleSort("members")}>
                        Members {sortBy === "members" && (
                          <span className="text-gray-400">{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      <button className="flex items-center gap-2" onClick={() => toggleSort("permissions")}>
                        Permissions {sortBy === "permissions" && (
                          <span className="text-gray-400">{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredSorted.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{r.name}</TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{r.description}</TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{r.members}</TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{r.permissions}</TableCell>
                    </TableRow>
                  ))}
                  {filteredSorted.length === 0 && (
                    <TableRow>
                      <TableCell className="px-5 py-6 text-sm text-gray-500">No roles found</TableCell>
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
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Role Name</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Description</label>
                  <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                </div>
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Members</label>
                  <Input type="number" value={newMembers} onChange={(e) => setNewMembers(e.target.value)} />
                </div>
                <div>
                  <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Permissions</label>
                  <Input type="number" value={newPerms} onChange={(e) => setNewPerms(e.target.value)} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    const nextIdNum = Math.max(0, ...roles.map((r) => Number(r.id) || 0)) + 1;
                    const r: Role = {
                      id: String(nextIdNum),
                      name: newName || `Role ${nextIdNum}`,
                      description: newDesc || "",
                      members: Number(newMembers) || 0,
                      permissions: Number(newPerms) || 0,
                    };
                    setRoles((prev) => [r, ...prev]);
                    setIsAddOpen(false);
                    setNewName("");
                    setNewDesc("");
                    setNewMembers("0");
                    setNewPerms("0");
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