import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import FileInput from "../../components/form/input/FileInput";
import { PlusIcon, CheckCircleIcon, CloseLineIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { useNavigate } from "react-router";

type Course = {
  id: string;
  name: string;
  category: string;
  logo: string;
  hackdoc?: boolean;
  prospectus?: boolean;
  roadmap?: boolean;
};

export default function ManageCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([
    { id: "cpa-us", name: "CPA US", category: "Accounting & Finance", logo: "/images/logo/logo.png" },
    { id: "cma-us", name: "CMA US", category: "Accounting & Finance", logo: "/images/logo/logo.png" },
    { id: "acca", name: "ACCA", category: "Accounting & Finance", logo: "/images/logo/logo.png" },
    { id: "ea", name: "EA", category: "Taxation", logo: "/images/logo/logo.png" },
    { id: "cia", name: "CIA", category: "Audit", logo: "/images/logo/logo.png" },
    { id: "cfa", name: "CFA", category: "Finance", logo: "/images/logo/logo.png" },
    { id: "frm", name: "FRM", category: "Risk Management", logo: "/images/logo/logo.png" },
  ]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCourse, setNewCourse] = useState<Course>({ id: "", name: "", category: "Accounting & Finance", logo: "/images/logo/logo.png", hackdoc: false, prospectus: false, roadmap: false });
  const [hackdocFile, setHackdocFile] = useState<File | null>(null);
  const [prospectusFile, setProspectusFile] = useState<File | null>(null);
  const [roadmapFile, setRoadmapFile] = useState<File | null>(null);


  const goStructure = (course: Course) => {
    navigate(`/courses/${course.id}/structure`, { state: { name: course.name } });
  };

  const onEdit = (course: Course) => {
    alert(`Edit ${course.name}`);
  };

  const onDelete = (id: string) => {
    const ok = window.confirm("Delete this course?");
    if (!ok) return;
    setCourses((prev) => {
      const toDelete = prev.find((c) => c.id === id);
      if (toDelete && typeof toDelete.logo === "string" && toDelete.logo.startsWith("blob:")) {
        try { URL.revokeObjectURL(toDelete.logo); } catch {}
      }
      return prev.filter((c) => c.id !== id);
    });
  };

  const openAdd = () => {
    setNewCourse({ id: "", name: "", category: "Accounting & Finance", logo: "/images/logo/logo.png", hackdoc: false, prospectus: false, roadmap: false });
    setHackdocFile(null);
    setProspectusFile(null);
    setRoadmapFile(null);
    setIsAddOpen(true);
  };

  const closeAdd = () => {
    setIsAddOpen(false);
  };

  const saveAdd = () => {
    const id = newCourse.name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!newCourse.name.trim()) return;
    const course: Course = {
      ...newCourse,
      id,
      hackdoc: !!hackdocFile,
      prospectus: !!prospectusFile,
      roadmap: !!roadmapFile,
    };
    setCourses((prev) => [course, ...prev]);
    setIsAddOpen(false);
  };

  return (
    <>
      <PageMeta title="Manage Courses" description="View and manage all courses." />
      <PageBreadcrumb pageTitle="Manage Courses" />
      <ComponentCard title="Courses">
        <div className="flex justify-end px-4 sm:px-0">
          <Button onClick={openAdd} startIcon={<PlusIcon className="w-4 h-4" />}>Add Course</Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Logo</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Course Name</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Category</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Hackdoc</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Prospectus</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Roadmap</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="w-10 h-10 overflow-hidden rounded-full">
                        <img width={40} height={40} src={course.logo} alt={course.name} className="object-cover" />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90">{course.name}</TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{course.category}</TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      {(() => {
                        const okNames = ["CPA US", "CMA US", "ACCA", "EA"];
                        const ok = okNames.includes(course.name);
                        return ok ? (
                          <span className="text-success-500 inline-flex items-center"><CheckCircleIcon className="w-5 h-5" /></span>
                        ) : (
                          <span className="text-error-500 inline-flex items-center"><CloseLineIcon className="w-5 h-5" /></span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      {(() => {
                        const okNames = ["CPA US", "CMA US", "ACCA", "EA"];
                        const ok = okNames.includes(course.name);
                        return ok ? (
                          <span className="text-success-500 inline-flex items-center"><CheckCircleIcon className="w-5 h-5" /></span>
                        ) : (
                          <span className="text-error-500 inline-flex items-center"><CloseLineIcon className="w-5 h-5" /></span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      {(() => {
                        const okNames = ["CPA US", "CMA US", "ACCA", "EA"];
                        const ok = okNames.includes(course.name);
                        return ok ? (
                          <span className="text-success-500 inline-flex items-center"><CheckCircleIcon className="w-5 h-5" /></span>
                        ) : (
                          <span className="text-error-500 inline-flex items-center"><CloseLineIcon className="w-5 h-5" /></span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => goStructure(course)}>Manage Course Structure</Button>
                        <Button size="sm" variant="outline" onClick={() => onEdit(course)} startIcon={<PencilIcon className="w-4 h-4" />}>Edit</Button>
                        <Button size="sm" onClick={() => onDelete(course.id)} startIcon={<TrashBinIcon className="w-4 h-4" />}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ComponentCard>

      <Modal isOpen={isAddOpen} onClose={closeAdd} className="max-w-xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Course</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Course Name</label>
              <input
                value={newCourse.name}
                onChange={(e) => setNewCourse((c) => ({ ...c, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <div>
              <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Category</label>
              <select
                value={newCourse.category}
                onChange={(e) => setNewCourse((c) => ({ ...c, category: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
              >
                <option>Accounting & Finance</option>
                <option>Taxation</option>
                <option>Audit</option>
                <option>Finance</option>
                <option>Risk Management</option>
              </select>
            </div>
            <div>
              <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Logo URL</label>
              <input
                value={newCourse.logo}
                onChange={(e) => setNewCourse((c) => ({ ...c, logo: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <div>
              <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Hackdoc</label>
              <FileInput onChange={(e) => setHackdocFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Prospectus</label>
              <FileInput onChange={(e) => setProspectusFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-theme-xs text-gray-600 dark:text-gray-400">Roadmap</label>
              <FileInput onChange={(e) => setRoadmapFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={closeAdd}>Cancel</Button>
            <Button onClick={saveAdd}>Save</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}