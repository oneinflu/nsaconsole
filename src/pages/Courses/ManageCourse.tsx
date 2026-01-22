import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import RichTextEditor from "../../components/form/richtext/RichTextEditor";
import FileInput from "../../components/form/input/FileInput";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import { PencilIcon, PlusIcon, MoreDotIcon, AngleRightIcon, AngleDownIcon } from "../../icons";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Modal } from "../../components/ui/modal";
import Select from "../../components/form/Select";

type Status = "Active" | "Draft" | "Hidden";

type CourseItem = {
  id: string;
  name: string;
  slug: string;
  code?: string;
  programId: string;
  programName: string;
  institution: string;
  category: string;
  levelOrPart?: string;
  paper?: string;
  lessons: number;
  shortDescription?: string;
  longDescription?: string;
  courseType?: "Standard Course" | "Single Paper Course" | "Project / Practical Course" | "Module Collection";
  durationWeeks?: number;
  durationHours?: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  language?: string;
  thumbnailName?: string;
  promoVideo?: string;
  attachments?: { name: string; url?: string }[];
  price?: number;
  discountPrice?: number;
  publish?: boolean;
  status: Status;
  order?: number;
  createdAt: number;
  offerTags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoThumbnailName?: string;
  canonicalUrl?: string;
};

function readCourses(): CourseItem[] {
  try {
    const raw = localStorage.getItem("courses");
    if (raw) return JSON.parse(raw) as CourseItem[];
  } catch {}
  return [];
}

function writeCourses(items: CourseItem[]) {
  try { localStorage.setItem("courses", JSON.stringify(items)); } catch {}
}

type Student = { id: string; name: string; email: string; progress: number; completion: number };

