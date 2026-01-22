import { useState } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import RichTextEditor from "../../components/form/richtext/RichTextEditor";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
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

export default function BlogAdd() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("Accounting");
  const [status, setStatus] = useState<"Published" | "Draft">("Draft");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [publishedBy, setPublishedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [h1, setH1] = useState("");
  const [h2, setH2] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [keyHighlights, setKeyHighlights] = useState<string[]>([""]);
  const [sections, setSections] = useState<{ title: string; content: string }[]>([{ title: "", content: "" }]);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([{ question: "", answer: "" }]);
  const [coverImage, setCoverImage] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const onSave = () => {
    const id = `blog-${Date.now()}`;
    const slug = title.trim().toLowerCase().replace(/\s+/g, "-");
    const now = new Date().toISOString();
    const blog: Blog = {
      id,
      title: title || "Untitled",
      slug: slug || `untitled-${id}`,
      author: author || "Unknown",
      category,
      status,
      publishedOn: status === "Published" ? now : undefined,
      publishedBy: publishedBy || author || "Unknown",
      approvedBy: approvedBy || "Editor Team",
      updatedOn: now,
      summary,
      content,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      h1,
      h2,
      initialContent,
      keyHighlights: keyHighlights.filter((k) => k.trim().length > 0),
      sections: sections.filter((s) => s.title.trim().length > 0 || s.content.trim().length > 0),
      faqs: faqs.filter((f) => f.question.trim().length > 0 || f.answer.trim().length > 0),
      coverImage: coverFile ? URL.createObjectURL(coverFile) : coverImage,
    };
    const existing = readBlogs();
    writeBlogs([blog, ...existing]);
    navigate("/courses/manage-blogs");
  };

  return (
    <>
      <PageMeta title="Add Blog" description="Create a new blog" />
      <PageBreadcrumb pageTitle="Content Library / Blogs / Add" />
      <ComponentCard title="Add Blog">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-3">
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
            <Input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
            <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate("/courses/manage-blogs")}>Cancel</Button>
              <Button onClick={onSave}>Save</Button>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="flex justify-center lg:justify-end">
              <div className="w-[360px] h-[640px] overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="h-12 flex items-center justify-center border-b border-gray-200 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">Mobile Preview</div>
                {coverImage ? (
                  <img src={coverImage} alt="Cover" className="h-32 w-full object-cover" />
                ) : (
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />
                )}
                <div className="p-4 space-y-2">
                  <div className="text-base font-semibold text-gray-800 line-clamp-2 dark:text-white/90">{h1 || title || "Untitled"}</div>
                  {h2 && (<div className="text-sm text-gray-600 dark:text-gray-400">{h2}</div>)}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{author || "Unknown"}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="light" color="primary">{category}</Badge>
                    {status === "Published" ? (
                      <Badge variant="light" color="success">Published</Badge>
                    ) : (
                      <Badge variant="light" color="warning">Draft</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 line-clamp-3 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: initialContent || summary || "" }} />
                  <div className="mt-2 text-sm text-gray-600 line-clamp-5 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: content || "" }} />
                  {keyHighlights.filter((k) => k.trim()).length > 0 && (
                    <ul className="list-disc pl-5 text-xs text-gray-700 dark:text-gray-300">
                      {keyHighlights.filter((k) => k.trim()).slice(0, 4).map((k, i) => (<li key={i}>{k}</li>))}
                    </ul>
                  )}
                  {sections.filter((s) => s.title.trim() || s.content.trim()).slice(0, 2).map((s, idx) => (
                    <div key={idx} className="mt-2">
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">{s.title || "Section"}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: s.content || "" }} />
                    </div>
                  ))}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : []).slice(0, 3).map((t) => (
                      <Badge key={t} variant="light" color="dark">#{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>
    </>
  );
}