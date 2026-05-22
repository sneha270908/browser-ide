import { useEditorStore, useProjectStore } from '../../store';
import { getMonacoLanguage, getLangColor } from '../../lib/utils';
import { GitBranch, Package, CheckCircle } from 'lucide-react';

export default function StatusBar() {
  const { activeTabId, dirtyTabs } = useEditorStore();
  const { currentProject } = useProjectStore();

  const activeFile = currentProject?.files.find(f => f.id === activeTabId);
  const lang = activeFile ? getMonacoLanguage(activeFile.name) : null;
  const pkgCount = currentProject?.packages?.length || 0;
  const hasDirty = dirtyTabs.size > 0;

  return (
    <div className="h-6 flex items-center justify-between px-3 bg-forge-accent text-white text-xs flex-shrink-0 select-none">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-3 h-3 opacity-70" />
          <span className="opacity-80">main</span>
        </div>

        {pkgCount > 0 && (
          <div className="flex items-center gap-1 opacity-80">
            <Package className="w-3 h-3" />
            <span>{pkgCount} packages</span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {hasDirty ? (
          <span className="opacity-80">● Unsaved changes</span>
        ) : (
          <div className="flex items-center gap-1 opacity-80">
            <CheckCircle className="w-3 h-3" />
            <span>Saved</span>
          </div>
        )}

        {lang && (
          <div className="flex items-center gap-1.5 opacity-80">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getLangColor(lang) }}
            />
            <span className="capitalize">{lang}</span>
          </div>
        )}

        <span className="opacity-60">UTF-8</span>
        <span className="opacity-60">LF</span>
      </div>
    </div>
  );
}
