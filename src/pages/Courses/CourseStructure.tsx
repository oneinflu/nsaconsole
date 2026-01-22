import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import InputField from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { PlusIcon, PencilIcon, AngleRightIcon, AngleDownIcon, TrashBinIcon } from "../../icons";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type NodeType = "section" | "unit" | "module";
type TreeNode = {
  id: string;
  title: string;
  type: NodeType;
  children?: TreeNode[];
};

type DragItem = {
  id: string;
  path: number[];
  node: TreeNode;
};

const ITEM_TYPE = "TREE_NODE";

type PaperRef = { id: string; name: string };
type LevelRef = { id: string; name: string; papers: PaperRef[] };
type ProgramRef = { id: string; name: string; levels?: LevelRef[]; papers?: PaperRef[] };
type CategoryRef = { id: string; name: string; programs: ProgramRef[] };

function CourseStructure() {
  const { courseId } = useParams();
  const location = useLocation() as { state?: { name?: string } };
  const defaultProgramName = location.state?.name || (courseId || "").replace(/-/g, " ").toUpperCase();

  const catalog: CategoryRef[] = [
    {
      id: "accountancy",
      name: "Accountancy",
      programs: [
        {
          id: "cpa-us",
          name: "CPA US",
          papers: [
            { id: "audit", name: "Audit" },
            { id: "financial", name: "Financial" },
            { id: "regulation", name: "Regulation" },
            { id: "discipline", name: "Discipline" },
          ],
        },
        {
          id: "acca",
          name: "ACCA",
          levels: [
            { id: "level-1", name: "Applied Knowledge", papers: [
              { id: "ak-1", name: "Paper 1" },
              { id: "ak-2", name: "Paper 2" },
              { id: "ak-3", name: "Paper 3" },
              { id: "ak-4", name: "Paper 4" },
            ] },
            { id: "level-2", name: "Applied Skills", papers: [
              { id: "as-1", name: "Paper 1" },
              { id: "as-2", name: "Paper 2" },
              { id: "as-3", name: "Paper 3" },
              { id: "as-4", name: "Paper 4" },
            ] },
            { id: "level-3", name: "Strategic Professional", papers: [
              { id: "sp-1", name: "Paper 1" },
              { id: "sp-2", name: "Paper 2" },
              { id: "sp-3", name: "Paper 3" },
              { id: "sp-4", name: "Paper 4" },
            ] },
          ],
        },
        { id: "cma-us", name: "CMA US", papers: [
          { id: "part-1", name: "Part 1" },
          { id: "part-2", name: "Part 2" },
        ] },
      ],
    },
    {
      id: "taxation",
      name: "Taxation",
      programs: [
        { id: "ea", name: "EA", papers: [
          { id: "ea-1", name: "Part 1" },
          { id: "ea-2", name: "Part 2" },
          { id: "ea-3", name: "Part 3" },
        ] },
      ],
    },
  ];

  const initialCategoryId = catalog[0].id;
  const findProgramById = (id: string): { category: CategoryRef; program: ProgramRef } | null => {
    for (const cat of catalog) {
      const prog = cat.programs.find((p) => p.id === id);
      if (prog) return { category: cat, program: prog };
    }
    return null;
  };
  const defaultProg = findProgramById((courseId || "").toLowerCase()) || { category: catalog[0], program: catalog[0].programs[0] };
  const [categoryId, setCategoryId] = useState<string>(defaultProg.category.id || initialCategoryId);
  const [programId, setProgramId] = useState<string>(defaultProg.program.id);
  const currentCategory = catalog.find((c) => c.id === categoryId) || catalog[0];
  const programs = currentCategory.programs;
  const currentProgram = programs.find((p) => p.id === programId) || programs[0];
  const [levelId, setLevelId] = useState<string>(currentProgram.levels?.[0]?.id || "");
  const levels = currentProgram.levels || [];
  const currentLevel = levels.find((l) => l.id === levelId) || levels[0];
  const papers = currentProgram.levels ? (currentLevel?.papers || []) : (currentProgram.papers || []);
  const [paperId, setPaperId] = useState<string>(papers[0]?.id || "");

  const resolvedProgramName = programs.find((p) => p.id === programId)?.name || defaultProgramName;
  const resolvedPaperName = papers.find((p) => p.id === paperId)?.name || "Paper";
  const title = currentProgram.levels ? `${resolvedProgramName} • ${currentLevel?.name || "Level"} • ${resolvedPaperName} Structure` : `${resolvedProgramName} • ${resolvedPaperName} Structure`;

  const initialData: TreeNode[] = useMemo(
    () => [
      {
        id: "section-1",
        title: "Section 1",
        type: "section",
        children: [
          {
            id: "unit-1",
            title: "Unit 1",
            type: "unit",
            children: [
              { id: "module-1", title: "Module 1", type: "module" },
              { id: "module-2", title: "Module 2", type: "module" },
            ],
          },
          {
            id: "unit-2",
            title: "Unit 2",
            type: "unit",
            children: [
              { id: "module-3", title: "Module 3", type: "module" },
            ],
          },
        ],
      },
      {
        id: "section-2",
        title: "Section 2",
        type: "section",
        children: [
          {
            id: "unit-3",
            title: "Unit 3",
            type: "unit",
          },
        ],
      },
    ],
    [],
  );

  const [tree, setTree] = useState<TreeNode[]>(initialData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [idCounters, setIdCounters] = useState({ section: 3, unit: 4, module: 4 });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const getNodeAtPath = useCallback(
    (path: number[]): { node: TreeNode; parent: TreeNode[]; index: number } | null => {
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
    },
    [tree],
  );

  const removeNodeAtPath = useCallback(
    (path: number[]): { removed: TreeNode; newTree: TreeNode[] } | null => {
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
    },
    [tree],
  );

  const typeForDepth = (depth: number): NodeType => {
    if (depth <= 0) return "section";
    if (depth === 1) return "unit";
    return "module";
  };

  const retypeSubtree = (node: TreeNode, baseDepth: number): TreeNode => {
    const updated: TreeNode = {
      ...node,
      type: typeForDepth(baseDepth),
      children: node.children?.map((c) => retypeSubtree(c, baseDepth + 1)),
    };
    return updated;
  };

  const insertNodeAtPath = useCallback(
    (parentPath: number[] | null, index: number, node: TreeNode): TreeNode[] => {
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
    },
    [tree, getNodeAtPath],
  );

  const moveAsChild = useCallback(
    (dragPath: number[], dropPath: number[]) => {
      const removed = removeNodeAtPath(dragPath);
      if (!removed) return;
      let { removed: node, newTree } = removed;
      const clone = structuredClone(newTree) as TreeNode[];
      const baseDepth = dropPath.length; // child depth is parentPath length
      node = retypeSubtree(node, baseDepth);
      let parentList: TreeNode[] = clone;
      for (let i = 0; i < dropPath.length; i++) {
        const idx = dropPath[i];
        const target = parentList[idx];
        if (!target) break;
        if (i === dropPath.length - 1) {
          target.children = target.children || [];
          target.children.push(node);
        } else {
          target.children = target.children || [];
          parentList = target.children;
        }
      }
      setTree(clone);
    },
    [removeNodeAtPath],
  );


  const moveBefore = useCallback(
    (dragPath: number[], dropPath: number[]) => {
      const removed = removeNodeAtPath(dragPath);
      if (!removed) return;
      let { removed: node } = removed;
      const parentPath = dropPath.slice(0, -1);
      const index = dropPath[dropPath.length - 1];
      const baseDepth = parentPath.length; // sibling depth equals parentPath length
      node = retypeSubtree(node, baseDepth);
      const updated = insertNodeAtPath(parentPath, index, node);
      setTree(updated);
    },
    [removeNodeAtPath, insertNodeAtPath],
  );

  const moveAfter = useCallback(
    (dragPath: number[], dropPath: number[]) => {
      const removed = removeNodeAtPath(dragPath);
      if (!removed) return;
      let { removed: node } = removed;
      const parentPath = dropPath.slice(0, -1);
      const index = dropPath[dropPath.length - 1] + 1;
      const baseDepth = parentPath.length;
      node = retypeSubtree(node, baseDepth);
      const updated = insertNodeAtPath(parentPath, index, node);
      setTree(updated);
    },
    [removeNodeAtPath, insertNodeAtPath],
  );

  const makeSectionAtRoot = useCallback(
    (dragPath: number[]) => {
      const removed = removeNodeAtPath(dragPath);
      if (!removed) return;
      let { removed: node, newTree } = removed;
      node = retypeSubtree(node, 0);
      const updated = [...newTree, node];
      setTree(updated);
    },
    [removeNodeAtPath],
  );

  const deleteAtPath = (path: number[]) => {
    const found = getNodeAtPath(path);
    const name = found?.node.title || "this item";
    const ok = window.confirm(`Delete ${name}?`);
    if (!ok) return;
    const res = removeNodeAtPath(path);
    if (!res) return;
    setTree(res.newTree);
  };

  const storageKey = useMemo(() => {
    const parts = ["course_structure", programId, currentProgram.levels ? levelId || "level" : "flat", paperId || "paper"];
    return parts.join(":");
  }, [programId, levelId, paperId, currentProgram.levels]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as TreeNode[];
        setTree(parsed);
        return;
      }
    } catch {}
    setTree(initialData);
  }, [storageKey, initialData]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tree));
    } catch {}
  }, [tree, storageKey]);

  const addSection = () => {
    const next = idCounters.section + 1;
    setIdCounters((c) => ({ ...c, section: next }));
    const node: TreeNode = { id: `section-${next}`, title: `New Section ${next}`, type: "section", children: [] };
    setTree((prev) => [...prev, node]);
  };

  const addUnit = (path: number[]) => {
    const found = getNodeAtPath(path);
    if (!found) return;
    const target = found.node;
    if (target.type !== "section") return;
    const next = idCounters.unit + 1;
    setIdCounters((c) => ({ ...c, unit: next }));
    const child: TreeNode = { id: `unit-${next}`, title: `New Unit ${next}`, type: "unit", children: [] };
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
    setTree(clone);
  };

  const addModule = (path: number[]) => {
    const found = getNodeAtPath(path);
    if (!found) return;
    const target = found.node;
    if (target.type !== "unit") return;
    const next = idCounters.module + 1;
    setIdCounters((c) => ({ ...c, module: next }));
    const child: TreeNode = { id: `module-${next}`, title: `New Module ${next}`, type: "module" };
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
    setTree(clone);
  };

  const startRename = (node: TreeNode) => {
    setEditingId(node.id);
    setEditingValue(node.title);
  };

  const commitRename = (path: number[]) => {
    if (!editingId) return;
    const clone = structuredClone(tree) as TreeNode[];
    let parentList: TreeNode[] = clone;
    for (let i = 0; i < path.length; i++) {
      const idx = path[i];
      const n = parentList[idx];
      if (i === path.length - 1) {
        n.title = editingValue.trim() || n.title;
      } else {
        n.children = n.children || [];
        parentList = n.children;
      }
    }
    setTree(clone);
    setEditingId(null);
    setEditingValue("");
  };

  const cancelRename = useCallback(() => {
    setEditingId(null);
    setEditingValue("");
  }, []);

  const renderTree = (nodes: TreeNode[], parentPath: number[] = [], depth = 0) => {
    return (
      <ul className="space-y-1">
        {nodes.map((node, index) => (
          <TreeRow
            key={node.id}
            node={node}
            path={[...parentPath, index]}
            depth={depth}
            onMoveChild={moveAsChild}
            onMoveBefore={moveBefore}
            onMoveAfter={moveAfter}
            onAddUnit={addUnit}
            onAddModule={addModule}
            editingId={editingId}
            editingValue={editingValue}
            onStartRename={startRename}
            onRenameChange={setEditingValue}
            onRenameCommit={commitRename}
            onRenameCancel={cancelRename}
            isCollapsed={!!collapsed[nodes[index].id]}
            toggleCollapse={(id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))}
            getIsCollapsed={(id) => !!collapsed[id]}
            onDelete={deleteAtPath}
          />
        ))}
      </ul>
    );
  };

  return (
    <>
      <PageMeta title={title} description={`${resolvedProgramName} paper structure management`} />
      <PageBreadcrumb pageTitle={title} />
      <DndProvider backend={HTML5Backend}>
        <ComponentCard title={title}>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              <Select
                options={catalog.map((c) => ({ value: c.id, label: c.name }))}
                defaultValue={categoryId}
                onChange={(v) => {
                  setCategoryId(v);
                  const nextCat = catalog.find((c) => c.id === v) || catalog[0];
                  const nextProg = nextCat.programs[0];
                  setProgramId(nextProg.id);
                  const hasLevels = !!nextProg.levels?.length;
                  setLevelId(hasLevels ? (nextProg.levels?.[0]?.id || "") : "");
                  const nextPapers = hasLevels ? (nextProg.levels?.[0]?.papers || []) : (nextProg.papers || []);
                  setPaperId(nextPapers[0]?.id || "");
                }}
              />
              <Select
                options={programs.map((p) => ({ value: p.id, label: p.name }))}
                defaultValue={programId}
                onChange={(v) => {
                  setProgramId(v);
                  const nextProg = programs.find((p) => p.id === v) || programs[0];
                  const hasLevels = !!nextProg.levels?.length;
                  setLevelId(hasLevels ? (nextProg.levels?.[0]?.id || "") : "");
                  const nextPapers = hasLevels ? (nextProg.levels?.[0]?.papers || []) : (nextProg.papers || []);
                  setPaperId(nextPapers[0]?.id || "");
                }}
              />
              {currentProgram.levels && (
                <Select
                  options={(currentProgram.levels || []).map((l) => ({ value: l.id, label: l.name }))}
                  defaultValue={levelId}
                  onChange={(v) => {
                    setLevelId(v);
                    const nextLevel = (currentProgram.levels || []).find((l) => l.id === v) || (currentProgram.levels || [])[0];
                    const nextPapers = nextLevel?.papers || [];
                    setPaperId(nextPapers[0]?.id || "");
                  }}
                />
              )}
              <Select
                options={(papers || []).map((p) => ({ value: p.id, label: p.name }))}
                defaultValue={paperId}
                onChange={(v) => setPaperId(v)}
              />
            </div>
            <div className="mb-4 text-gray-500">Drag items to reorder or nest. Drop on the item to nest, drop above/below to reorder. Drop to the top area to make a Section.</div>
            <div className="flex items-center gap-2 mb-3">
              <Button size="sm" onClick={addSection} startIcon={<PlusIcon className="w-4 h-4" />}>Add Section</Button>
            </div>
            <RootDropArea onDropToRoot={(dragPath) => makeSectionAtRoot(dragPath)} />
            <div className="mt-2">{renderTree(tree)}</div>
          </div>
        </ComponentCard>
      </DndProvider>
    </>
  );
}

