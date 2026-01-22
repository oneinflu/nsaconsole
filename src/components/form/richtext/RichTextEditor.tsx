import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
};

export default function RichTextEditor({ value, onChange, className = "", placeholder = "" }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(editorRef.current?.innerHTML || "");
  };

  const insertImage = () => {
    const url = window.prompt("Image URL") || "";
    if (!url) return;
    exec("insertImage", url);
  };

  const insertLink = () => {
    const url = window.prompt("Link URL") || "";
    if (!url) return;
    exec("createLink", url);
  };

  const insertTable = () => {
    const rows = Number(window.prompt("Rows") || 2);
    const cols = Number(window.prompt("Columns") || 2);
    const cells = Array.from({ length: rows })
      .map(() => `<tr>${Array.from({ length: cols }).map(() => `<td class=\"border border-gray-200 p-2\"></td>`).join("")}</tr>`) 
      .join("");
    const html = `<table class=\"w-full border-collapse text-sm\">${cells}</table>`;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    onChange(editorRef.current?.innerHTML || "");
  };

  return (
    <div className={`rounded-lg border border-gray-300 dark:border-gray-700 ${className}`}>
      <div className="flex flex-wrap gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
        <button type="button" className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-800" onClick={() => exec("bold")}>B</button>
        <button type="button" className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-800" onClick={() => exec("italic")}>I</button>
        <button type="button" className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-800" onClick={() => exec("underline")}>U</button>
        <button type="button" className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-800" onClick={insertLink}>Link</button>
        <button type="button" className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-800" onClick={insertImage}>Image</button>
        <button type="button" className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-800" onClick={insertTable}>Table</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={() => onChange(editorRef.current?.innerHTML || "")}
        className="min-h-32 p-3 text-sm text-gray-800 dark:text-white/90"
        data-placeholder={placeholder}
      />
    </div>
  );
}