export default function ManageCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseItem | null>(null);
  const [tab, setTab] = useState<"overview" | "curriculum" | "pricing" | "attachments" | "students" | "seo">("overview");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const cs = readCourses();
    const found = cs.find((c) => c.id === courseId);
    setCourse(found || null);
  }, [courseId]);

  const headerTitle = course?.name || "Course";
  const subLine = course ? `Program: ${course.programName}   Part: ${course.paper || course.levelOrPart || "—"}` : "";

  const updateCourse = (patch: Partial<CourseItem>) => {
    if (!course) return;
    const next = { ...course, ...patch } as CourseItem;
    setCourse(next);
    const prev = readCourses();
    const arr = prev.map((c) => (c.id === next.id ? next : c));
    writeCourses(arr);
  };

  

  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const studentKey = useMemo(() => `course_students:${courseId}`, [courseId]);
  const [students, setStudents] = useState<Student[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(studentKey);
      if (raw) setStudents(JSON.parse(raw) as Student[]);
      else setStudents([]);
    } catch { setStudents([]); }
  }, [studentKey]);
  useEffect(() => {
    try { localStorage.setItem(studentKey, JSON.stringify(students)); } catch {}
  }, [students, studentKey]);

  return (
    <>
      <PageMeta title={headerTitle} description="Manage course" />
      <PageBreadcrumb pageTitle={headerTitle} />
      <ComponentCard title={headerTitle}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-theme-sm text-gray-600">{subLine}</div>
              <div className="text-theme-xs text-gray-500">Status: {course?.status || "—"}</div>
            </div>
            <div className="relative">
              <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" onClick={() => setMenuOpen((m) => !m)}>
                <MoreDotIcon className="w-4 h-4" />
              </button>
              <Dropdown isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
                <DropdownItem onClick={() => setTab("overview")}>Edit Course</DropdownItem>
                <DropdownItem onClick={() => { if (!course) return; const copy = { ...course, id: `${course.id}-copy-${Date.now()}`, name: `${course.name} Copy`, createdAt: Date.now() }; const prev = readCourses(); const next = [copy, ...prev]; writeCourses(next); }}>Duplicate</DropdownItem>
                <DropdownItem>Move</DropdownItem>
                <DropdownItem>Archive</DropdownItem>
                <DropdownItem onClick={() => { if (!course) return; const ok = window.confirm("Delete this course?"); if (!ok) return; const prev = readCourses(); const next = prev.filter((c) => c.id !== course.id); writeCourses(next); navigate("/programs/courses"); }}>Delete</DropdownItem>
              </Dropdown>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-800">
            {[
              { key: "overview", label: "Overview" },
              { key: "curriculum", label: "Curriculum" },
              { key: "pricing", label: "Pricing" },
              { key: "attachments", label: "Attachments" },
              { key: "students", label: "Students" },
              { key: "seo", label: "SEO" },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key as typeof tab)} className={`rounded-full px-3 py-1 text-theme-xs ${tab === t.key ? "bg-brand-50 text-brand-700" : "hover:bg-gray-100"}`}>{t.label}</button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="text-theme-sm font-semibold">Thumbnail</div>
                  <div className="mt-2 text-theme-xs text-gray-600">{course?.thumbnailName || "No thumbnail"}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <FileInput onChange={(e) => { const f = e.target.files?.[0]; updateCourse({ thumbnailName: f ? f.name : undefined }); }} />
                    <Button variant="outline">Replace Thumbnail</Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="text-theme-sm font-semibold">Summary</div>
                  <div className="mt-2">
                    <Input placeholder="Short description" value={course?.shortDescription || ""} onChange={(e) => updateCourse({ shortDescription: e.target.value })} />
                  </div>
                  <div className="mt-2">
                    <RichTextEditor value={course?.longDescription || ""} onChange={(html) => updateCourse({ longDescription: html })} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4"><div className="text-theme-xs text-gray-600">Duration</div><div className="mt-1 text-theme-sm">{course?.durationWeeks || 0} weeks • {course?.durationHours || 0} hours</div></div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4"><div className="text-theme-xs text-gray-600">Difficulty</div><div className="mt-1 text-theme-sm">{course?.difficulty || "—"}</div></div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4"><div className="text-theme-xs text-gray-600">Language</div><div className="mt-1 text-theme-sm">{course?.language || "—"}</div></div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4"><div className="text-theme-xs text-gray-600">Program Mapping</div><div className="mt-1 text-theme-sm">{course?.programName} • {course?.paper || course?.levelOrPart || "—"}</div></div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4"><div className="text-theme-xs text-gray-600">Last Updated</div><div className="mt-1 text-theme-sm">{new Date(course?.createdAt || Date.now()).toLocaleString()}</div></div>
              </div>
              <div className="flex items-center gap-2">
                <Button startIcon={<PencilIcon className="w-4 h-4" />}>Edit Course</Button>
                <Button variant="outline">Manage Instructor</Button>
              </div>
            </div>
          )}

          {tab === "curriculum" && (
            <CurriculumTab courseId={courseId || ""} />
          )}

          {tab === "pricing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><div className="text-theme-xs text-gray-600">Base Price (INR)</div><Input value={String(course?.price || 0)} onChange={(e) => updateCourse({ price: Number(e.target.value) || 0 })} /></div>
                <div><div className="text-theme-xs text-gray-600">Discounted Price</div><Input value={String(course?.discountPrice || 0)} onChange={(e) => updateCourse({ discountPrice: Number(e.target.value) || 0 })} /></div>
              </div>
              <div>
                <div className="text-theme-xs text-gray-600">Offer Tags</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(["Early Bird", "Combo Offer", "Seasonal"]).map((t) => {
                    const active = (course?.offerTags || []).includes(t);
                    return (
                      <button key={t} className={`rounded-full px-3 py-1 text-theme-xs border ${active ? "border-brand-500 text-brand-700" : "border-gray-300"}`} onClick={() => {
                        const tags = new Set(course?.offerTags || []);
                        if (tags.has(t)) tags.delete(t); else tags.add(t);
                        updateCourse({ offerTags: Array.from(tags) });
                      }}>{t}</button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-2 text-theme-xs text-gray-600">Course Bundles Containing This Course</div>
              <ul className="mt-1 text-theme-xs text-gray-700 list-disc ml-5">
                <li>CPA US Full Prep</li>
                <li>FAR + AUD Combo</li>
              </ul>
            </div>
          )}

          {tab === "attachments" && (
            <div className="space-y-4">
              <div className="text-theme-sm font-semibold">Uploaded Files</div>
              <div className="space-y-2">
                {(course?.attachments || []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center">No attachments</div>
                ) : (
                  (course?.attachments || []).map((a, i) => (
                    <div key={`${a.name}-${i}`} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-theme-xs dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-100">📄</span>
                        <span className="text-gray-700 dark:text-gray-400">{a.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="underline">Open</a> : null}
                        <Button size="sm" variant="outline" onClick={() => updateCourse({ attachments: (course?.attachments || []).filter((_, idx) => idx !== i) })}>Remove</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input placeholder="Name" value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} />
                <Input placeholder="URL (optional)" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} />
              </div>
              <div>
                <Button size="sm" variant="outline" onClick={() => { if (!attachmentName.trim()) return; const next = [ ...(course?.attachments || []), { name: attachmentName.trim(), url: attachmentUrl.trim() || undefined } ]; updateCourse({ attachments: next }); setAttachmentName(""); setAttachmentUrl(""); }}>+ Upload File</Button>
              </div>
            </div>
          )}

          {tab === "students" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-theme-sm font-semibold">Enrolled Students</div>
                <Button size="sm" startIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setStudents((prev) => [...prev, { id: `s-${Date.now()}`, name: "John Doe", email: "john@example.com", progress: 10, completion: 0 }])}>Add</Button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Name</TableCell>
                        <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Email</TableCell>
                        <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Progress</TableCell>
                        <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Completion</TableCell>
                        <TableCell isHeader className="px-5 py-4 text-start text-theme-xs font-medium text-gray-600">Actions</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                      {students.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{s.name}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{s.email}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{s.progress}%</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600">{s.completion}%</TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            <Button size="sm" variant="outline" onClick={() => setStudents((prev) => prev.filter((x) => x.id !== s.id))}>Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {tab === "seo" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><div className="text-theme-xs text-gray-600">Meta Title</div><Input value={course?.seoTitle || ""} onChange={(e) => updateCourse({ seoTitle: e.target.value })} /></div>
                <div><div className="text-theme-xs text-gray-600">Meta Description</div><Input value={course?.seoDescription || ""} onChange={(e) => updateCourse({ seoDescription: e.target.value })} /></div>
                <div><div className="text-theme-xs text-gray-600">Keywords</div><Input value={course?.seoKeywords || ""} onChange={(e) => updateCourse({ seoKeywords: e.target.value })} /></div>
                <div><div className="text-theme-xs text-gray-600">Canonical URL</div><Input value={course?.canonicalUrl || ""} onChange={(e) => updateCourse({ canonicalUrl: e.target.value })} /></div>
              </div>
              <div>
                <div className="text-theme-xs text-gray-600">Social Preview Thumbnail</div>
                <div className="mt-2 flex items-center gap-2">
                  <FileInput onChange={(e) => { const f = e.target.files?.[0]; updateCourse({ seoThumbnailName: f ? f.name : undefined }); }} />
                  <div className="text-theme-xs text-gray-600">{course?.seoThumbnailName || "No file"}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ComponentCard>
    </>
  );
}

type NodeType = "section" | "unit" | "topic" | "lesson";
type TreeNode = { id: string; title: string; type: NodeType; children?: TreeNode[]; duration?: number; content?: string; attachments?: { name: string; url?: string }[]; lessonType?: "Video" | "Text" | "Quiz" | "File-Based" };

function CurriculumTab({ courseId }: { courseId: string }) {
  const storageKey = `curriculum:${courseId}`;
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<number[] | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonType, setLessonType] = useState<"Video" | "Text" | "Quiz" | "File-Based">("Video");
  const [lessonDuration, setLessonDuration] = useState<number>(10);
  const [resName, setResName] = useState("");
  const [resUrl, setResUrl] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setTree(JSON.parse(raw) as TreeNode[]);
      else setTree([]);
    } catch { setTree([]); }
  }, [storageKey]);
  useEffect(() => {
    const id = setInterval(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(tree)); } catch {}
    }, 10000);
    return () => clearInterval(id);
  }, [tree, storageKey]);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(tree)); } catch {}
  }, [tree, storageKey]);

  const counts = useMemo(() => {
    let s = 0, u = 0, t = 0, l = 0, dur = 0;
    const walk = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        if (n.type === "section") s++; else if (n.type === "unit") u++; else if (n.type === "topic") t++; else l++;
        dur += n.duration || 0;
        if (n.children?.length) walk(n.children);
      });
    };
    walk(tree);
    return { sections: s, units: u, topics: t, lessons: l, duration: dur };
  }, [tree]);

  const getNodeAtPath = (path: number[]): { node: TreeNode; parent: TreeNode[]; index: number } | null => {
    let parentList: TreeNode[] = tree;
    let node: TreeNode | undefined;
    for (let i = 0; i < path.length; i++) {
      const idx = path[i];
      node = parentList[idx];
      if (!node) return null;
      if (i < path.length - 1) parentList = node.children || [];
    }
    if (!node) return null;
    return { node, parent: parentList, index: path[path.length - 1] };
  };

  const removeNodeAtPath = (path: number[]): { removed: TreeNode; newTree: TreeNode[] } | null => {
    const clone = structuredClone(tree) as TreeNode[];
    let parentList: TreeNode[] = clone;
    for (let i = 0; i < path.length - 1; i++) {
      const idx = path[i];
      const node = parentList[idx];
      if (!node) return null;
      parentList = node.children = node.children || [];
    }
    const index = path[path.length - 1];
    const [removed] = parentList.splice(index, 1);
    return { removed, newTree: clone };
  };

  const insertNodeAtPath = (parentPath: number[] | null, index: number, node: TreeNode): TreeNode[] => {
    const clone = structuredClone(tree) as TreeNode[];
    let parentList: TreeNode[];
    if (!parentPath || parentPath.length === 0) {
      parentList = clone;
    } else {
      const found = getNodeAtPath(parentPath);
      if (!found) return tree;
      const parentNode = found.node;
      parentNode.children = parentNode.children || [];
      parentList = parentNode.children;
    }
    parentList.splice(index, 0, node);
    return clone;
  };

  const typeForRoot = (): NodeType => "section";
  const convertTypeForParent = (node: TreeNode, parentType: NodeType): NodeType => {
    if (parentType === "section") {
      if (node.type === "section") return "unit";
      if (node.type === "unit" || node.type === "topic" || node.type === "lesson") return node.type;
      return "unit";
    }
    if (parentType === "unit") {
      if (node.type === "section" || node.type === "unit") return "topic";
      if (node.type === "topic" || node.type === "lesson") return node.type;
      return "topic";
    }
    if (parentType === "topic") {
      return "lesson";
    }
    return "lesson";
  };

  const retypeSubtreeForParent = (node: TreeNode, parentType: NodeType): TreeNode => {
    const nextType = parentType === undefined ? typeForRoot() : convertTypeForParent(node, parentType);
    return { ...node, type: nextType, children: node.children?.map((c) => retypeSubtreeForParent(c, nextType)) };
  };

  const moveAsChild = (dragPath: number[], dropPath: number[]) => {
    const removed = removeNodeAtPath(dragPath);
    if (!removed) return;
    let { removed: node, newTree } = removed;
    const clone = structuredClone(newTree) as TreeNode[];
    let parentList: TreeNode[] = clone;
    let parentType: NodeType | undefined = undefined;
    for (let i = 0; i < dropPath.length; i++) {
      const idx = dropPath[i];
      const target = parentList[idx];
      if (!target) break;
      parentType = target.type;
      if (i === dropPath.length - 1) {
        if (parentType === "topic" && node.type === "unit") return;
        node = retypeSubtreeForParent(node, parentType);
        target.children = target.children || [];
        target.children.push(node);
      } else {
        target.children = target.children || [];
        parentList = target.children;
      }
    }
    setTree(clone);
  };

  const moveBefore = (dragPath: number[], dropPath: number[]) => {
    const removed = removeNodeAtPath(dragPath);
    if (!removed) return;
    let { removed: node } = removed;
    const parentPath = dropPath.slice(0, -1);
    const index = dropPath[dropPath.length - 1];
    let parentType: NodeType | undefined = undefined;
    if (parentPath.length > 0) {
      const found = getNodeAtPath(parentPath);
      parentType = found?.node.type;
    }
    node = parentPath.length === 0 ? { ...node, type: typeForRoot() } : retypeSubtreeForParent(node, parentType as NodeType);
    const updated = insertNodeAtPath(parentPath, index, node);
    setTree(updated);
  };

  const moveAfter = (dragPath: number[], dropPath: number[]) => {
    const removed = removeNodeAtPath(dragPath);
    if (!removed) return;
    let { removed: node } = removed;
    const parentPath = dropPath.slice(0, -1);
    const index = dropPath[dropPath.length - 1] + 1;
    let parentType: NodeType | undefined = undefined;
    if (parentPath.length > 0) {
      const found = getNodeAtPath(parentPath);
      parentType = found?.node.type;
    }
    node = parentPath.length === 0 ? { ...node, type: typeForRoot() } : retypeSubtreeForParent(node, parentType as NodeType);
    const updated = insertNodeAtPath(parentPath, index, node);
    setTree(updated);
  };

  const addSection = () => {
    const node: TreeNode = { id: `section-${Date.now()}`, title: "Untitled Section", type: "section", children: [] };
    setTree((prev) => [...prev, node]);
    setSelectedPath([tree.length]);
  };
  const addUnit = () => {
    if (!selectedPath) return;
    const found = getNodeAtPath(selectedPath);
    if (!found) return;
    if (found.node.type !== "section") return;
    const child: TreeNode = { id: `unit-${Date.now()}`, title: "New Unit", type: "unit", children: [] };
    const clone = structuredClone(tree) as TreeNode[];
    let parentList: TreeNode[] = clone;
    for (let i = 0; i < selectedPath.length; i++) {
      const idx = selectedPath[i];
      const n = parentList[idx];
      if (i === selectedPath.length - 1) {
        n.children = n.children || [];
        n.children.push(child);
      } else {
        n.children = n.children || [];
        parentList = n.children;
      }
    }
    setTree(clone);
  };
  const addTopic = () => {
    if (!selectedPath) return;
    const found = getNodeAtPath(selectedPath);
    if (!found) return;
    if (found.node.type !== "section" && found.node.type !== "unit") return;
    const child: TreeNode = { id: `topic-${Date.now()}`, title: "New Topic", type: "topic", children: [] };
    const clone = structuredClone(tree) as TreeNode[];
    let parentList: TreeNode[] = clone;
    for (let i = 0; i < selectedPath.length; i++) {
      const idx = selectedPath[i];
      const n = parentList[idx];
      if (i === selectedPath.length - 1) {
        n.children = n.children || [];
        n.children.push(child);
      } else {
        n.children = n.children || [];
        parentList = n.children;
      }
    }
    setTree(clone);
  };
  const addLesson = () => {
    const child: TreeNode = { id: `lesson-${Date.now()}`, title: "New Lesson", type: "lesson" };
    if (!selectedPath) {
      setTree((prev) => [...prev, { ...child, type: "section" }]);
      return;
    }
    const clone = structuredClone(tree) as TreeNode[];
    let parentList: TreeNode[] = clone;
    for (let i = 0; i < selectedPath.length; i++) {
      const idx = selectedPath[i];
      const n = parentList[idx];
      if (i === selectedPath.length - 1) {
        n.children = n.children || [];
        n.children.push(child);
      } else {
        n.children = n.children || [];
        parentList = n.children;
      }
    }
    setTree(clone);
  };

  const deleteAtPath = (path: number[]) => {
    const found = getNodeAtPath(path);
    const name = found?.node.title || "this item";
    const ok = window.confirm(`Delete ${name}?`);
    if (!ok) return;
    const res = removeNodeAtPath(path);
    if (!res) return;
    setTree(res.newTree);
    setSelectedPath(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "n") addLesson();
      if (e.shiftKey && e.key.toLowerCase() === "s") addSection();
      if (e.key === "Delete" && selectedPath) deleteAtPath(selectedPath);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPath, tree]);

  const ImportPanel = () => {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"merge" | "replace">("merge");
    const [courseOptions, setCourseOptions] = useState<{ id: string; name: string }[]>([]);
    const [fromId, setFromId] = useState<string>("");
    useEffect(() => {
      try {
        const raw = localStorage.getItem("courses");
        const arr = raw ? (JSON.parse(raw) as { id: string; name: string }[]) : [];
        setCourseOptions(arr);
        setFromId(arr[0]?.id || "");
      } catch { setCourseOptions([]); }
    }, []);
    const importNow = () => {
      if (!fromId) return;
      try {
        const raw = localStorage.getItem(`curriculum:${fromId}`);
        const other = raw ? (JSON.parse(raw) as TreeNode[]) : [];
        if (mode === "replace") setTree(other);
        else setTree((prev) => [...prev, ...other]);
        setOpen(false);
      } catch {}
    };
    return (
      <div className="relative">
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>Import from Course</Button>
        <Dropdown isOpen={open} onClose={() => setOpen(false)}>
          <div className="p-3 w-64">
            <div className="text-theme-xs text-gray-600">Select Course</div>
            <Select options={courseOptions.map((c) => ({ value: c.id, label: c.name }))} defaultValue={fromId} onChange={(v: string | number) => setFromId(v as string)} />
            <div className="mt-2 text-theme-xs text-gray-600">Mode</div>
            <div className="flex items-center gap-2 mt-1">
              <Button size="sm" variant={mode === "merge" ? undefined : "outline"} onClick={() => setMode("merge")}>Merge</Button>
              <Button size="sm" variant={mode === "replace" ? undefined : "outline"} onClick={() => setMode("replace")}>Replace</Button>
            </div>
            <div className="mt-3"><Button size="sm" onClick={importNow}>Import Curriculum</Button></div>
          </div>
        </Dropdown>
      </div>
    );
  };

  const PDFPanel = () => {
    const [open, setOpen] = useState(false);
    const [fileName, setFileName] = useState("");
    const autoGenerate = () => {
      if (!fileName) return;
      const draft: TreeNode[] = [
        { id: `section-${Date.now()}`, title: "Section from PDF", type: "section", children: [
          { id: `unit-${Date.now()+1}`, title: "Unit A", type: "unit", children: [
            { id: `topic-${Date.now()+2}`, title: "Topic A1", type: "topic", children: [
              { id: `lesson-${Date.now()+3}`, title: "Lesson 1", type: "lesson" },
              { id: `lesson-${Date.now()+4}`, title: "Lesson 2", type: "lesson" },
            ] },
          ] },
        ] },
      ];
      setTree(draft);
      setOpen(false);
    };
    return (
      <div className="relative">
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>Upload PDF to Auto-Generate</Button>
        <Dropdown isOpen={open} onClose={() => setOpen(false)}>
          <div className="p-3 w-64">
            <div className="text-theme-xs text-gray-600">Syllabus PDF</div>
            <FileInput onChange={(e) => { const f = e.target.files?.[0]; setFileName(f ? f.name : ""); }} />
            <div className="mt-3"><Button size="sm" onClick={autoGenerate}>Generate</Button></div>
          </div>
        </Dropdown>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-3">
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white/80 px-3 py-2 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
          <div className="text-theme-sm font-semibold">Curriculum Builder</div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" startIcon={<PlusIcon className="w-4 h-4" />} onClick={addSection}>Add Section</Button>
            <Button size="sm" variant={selectedPath ? undefined : "outline"} onClick={addUnit}>Add Unit</Button>
            <Button size="sm" variant={selectedPath ? undefined : "outline"} onClick={addTopic}>Add Topic</Button>
            <Button size="sm" variant="outline" onClick={addLesson}>Add Lesson</Button>
            <ImportPanel />
            <PDFPanel />
          </div>
        </div>
        {tree.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <div className="text-3xl">📄</div>
            <div className="mt-2 text-theme-sm">No Curriculum Yet</div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Button startIcon={<PlusIcon className="w-4 h-4" />} onClick={addSection}>Add First Section</Button>
              <ImportPanel />
              <PDFPanel />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-2 text-theme-xs text-gray-600">Drag to reorder or nest. Drop on the item to nest, drop above/below to reorder.</div>
              <ul className="space-y-1">
                {tree.map((node, index) => (
                  <TreeRow
                    key={node.id}
                    node={node}
                    path={[index]}
                    onMoveChild={moveAsChild}
                    onMoveBefore={moveBefore}
                    onMoveAfter={moveAfter}
                    onDelete={deleteAtPath}
                    onToggleCollapse={(id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))}
                    collapsed={!!collapsed[node.id]}
                    collapsedMap={collapsed}
                    onSelect={setSelectedPath}
                    selectedPath={selectedPath}
                    setTree={setTree}
                    tree={tree}
                    openLessonDrawer={(n) => { setLessonTitle(n.title); setLessonContent(n.content || ""); setLessonType(n.lessonType || "Video"); setLessonDuration(n.duration || 10); setIsLessonDrawerOpen(true); setSelectedPath(findPathById(tree, n.id)); }}
                  />
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="text-theme-sm font-semibold">Summary</div>
              <div className="mt-2 space-y-1 text-theme-xs text-gray-700">
                <div>Total Sections: {counts.sections}</div>
                <div>Total Units: {counts.units}</div>
                <div>Total Topics: {counts.topics}</div>
                <div>Total Lessons: {counts.lessons}</div>
                <div>Total Duration: {counts.duration} minutes</div>
                <div>Last Updated: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        )}

        <Modal isOpen={isLessonDrawerOpen} onClose={() => setIsLessonDrawerOpen(false)} isFullscreen>
          <div className="fixed inset-0 flex justify-end">
            <div className="h-full w-full max-w-xl bg-white shadow-2xl dark:bg-gray-900">
              <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-800" onClick={() => setIsLessonDrawerOpen(false)}>←</button>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit Lesson</div>
              </div>
              <div className="flex h-[calc(100%-64px)] flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  <div>
                    <div className="text-theme-xs text-gray-600">Lesson Title</div>
                    <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Content</div>
                    <RichTextEditor value={lessonContent} onChange={setLessonContent} />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <div className="text-theme-xs text-gray-600">Duration (minutes)</div>
                      <Input value={String(lessonDuration)} onChange={(e) => setLessonDuration(Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <div className="text-theme-xs text-gray-600">Lesson Type</div>
                      <Select options={[{ value: "Video", label: "Video" }, { value: "Text", label: "Text" }, { value: "Quiz", label: "Quiz" }, { value: "File-Based", label: "File-Based" }]} defaultValue={lessonType} onChange={(v: string | number) => setLessonType(v as typeof lessonType)} />
                    </div>
                  </div>
                  <div>
                    <div className="text-theme-xs text-gray-600">Attachments</div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input placeholder="Name" value={resName} onChange={(e) => setResName(e.target.value)} />
                      <Input placeholder="URL (optional)" value={resUrl} onChange={(e) => setResUrl(e.target.value)} />
                    </div>
                    <div className="mt-2"><Button size="sm" variant="outline" onClick={() => { if (!resName.trim()) return; const p = selectedPath ? getNodeAtPath(selectedPath)?.node : null; if (!p) return; const clone = structuredClone(tree) as TreeNode[]; const found = locateNodeById(clone, p.id); if (found) { found.attachments = [...(found.attachments || []), { name: resName.trim(), url: resUrl.trim() || undefined }]; setTree(clone); setResName(""); setResUrl(""); } }}>Add Resource</Button></div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsLessonDrawerOpen(false)}>Cancel</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => { if (!selectedPath) return; const clone = structuredClone(tree) as TreeNode[]; let parentList: TreeNode[] = clone; for (let i = 0; i < selectedPath.length; i++) { const idx = selectedPath[i]; const n = parentList[idx]; if (i === selectedPath.length - 1) { n.title = lessonTitle.trim() || n.title; n.content = lessonContent; n.duration = lessonDuration; n.lessonType = lessonType; } else { n.children = n.children || []; parentList = n.children; } } setTree(clone); setIsLessonDrawerOpen(false); }}>Save Lesson</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </DndProvider>
  );
}

function findPathById(nodes: TreeNode[], id: string, parent: number[] = []): number[] | null {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.id === id) return [...parent, i];
    if (n.children) {
      const res = findPathById(n.children, id, [...parent, i]);
      if (res) return res;
    }
  }
  return null;
}

function locateNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const res = locateNodeById(n.children, id);
      if (res) return res;
    }
  }
  return null;
}

function TreeRow({ node, path, onMoveChild, onMoveBefore, onMoveAfter, onDelete, onToggleCollapse, collapsed, collapsedMap, onSelect, selectedPath, setTree, tree, openLessonDrawer }: {
  node: TreeNode;
  path: number[];
  onMoveChild: (dragPath: number[], dropPath: number[]) => void;
  onMoveBefore: (dragPath: number[], dropPath: number[]) => void;
  onMoveAfter: (dragPath: number[], dropPath: number[]) => void;
  onDelete: (path: number[]) => void;
  onToggleCollapse: (id: string) => void;
  collapsed: boolean;
  collapsedMap: Record<string, boolean>;
  onSelect: (path: number[]) => void;
  selectedPath: number[] | null;
  setTree: (updater: (prev: TreeNode[]) => TreeNode[]) => void | ((val: TreeNode[]) => void);
  tree: TreeNode[];
  openLessonDrawer: (node: TreeNode) => void;
}) {
  const elRef = useState<HTMLDivElement | null>(null)[0];
  const [{ isDragging }, drag] = useDrag({ type: "TREE_NODE", item: () => ({ id: node.id, path, node }), collect: (monitor) => ({ isDragging: monitor.isDragging() }) });
  const [{ isOverTop }, dropTop] = useDrop({ accept: "TREE_NODE", drop: (item: any) => onMoveBefore(item.path, path), collect: (monitor) => ({ isOverTop: monitor.isOver() }) });
  const [{ isOverBody }, dropBody] = useDrop({ accept: "TREE_NODE", drop: (item: any) => onMoveChild(item.path, path), collect: (monitor) => ({ isOverBody: monitor.isOver() }) });
  const [{ isOverBottom }, dropBottom] = useDrop({ accept: "TREE_NODE", drop: (item: any) => onMoveAfter(item.path, path), collect: (monitor) => ({ isOverBottom: monitor.isOver() }) });
  const isSelected = selectedPath && JSON.stringify(selectedPath) === JSON.stringify(path);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(node.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const addChild = (type: NodeType) => {
    const child: TreeNode = { id: `${type}-${Date.now()}`, title: `New ${type[0].toUpperCase()}${type.slice(1)}`, type };
    const clone = structuredClone(tree) as TreeNode[];
    let parentList: TreeNode[] = clone;
    for (let i = 0; i < path.length; i++) {
      const idx = path[i];
      const n = parentList[idx];
      if (i === path.length - 1) {
        n.children = n.children || [];
        n.children.push(child);
      } else {
        n.children = n.children || [];
        parentList = n.children;
      }
    }
    setTree(clone as any);
  };
  const duplicate = () => {
    const clone = structuredClone(tree) as TreeNode[];
    const parentPath = path.slice(0, -1);
    let list: TreeNode[] = clone;
    for (let i = 0; i < parentPath.length; i++) {
      const idx = parentPath[i];
      list = list[idx].children || [];
    }
    list.splice(path[path.length - 1] + 1, 0, { ...node, id: `${node.id}-copy-${Date.now()}` });
    setTree(clone as any);
  };
  const commitRename = () => {
    const clone = structuredClone(tree) as TreeNode[];
    let list: TreeNode[] = clone;
    for (let i = 0; i < path.length; i++) {
      const idx = path[i];
      const n = list[idx];
      if (i === path.length - 1) n.title = value.trim() || n.title; else list = n.children || [];
    }
    setTree(clone as any);
    setEditing(false);
  };
  drag(dropBody(dropTop(dropBottom(elRef as any))));
  return (
    <li>
      <div className={`rounded-lg border ${isSelected ? "border-brand-500" : "border-gray-200"} bg-white p-2 transition dark:border-white/[0.06] dark:bg-white/[0.03]`}
        onClick={() => onSelect(path)}>
        <div className="h-2" />
        <div ref={elRef as any} className={`flex items-center gap-2 ${isDragging ? "opacity-50" : "opacity-100"} ${isOverBody ? "bg-brand-50" : ""}`}>
          <button className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-600 hover:bg-gray-100" onClick={() => onToggleCollapse(node.id)}>
            {collapsed ? <AngleRightIcon className="w-3 h-3" /> : <AngleDownIcon className="w-3 h-3" />}
          </button>
          <span className="cursor-grab select-none">⋮⋮</span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-theme-xs capitalize">{node.type}</span>
          {editing ? (
            <input className="flex-1 rounded border px-2 py-1 text-sm" value={value} onChange={(e) => setValue(e.target.value)} onBlur={commitRename} autoFocus />
          ) : (
            <span className="flex-1 text-theme-sm" onDoubleClick={() => setEditing(true)}>{node.title}</span>
          )}
          <div className="relative">
            <button className="dropdown-toggle inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-600 hover:bg-gray-100" onClick={() => setMenuOpen((m) => !m)}>
              <MoreDotIcon className="w-4 h-4" />
            </button>
            <Dropdown isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
              {node.type === "section" && (
                <>
                  <DropdownItem onClick={() => addChild("unit")}>Add Unit</DropdownItem>
                  <DropdownItem onClick={() => addChild("topic")}>Add Topic</DropdownItem>
                  <DropdownItem onClick={() => addChild("lesson")}>Add Lesson</DropdownItem>
                  <DropdownItem onClick={() => setEditing(true)}>Rename Section</DropdownItem>
                </>
              )}
              {node.type === "unit" && (
                <>
                  <DropdownItem onClick={() => addChild("topic")}>Add Topic</DropdownItem>
                  <DropdownItem onClick={() => addChild("lesson")}>Add Lesson</DropdownItem>
                  <DropdownItem onClick={() => setEditing(true)}>Rename Unit</DropdownItem>
                </>
              )}
              {node.type === "topic" && (
                <>
                  <DropdownItem onClick={() => addChild("lesson")}>Add Lesson</DropdownItem>
                  <DropdownItem onClick={() => setEditing(true)}>Rename Topic</DropdownItem>
                </>
              )}
              {node.type === "lesson" && (
                <>
                  <DropdownItem onClick={() => openLessonDrawer(node)}>Edit Lesson</DropdownItem>
                </>
              )}
              <DropdownItem onClick={duplicate}>Duplicate</DropdownItem>
              <DropdownItem onClick={() => onDelete(path)}>Delete</DropdownItem>
            </Dropdown>
          </div>
          <div className="h-2" />
        </div>
        <div className={`h-3 ${isOverTop ? "bg-brand-50" : ""}`} />
        {!collapsed && node.children?.length ? (
          <ul className="ml-6 space-y-1">
            {node.children.map((child, idx) => (
              <TreeRow key={child.id} node={child} path={[...path, idx]} onMoveChild={onMoveChild} onMoveBefore={onMoveBefore} onMoveAfter={onMoveAfter} onDelete={onDelete} onToggleCollapse={onToggleCollapse} collapsed={!!collapsedMap[child.id]} collapsedMap={collapsedMap} onSelect={onSelect} selectedPath={selectedPath} setTree={setTree} tree={tree} openLessonDrawer={openLessonDrawer} />
            ))}
          </ul>
        ) : null}
        <div className={`h-3 ${isOverBottom ? "bg-brand-50" : ""}`} />
      </div>
    </li>
  );
}