function RootDropArea({ onDropToRoot }: { onDropToRoot: (dragPath: number[]) => void }) {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: DragItem) => onDropToRoot(item.path),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });
  const ref = useRef<HTMLDivElement>(null);
  drop(ref);
  return (
    <div ref={ref} className={`rounded-lg border border-dashed ${isOver ? "border-brand-500 bg-brand-50" : "border-gray-300"} px-4 py-3`}>Drop here to make Section</div>
  );
}

function TreeRow({
  node,
  path,
  depth,
  onMoveChild,
  onMoveBefore,
  onMoveAfter,
  onAddUnit,
  onAddModule,
  editingId,
  editingValue,
  onStartRename,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  isCollapsed,
  toggleCollapse,
  getIsCollapsed,
  onDelete,
}: {
  node: TreeNode;
  path: number[];
  depth: number;
  onMoveChild: (dragPath: number[], dropPath: number[]) => void;
  onMoveBefore: (dragPath: number[], dropPath: number[]) => void;
  onMoveAfter: (dragPath: number[], dropPath: number[]) => void;
  onAddUnit: (path: number[]) => void;
  onAddModule: (path: number[]) => void;
  editingId: string | null;
  editingValue: string;
  onStartRename: (node: TreeNode) => void;
  onRenameChange: (val: string) => void;
  onRenameCommit: (path: number[]) => void;
  onRenameCancel: () => void;
  isCollapsed: boolean;
  toggleCollapse: (id: string) => void;
  getIsCollapsed: (id: string) => boolean;
  onDelete: (path: number[]) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => ({ id: node.id, path, node }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOverTop, overRightTop, targetTypeTop }, dropTop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: DragItem, monitor) => {
      const client = monitor.getClientOffset();
      const rowLeft = elRef.current?.getBoundingClientRect().left || 0;
      const dx = (client?.x || 0) - rowLeft;
      if (dx > 20) onMoveChild(item.path, path);
      else onMoveBefore(item.path, path);
    },
    collect: (monitor) => {
      const isOver = monitor.isOver();
      const client = monitor.getClientOffset();
      const rowLeft = elRef.current?.getBoundingClientRect().left || 0;
      const dx = (client?.x || 0) - rowLeft;
      const overRight = isOver && dx > 20;
      const typeForDepthLocal = (d: number): NodeType => (d <= 0 ? "section" : d === 1 ? "unit" : "module");
      const targetType = isOver ? typeForDepthLocal(overRight ? depth + 1 : depth) : "module";
      return { isOverTop: isOver, overRightTop: overRight, targetTypeTop: targetType } as any;
    },
  });

  const [{ isOverSelf }, dropSelf] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: DragItem) => onMoveChild(item.path, path),
    collect: (monitor) => ({ isOverSelf: monitor.isOver() }),
  });

  const [{ isOverBottom, overRightBottom, targetTypeBottom }, dropBottom] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: DragItem, monitor) => {
      const client = monitor.getClientOffset();
      const rowLeft = elRef.current?.getBoundingClientRect().left || 0;
      const dx = (client?.x || 0) - rowLeft;
      if (dx > 20) onMoveChild(item.path, path);
      else onMoveAfter(item.path, path);
    },
    collect: (monitor) => {
      const isOver = monitor.isOver();
      const client = monitor.getClientOffset();
      const rowLeft = elRef.current?.getBoundingClientRect().left || 0;
      const dx = (client?.x || 0) - rowLeft;
      const overRight = isOver && dx > 20;
      const typeForDepthLocal = (d: number): NodeType => (d <= 0 ? "section" : d === 1 ? "unit" : "module");
      const targetType = isOver ? typeForDepthLocal(overRight ? depth + 1 : depth) : "module";
      return { isOverBottom: isOver, overRightBottom: overRight, targetTypeBottom: targetType } as any;
    },
  });

  dropTop(topRef);
  dropBottom(bottomRef);
  drag(dropSelf(elRef));

  return (
    <li>
      <div ref={topRef} className={`transition-all duration-200 ${isOverTop ? "h-12 bg-brand-50 border border-dashed border-brand-300 rounded-md shadow-sm" : "h-2"}`}>
        {isOverTop && (
          <div className="flex items-center gap-2 px-3 text-xs text-gray-600">
            <span className="rounded bg-brand-100 px-1.5 py-0.5">{overRightTop ? "Nest as" : "Insert as"}</span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5">{targetTypeTop}</span>
          </div>
        )}
      </div>
      <div
        ref={elRef}
        className={`flex items-center gap-3 rounded-lg border ${isOverSelf ? "border-dashed border-brand-300 bg-brand-50" : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"} ${isDragging ? "opacity-70" : ""} transition-all duration-200 ${isOverSelf ? "px-5 py-3" : "px-4 py-3"}`}
        style={{ marginLeft: depth * 24 }}
      >
        {node.children && node.children.length ? (
          <button
            className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800"
            onClick={() => toggleCollapse(node.id)}
          >
            {isCollapsed ? (
              <AngleRightIcon className="w-4 h-4" />
            ) : (
              <AngleDownIcon className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="inline-flex items-center justify-center w-5 h-5" />
        )}
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800">≡</span>
        {editingId === node.id ? (
          <div className="flex items-center gap-2 flex-1">
            <InputField value={editingValue} onChange={(e) => onRenameChange(e.target.value)} className="h-8" />
            <Button size="sm" onClick={() => onRenameCommit(path)}>Save</Button>
            <Button size="sm" variant="outline" onClick={onRenameCancel}>Cancel</Button>
          </div>
        ) : (
          <span className="text-gray-800 dark:text-white/90 text-theme-sm">{node.title}</span>
        )}
        <span className="ml-auto text-xs uppercase text-gray-400">{node.type}</span>
        {node.type === "section" && (
          <Button size="sm" variant="outline" className="ml-2" onClick={() => onAddUnit(path)} startIcon={<PlusIcon className="w-4 h-4" />}>Add Unit</Button>
        )}
        {node.type === "unit" && (
          <Button size="sm" variant="outline" className="ml-2" onClick={() => onAddModule(path)} startIcon={<PlusIcon className="w-4 h-4" />}>Add Module</Button>
        )}
        <Button size="sm" variant="outline" className="ml-2" onClick={() => onStartRename(node)} startIcon={<PencilIcon className="w-4 h-4" />}>Rename</Button>
        <Button size="sm" className="ml-2" onClick={() => onDelete(path)} startIcon={<TrashBinIcon className="w-4 h-4" />}>Delete</Button>
      </div>
      <div ref={bottomRef} className={`transition-all duration-200 ${isOverBottom ? "h-12 bg-brand-50 border border-dashed border-brand-300 rounded-md shadow-sm" : "h-2"}`}>
        {isOverBottom && (
          <div className="flex items-center gap-2 px-3 text-xs text-gray-600">
            <span className="rounded bg-brand-100 px-1.5 py-0.5">{overRightBottom ? "Nest as" : "Insert as"}</span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5">{targetTypeBottom}</span>
          </div>
        )}
      </div>
      {node.children && node.children.length > 0 && !isCollapsed && (
        <ul className="mt-1 space-y-1">{node.children.map((child, idx) => (
          <TreeRow
            key={child.id}
            node={child}
            path={[...path, idx]}
            depth={depth + 1}
            onMoveChild={onMoveChild}
            onMoveBefore={onMoveBefore}
            onMoveAfter={onMoveAfter}
            onAddUnit={onAddUnit}
            onAddModule={onAddModule}
            editingId={editingId}
            editingValue={editingValue}
            onStartRename={onStartRename}
            onRenameChange={onRenameChange}
            onRenameCommit={onRenameCommit}
            onRenameCancel={onRenameCancel}
            isCollapsed={getIsCollapsed(child.id)}
            toggleCollapse={toggleCollapse}
            getIsCollapsed={getIsCollapsed}
            onDelete={onDelete}
          />
        ))}</ul>
      )}
    </li>
  );
}

export default CourseStructure;