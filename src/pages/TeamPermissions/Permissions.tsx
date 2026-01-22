import { useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { ChevronDownIcon } from "../../icons";

type Permission = {
  id: string;
  key: string;
  name: string;
  category: string;
  description: string;
};

const categories = ["Blogs", "Users", "Courses", "Payments", "Support", "Operations"];

function makePermissions(): Permission[] {
  const base: Permission[] = [
    { id: "b1", key: "blogs.view", name: "View Blogs", category: "Blogs", description: "View blog list" },
    { id: "b2", key: "blogs.create", name: "Create Blogs", category: "Blogs", description: "Create new blog" },
    { id: "b3", key: "blogs.edit", name: "Edit Blogs", category: "Blogs", description: "Edit blog content" },
    { id: "b4", key: "blogs.delete", name: "Delete Blogs", category: "Blogs", description: "Delete blog" },
    { id: "1", key: "users.view", name: "View Users", category: "Users", description: "View user profiles" },
    { id: "2", key: "users.manage", name: "Manage Users", category: "Users", description: "Create and edit users" },
    { id: "3", key: "courses.view", name: "View Courses", category: "Courses", description: "View course catalog" },
    { id: "4", key: "courses.manage", name: "Manage Courses", category: "Courses", description: "Create and edit courses" },
    { id: "5", key: "payments.view", name: "View Payments", category: "Payments", description: "View transactions and payouts" },
    { id: "6", key: "support.manage", name: "Manage Support", category: "Support", description: "Handle tickets and categories" },
    { id: "7", key: "operations.manage", name: "Manage Operations", category: "Operations", description: "Couriers and referrals" },
  ];
  return base;
}

export default function Permissions() {
  const [perms] = useState<Permission[]>(() => makePermissions());
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const filteredSorted = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let rows = perms.filter((p) => {
      const matchTxt = txt
        ? [p.key, p.name, p.description].some((v) => v.toLowerCase().includes(txt))
        : true;
      const matchCat = catFilter ? p.category === catFilter : true;
      return matchTxt && matchCat;
    });
    if (sortBy) {
      rows = rows.slice().sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
        if (sortBy === "key") return a.key.localeCompare(b.key) * dir;
        if (sortBy === "category") return a.category.localeCompare(b.category) * dir;
        return 0;
      });
    }
    return rows;
  }, [perms, search, catFilter, sortBy, sortDir]);


  return (
    <>
      <PageMeta title="Permissions" description="View available permissions" />
      <PageBreadcrumb pageTitle="Permissions" />
      <ComponentCard title="Permissions">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Search by key, name, description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              options={[
                { value: "", label: "Filter by Category" },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
              defaultValue={catFilter}
              onChange={(v) => setCatFilter(v)}
            />
            <Select
              options={[
                { value: "", label: "Sort by" },
                { value: "name", label: "Name" },
                { value: "key", label: "Key" },
                { value: "category", label: "Category" },
              ]}
              defaultValue={sortBy}
              onChange={(v) => {
                setSortBy(v);
                setSortDir("asc");
              }}
            />
          </div>

          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              onClick={() => {
                const visible = categories.filter((c) => filteredSorted.some((p) => p.category === c));
                const next: Record<string, boolean> = {};
                visible.forEach((c) => (next[c] = true));
                setOpenGroups(next);
              }}
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const visible = categories.filter((c) => filteredSorted.some((p) => p.category === c));
                const next: Record<string, boolean> = {};
                visible.forEach((c) => (next[c] = false));
                setOpenGroups(next);
              }}
              className="ml-2"
            >
              Collapse All
            </Button>
          </div>

          {categories
            .filter((cat) => filteredSorted.some((p) => p.category === cat))
            .map((cat) => {
              const group = filteredSorted.filter((p) => p.category === cat);
              return (
                <div key={cat} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/[0.05]">
                    <button
                      onClick={() => setOpenGroups((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                      className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-white/90"
                    >
                      {cat}
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${openGroups[cat] ? "rotate-180 text-brand-500" : ""}`} />
                    </button>
                    <Badge variant="light" color="dark">{group.length}</Badge>
                  </div>
                  {openGroups[cat] && (
                  <div className="max-w-full overflow-x-auto">
                    <Table>
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Key</TableCell>
                          <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Name</TableCell>
                          <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Description</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {group.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{p.key}</TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{p.name}</TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{p.description}</TableCell>
                          </TableRow>
                        ))}
                        {group.length === 0 && (
                          <TableRow>
                            <TableCell className="px-5 py-6 text-sm text-gray-500">No permissions</TableCell>
                            <TableCell className="px-5 py-6"><span /></TableCell>
                            <TableCell className="px-5 py-6"><span /></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  )}
                </div>
              );
            })}
        </div>
      </ComponentCard>
    </>
  );
}