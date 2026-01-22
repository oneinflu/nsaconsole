import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import { useNavigate } from "react-router";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "../../icons";

type Blog = {
  id: string;
  title: string;
  slug: string;
  author: string;
  category: string;
  status: "Published" | "Draft";
  publishedOn?: string;
  publishedBy?: string;
  approvedBy?: string;
  updatedOn: string;
  summary?: string;
};

function readBlogs(): Blog[] {
  try {
    const raw = localStorage.getItem("blogs");
    if (raw) return JSON.parse(raw) as Blog[];
  } catch {}
  const samples: Blog[] = Array.from({ length: 10 }).map((_, i) => {
    const id = `blog-${i + 1}`;
    const title = [
      "CPA US Exam Guide",
      "CMA US Career Path",
      "ACCA Study Tips",
      "Finance Interview Q&A",
      "Audit Essentials",
      "Tax Planning Basics",
      "Risk Management Overview",
      "Choosing Right Course",
      "Scholarships and Loans",
      "Online Learning Best Practices",
    ][i % 10];
    const author = ["Akash", "Megha", "Rahul", "Sana"][i % 4];
    const category = ["Accounting", "Finance", "Career", "Audit"][i % 4];
    const status = i % 3 === 0 ? "Draft" : "Published";
    const publishedOn = status === "Published" ? new Date(Date.now() - i * 86400000).toISOString() : undefined;
    const publishedBy = ["Akash", "Team Editor", "Megha", "Rahul"][i % 4];
    const approvedBy = ["Admin", "QA", "Sana", "Lead Editor"][i % 4];
    const updatedOn = new Date(Date.now() - i * 43200000).toISOString();
    return { id, title, slug: title.toLowerCase().replace(/\s+/g, "-"), author, category, status, publishedOn, publishedBy, approvedBy, updatedOn, summary: "Short summary of the blog." };
  });
  try { localStorage.setItem("blogs", JSON.stringify(samples)); } catch {}
  return samples;
}

function writeBlogs(blogs: Blog[]) {
  try { localStorage.setItem("blogs", JSON.stringify(blogs)); } catch {}
}

export default function Blogs() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [deleteBlog, setDeleteBlog] = useState<Blog | null>(null);

  useEffect(() => {
    setBlogs(readBlogs());
  }, []);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    return blogs.filter((b) => {
      const matchTxt = txt ? [b.title, b.author, b.category].some((v) => v.toLowerCase().includes(txt)) : true;
      const matchStatus = statusFilter ? b.status === statusFilter : true;
      const matchCat = categoryFilter ? b.category === categoryFilter : true;
      return matchTxt && matchStatus && matchCat;
    });
  }, [blogs, search, statusFilter, categoryFilter]);

  const onConfirmDelete = () => {
    if (!deleteBlog) return;
    setBlogs((prev) => {
      const next = prev.filter((b) => b.id !== deleteBlog.id);
      writeBlogs(next);
      return next;
    });
    setDeleteBlog(null);
  };

  return (
    <>
      <PageMeta title="Manage Blogs" description="Browse and manage all blogs" />
      <PageBreadcrumb pageTitle="Manage Blogs" />
      <ComponentCard title="Blogs">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input placeholder="Search title, author, category" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Select options={[{ value: "", label: "All Status" }, { value: "Published", label: "Published" }, { value: "Draft", label: "Draft" }]} defaultValue={statusFilter} onChange={setStatusFilter} />
              <Select options={[{ value: "", label: "All Categories" }, { value: "Accounting", label: "Accounting" }, { value: "Finance", label: "Finance" }, { value: "Career", label: "Career" }, { value: "Audit", label: "Audit" }]} defaultValue={categoryFilter} onChange={setCategoryFilter} />
            </div>
            <Button onClick={() => navigate("/courses/manage-blogs/new")} startIcon={<PlusIcon className="w-4 h-4" />}>Add Blog</Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Title</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Author</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Category</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Published On</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Published By</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Approved By</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filtered.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{b.title}</TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{b.author}</TableCell>
                      <TableCell className="px-4 py-3 text-start"><Badge variant="light" color="dark">{b.category}</Badge></TableCell>
                      <TableCell className="px-4 py-3 text-start">{b.status === "Published" ? <Badge variant="light" color="success">Published</Badge> : <Badge variant="light" color="warning">Draft</Badge>}</TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{b.publishedOn ? new Date(b.publishedOn).toLocaleDateString() : "-"}</TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{b.publishedBy || b.author || "Unknown"}</TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">{b.approvedBy || "Editor Team"}</TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/courses/manage-blogs/${b.id}/edit`)} startIcon={<PencilIcon className="w-4 h-4" />}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => setDeleteBlog(b)} startIcon={<TrashBinIcon className="w-4 h-4" />}>Delete</Button>
                          <Button size="sm" onClick={() => navigate(`/courses/manage-blogs/${b.id}/edit`)} startIcon={<EyeIcon className="w-4 h-4" />}>View</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </ComponentCard>

      <Modal isOpen={!!deleteBlog} onClose={() => setDeleteBlog(null)} className="max-w-md">
        {deleteBlog && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Delete Blog</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Are you sure you want to delete "{deleteBlog.title}"? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteBlog(null)}>Cancel</Button>
              <Button onClick={onConfirmDelete}>Delete</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}