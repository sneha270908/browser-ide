import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, FilePlus, FolderPlus,
  Trash2, Edit2, Check, X, FolderOpen, Folder, FileText
} from 'lucide-react';
import { cn, buildFileTree, getLangColor } from '../../lib/utils';
import { filesAPI } from '../../lib/api';
import { useProjectStore, useEditorStore } from '../../store';
import toast from 'react-hot-toast';

// Small colored dot indicating language
function LangDot({ language }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: getLangColor(language) }}
    />
  );
}

// Inline rename input
function RenameInput({ initialValue, onConfirm, onCancel }) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef();

  const confirm = () => {
    if (value.trim() && value !== initialValue) onConfirm(value.trim());
    else onCancel();
  };

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') confirm();
          if (e.key === 'Escape') onCancel();
          e.stopPropagation();
        }}
        className="flex-1 min-w-0 bg-forge-accent/10 border border-forge-accent/40 rounded px-1.5 py-0.5 text-xs text-forge-text focus:outline-none"
        onClick={e => e.stopPropagation()}
      />
      <button onClick={confirm} className="text-forge-emerald hover:text-green-400 p-0.5">
        <Check className="w-3 h-3" />
      </button>
      <button onClick={onCancel} className="text-forge-muted hover:text-forge-rose p-0.5">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Single file/folder row
function TreeNode({ node, depth = 0, projectId }) {
  const [isOpen, setIsOpen] = useState(node.isOpen || false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [hovering, setHovering] = useState(false);
  const { openTab, activeTabId } = useEditorStore();
  const { addFile, removeFile, updateFile } = useProjectStore();

  const isActive = activeTabId === node.id;
  const indent = depth * 12;

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsOpen(o => !o);
    } else {
      openTab(node.id);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      const { deleted } = await filesAPI.delete(projectId, node.id);
      removeFile(deleted);
      toast.success(`${node.type === 'folder' ? 'Folder' : 'File'} deleted`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRename = async (newName) => {
    try {
      const { file } = await filesAPI.update(projectId, node.id, { name: newName });
      updateFile(node.id, file);
      setIsRenaming(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={handleClick}
        className={cn(
          'tree-item flex items-center gap-1.5 py-1 pr-2 rounded-md cursor-pointer text-xs group',
          isActive && node.type === 'file' ? 'selected text-forge-bright' : 'text-forge-subtle hover:text-forge-text'
        )}
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        {/* Expand chevron for folders */}
        {node.type === 'folder' ? (
          <span className="flex-shrink-0">
            {isOpen
              ? <ChevronDown className="w-3.5 h-3.5 text-forge-muted" />
              : <ChevronRight className="w-3.5 h-3.5 text-forge-muted" />}
          </span>
        ) : (
          <span className="w-3.5 flex-shrink-0 flex justify-center">
            <LangDot language={node.language} />
          </span>
        )}

        {/* Folder / file icon */}
        {node.type === 'folder' ? (
          isOpen
            ? <FolderOpen className="w-3.5 h-3.5 text-forge-amber flex-shrink-0" />
            : <Folder className="w-3.5 h-3.5 text-forge-amber flex-shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-forge-muted flex-shrink-0" />
        )}

        {/* Name or rename input */}
        {isRenaming ? (
          <RenameInput
            initialValue={node.name}
            onConfirm={handleRename}
            onCancel={() => setIsRenaming(false)}
          />
        ) : (
          <span className="truncate flex-1">{node.name}</span>
        )}

        {/* Action buttons on hover */}
        {hovering && !isRenaming && (
          <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
            <button
              onClick={e => { e.stopPropagation(); setIsRenaming(true); }}
              className="p-0.5 hover:text-forge-glow rounded transition-colors"
              title="Rename"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={handleDelete}
              className="p-0.5 hover:text-forge-rose rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {node.type === 'folder' && isOpen && node.children?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} depth={depth + 1} projectId={projectId} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// New file/folder creation row
function NewItemInput({ type, parentId, projectId, onDone }) {
  const [name, setName] = useState('');
  const { addFile } = useProjectStore();

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) { onDone(); return; }
    try {
      const { file } = await filesAPI.create(projectId, { name: trimmed, type, parentId });
      addFile(file);
      onDone();
      toast.success(`${type === 'folder' ? 'Folder' : 'File'} created`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-1">
      {type === 'folder'
        ? <Folder className="w-3.5 h-3.5 text-forge-amber" />
        : <FileText className="w-3.5 h-3.5 text-forge-muted" />}
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleCreate();
          if (e.key === 'Escape') onDone();
        }}
        onBlur={onDone}
        placeholder={type === 'folder' ? 'folder-name' : 'file.js'}
        className="flex-1 min-w-0 bg-forge-accent/10 border border-forge-accent/40 rounded px-1.5 py-0.5 text-xs text-forge-text focus:outline-none"
      />
    </div>
  );
}

export default function FileTree({ project }) {
  const [creating, setCreating] = useState(null); // { type: 'file' | 'folder' }
  const tree = buildFileTree(project?.files || []);

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-forge-border">
        <span className="text-xs font-medium text-forge-muted uppercase tracking-wider">Explorer</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCreating({ type: 'file' })}
            title="New file"
            className="p-1 hover:bg-forge-elevated hover:text-forge-text text-forge-muted rounded transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCreating({ type: 'folder' })}
            title="New folder"
            className="p-1 hover:bg-forge-elevated hover:text-forge-text text-forge-muted rounded transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Project name */}
      <div className="px-3 py-2 border-b border-forge-border/50">
        <span className="text-xs font-medium text-forge-subtle uppercase tracking-widest truncate block">
          {project?.name}
        </span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {creating && (
          <NewItemInput
            type={creating.type}
            parentId={null}
            projectId={project._id}
            onDone={() => setCreating(null)}
          />
        )}
        {tree.length === 0 && !creating ? (
          <div className="px-4 py-6 text-center">
            <p className="text-forge-muted text-xs">No files yet</p>
            <button
              onClick={() => setCreating({ type: 'file' })}
              className="text-forge-glow text-xs mt-2 hover:underline"
            >
              Create a file
            </button>
          </div>
        ) : (
          tree.map(node => (
            <TreeNode key={node.id} node={node} depth={0} projectId={project._id} />
          ))
        )}
      </div>
    </div>
  );
}
