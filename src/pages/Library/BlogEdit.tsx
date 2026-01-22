import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import RichTextEditor from "../../components/form/richtext/RichTextEditor";
import Button from "../../components/ui/button/Button";
import FileInput from "../../components/form/input/FileInput";

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
  content?: string;
  tags?: string[];
  h1?: string;
  h2?: string;
  initialContent?: string;
  keyHighlights?: string[];
  sections?: { title: string; content: string }[];
  faqs?: { question: string; answer: string }[];
  coverImage?: string;
};

function readBlogs(): Blog[] {
  try {
    const raw = localStorage.getItem("blogs");
    if (raw) return JSON.parse(raw) as Blog[];
  } catch {}
  return [];
}

function writeBlogs(blogs: Blog[]) {
  try { localStorage.setItem("blogs", JSON.stringify(blogs)); } catch {}
}

export default function BlogEdit() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("Accounting");
  const [status, setStatus] = useState<"Published" | "Draft">("Draft");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [publishedBy, setPublishedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [h1, setH1] = useState("");
  const [h2, setH2] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [keyHighlights, setKeyHighlights] = useState<string[]>([]);
  const [sections, setSections] = useState<{ title: string; content: string }[]>([]);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    const list = readBlogs();
    const b = list.find((x) => x.id === blogId);
    if (b) {
      setTitle(b.title);
      setAuthor(b.author);
      setCategory(b.category);
      setStatus(b.status);
      setSummary(b.summary || "");
      setContent(b.content || "");
      setTags(b.tags || []);
      setPublishedBy(b.publishedBy || "");
      setApprovedBy(b.approvedBy || "");
      setH1(b.h1 || "");
      setH2(b.h2 || "");
      setInitialContent(b.initialContent || "");
      setKeyHighlights(b.keyHighlights || []);
      setSections(b.sections || []);
      setFaqs(b.faqs || []);
      setCoverImage(b.coverImage || "");
    }
    setLoaded(true);
  }, [blogId]);

  const onSave = () => {
    const now = new Date().toISOString();
    const slug = title.trim().toLowerCase().replace(/\s+/g, "-");
    const list = readBlogs();
    const idx = list.findIndex((x) => x.id === blogId);
    if (idx >= 0) {
      const prev = list[idx];
      const updated: Blog = {
        ...prev,
        title: title || prev.title,
        slug: slug || prev.slug,
        author: author || prev.author,
        category,
        status,
        publishedOn: status === "Published" ? prev.publishedOn || now : undefined,
        publishedBy: publishedBy || author || prev.author,
        approvedBy: approvedBy || prev.approvedBy || "Editor Team",
        updatedOn: now,
        summary,
        content,
        tags,
        h1,
        h2,
        initialContent,
        keyHighlights,
        sections,
        faqs,
        coverImage: coverFile ? URL.createObjectURL(coverFile) : coverImage,
      };
      list[idx] = updated;
      writeBlogs(list);
    }
    navigate("/courses/manage-blogs");
  };

  if (!loaded) return null;

  return (
    <>
      <PageMeta title="Edit Blog" description="Edit blog details" />
      <PageBreadcrumb pageTitle="Content Library / Blogs / Edit" />
      <ComponentCard title="Edit Blog">
        <div className="space-y-4">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
            <Select options={[{ value: "Accounting", label: "Accounting" }, { value: "Finance", label: "Finance" }, { value: "Career", label: "Career" }, { value: "Audit", label: "Audit" }]} defaultValue={category} onChange={setCategory} />
          </div>
          <Select options={[{ value: "Draft", label: "Draft" }, { value: "Published", label: "Published" }]} defaultValue={status} onChange={(v) => setStatus(v as "Draft" | "Published")} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="Published By" value={publishedBy} onChange={(e) => setPublishedBy(e.target.value)} />
            <Input placeholder="Approved By" value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} />
          </div>
          <RichTextEditor placeholder="Summary" value={summary} onChange={setSummary} />
          <RichTextEditor placeholder="Content" value={content} onChange={setContent} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="H1" value={h1} onChange={(e) => setH1(e.target.value)} />
            <Input placeholder="H2" value={h2} onChange={(e) => setH2(e.target.value)} />
          </div>
          <RichTextEditor placeholder="Initial Content" value={initialContent} onChange={setInitialContent} />
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Image</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input placeholder="Cover Image URL" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
              <FileInput onChange={(e) => { const f = e.target.files?.[0] || null; setCoverFile(f); if (f) { try { setCoverImage(URL.createObjectURL(f)); } catch {} } }} />
            </div>
            {coverImage && (
              <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                <img src={coverImage} alt="Cover" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Key Highlights</div>
              <Button size="sm" variant="outline" onClick={() => setKeyHighlights((prev) => [...prev, ""])}>Add Point</Button>
            </div>
            <div className="space-y-2">
              {keyHighlights.map((k, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input placeholder={`Point ${idx + 1}`} value={k} onChange={(e) => setKeyHighlights((prev) => prev.map((p, i) => (i === idx ? e.target.value : p)))} />
                  <Button size="sm" variant="outline" onClick={() => setKeyHighlights((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Sections</div>
              <Button size="sm" variant="outline" onClick={() => setSections((prev) => [...prev, { title: "", content: "" }])}>Add Section</Button>
            </div>
            <div className="space-y-4">
              {sections.map((s, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <Input placeholder="Section Title" value={s.title} onChange={(e) => setSections((prev) => prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))} />
                  <div className="mt-2">
                    <RichTextEditor placeholder="Section Content" value={s.content} onChange={(html) => setSections((prev) => prev.map((x, i) => (i === idx ? { ...x, content: html } : x)))} />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => setSections((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">FAQs</div>
              <Button size="sm" variant="outline" onClick={() => setFaqs((prev) => [...prev, { question: "", answer: "" }])}>Add FAQ</Button>
            </div>
            <div className="space-y-4">
              {faqs.map((f, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <Input placeholder="Question" value={f.question} onChange={(e) => setFaqs((prev) => prev.map((x, i) => (i === idx ? { ...x, question: e.target.value } : x)))} />
                  <div className="mt-2">
                    <RichTextEditor placeholder="Answer" value={f.answer} onChange={(html) => setFaqs((prev) => prev.map((x, i) => (i === idx ? { ...x, answer: html } : x)))} />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => setFaqs((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Input placeholder="Tags (comma separated)" value={tags.join(", ")} onChange={(e) => setTags(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate("/courses/manage-blogs")}>Cancel</Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      </ComponentCard>
    </>
  );
}