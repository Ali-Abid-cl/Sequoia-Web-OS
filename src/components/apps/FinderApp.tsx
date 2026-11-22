import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileCode2,
  FileText,
  Folder,
  HardDrive,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react';
import type { FSNode, WallpaperId } from '../../types/os';

interface FinderAppProps {
  fsRoot: FSNode;
  viewMode: 'grid' | 'list';
  onChangeViewMode: (mode: 'grid' | 'list') => void;
  onOpenNoteFromFile: (title: string, content: string) => void;
  onSelectWallpaper?: (id: WallpaperId) => void;
}

const SIDEBAR_FOLDERS = ['Desktop', 'Documents', 'Projects', 'Pictures'];

function findFolderByPath(root: FSNode, targetPath: string): FSNode {
  if (root.path === targetPath) return root;
  for (const child of root.children ?? []) {
    if (child.type === 'folder') {
      if (child.path === targetPath) return child;
      const nested = findFolderByPath(child, targetPath);
      if (nested.path === targetPath) return nested;
    }
  }
  return root;
}

export const FinderApp: React.FC<FinderAppProps> = ({
  fsRoot,
  viewMode,
  onChangeViewMode,
  onOpenNoteFromFile,
  onSelectWallpaper,
}) => {
  const [history, setHistory] = useState<string[]>(['~/Desktop']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>('readme');

  const currentPath = history[historyIndex] ?? '~/Desktop';
  const currentFolder = useMemo(() => findFolderByPath(fsRoot, currentPath), [fsRoot, currentPath]);

  const items = useMemo(() => {
    const list = currentFolder.children ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => item.name.toLowerCase().includes(q));
  }, [currentFolder, searchQuery]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  const navigateTo = (path: string) => {
    if (path === currentPath) return;
    const nextHistory = [...history.slice(0, historyIndex + 1), path];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setSelectedId(null);
    setSearchQuery('');
  };

  const canBack = historyIndex > 0;
  const canForward = historyIndex < history.length - 1;

  const renderNodeIcon = (node: FSNode, sizeClass = 'h-10 w-10') => {
    if (node.type === 'folder') {
      return <Folder className={`${sizeClass} fill-sky-400/90 text-sky-500`} />;
    }
    if (node.type === 'image' && node.imageUrl) {
      return (
        <div className={`${sizeClass} overflow-hidden rounded-md border border-black/10 dark:border-white/15 bg-slate-200 dark:bg-slate-800`}>
          <img
            src={node.imageUrl}
            alt={node.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
      );
    }
    if (node.name.endsWith('.ts') || node.name.endsWith('.sh') || node.name === 'Dockerfile') {
      return <FileCode2 className={`${sizeClass} text-indigo-500 dark:text-indigo-400`} />;
    }
    return <FileText className={`${sizeClass} text-slate-500 dark:text-slate-300`} />;
  };

  const matchWallpaperId = (name: string): WallpaperId | null => {
    const lower = name.toLowerCase();
    if (lower.includes('sequoia')) return 'sequoia';
    if (lower.includes('sonoma')) return 'sonoma';
    if (lower.includes('sierra')) return 'sierra';
    if (lower.includes('silk')) return 'silk';
    return null;
  };

  return (
    <div className="flex h-full w-full text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-44 shrink-0 border-r border-black/8 dark:border-white/10 bg-slate-100/60 dark:bg-slate-950/40 p-2.5">
        <div className="mb-1.5 px-2 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          Favorites
        </div>
        <nav className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => navigateTo('~')}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              currentPath === '~'
                ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/8'
            }`}
          >
            <HardDrive className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>Macintosh HD</span>
          </button>

          {SIDEBAR_FOLDERS.map((folderName) => {
            const path = `~/${folderName}`;
            const active = currentPath === path;
            return (
              <button
                key={folderName}
                type="button"
                onClick={() => navigateTo(path)}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/8'
                }`}
              >
                {folderName === 'Pictures' ? (
                  <ImageIcon className="h-3.5 w-3.5 text-sky-500" />
                ) : (
                  <Folder className="h-3.5 w-3.5 text-sky-500" />
                )}
                <span>{folderName}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content + Inspector */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Finder Toolbar */}
        <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-black/8 dark:border-white/10 px-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Back"
                disabled={!canBack}
                onClick={() => canBack && setHistoryIndex((i) => i - 1)}
                className="rounded p-1 hover:bg-black/8 dark:hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Forward"
                disabled={!canForward}
                onClick={() => canForward && setHistoryIndex((i) => i + 1)}
                className="rounded p-1 hover:bg-black/8 dark:hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
              {currentFolder.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Grid / List segmented toggle */}
            <div className="flex items-center rounded-md border border-black/10 dark:border-white/12 bg-black/5 dark:bg-white/5 p-0.5">
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => onChangeViewMode('grid')}
                className={`rounded px-2 py-1 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="List view"
                onClick={() => onChangeViewMode('list')}
                className={`rounded px-2 py-1 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search folder"
                aria-label="Search current Finder folder"
                className="w-36 rounded-md border border-black/10 dark:border-white/12 bg-white/70 dark:bg-slate-800/70 py-1 pr-2 pl-7 text-xs outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Body Split: Items + Preview Pane */}
        <div className="flex min-h-0 flex-1">
          <div className="macos-scroll flex-1 overflow-y-auto p-3.5">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-slate-500 dark:text-slate-400">
                <Folder className="mb-2 h-8 w-8 opacity-40" />
                <p className="font-medium">No matching items in {currentFolder.name}</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {items.map((node) => {
                  const selected = node.id === selectedId;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedId(node.id)}
                      onDoubleClick={() => {
                        if (node.type === 'folder') navigateTo(node.path);
                      }}
                      className={`flex flex-col items-center gap-1.5 rounded-lg p-2.5 text-center transition-colors ${
                        selected
                          ? 'bg-sky-500/18 ring-1 ring-sky-500/50'
                          : 'hover:bg-black/5 dark:hover:bg-white/6'
                      }`}
                    >
                      {renderNodeIcon(node, 'h-12 w-12')}
                      <span className="w-full truncate text-xs font-medium">{node.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="divide-y divide-black/6 dark:divide-white/8">
                <div className="grid grid-cols-12 px-2 pb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="col-span-6">Name</span>
                  <span className="col-span-4">Date Modified</span>
                  <span className="col-span-2 text-right">Size</span>
                </div>
                {items.map((node) => {
                  const selected = node.id === selectedId;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedId(node.id)}
                      onDoubleClick={() => {
                        if (node.type === 'folder') navigateTo(node.path);
                      }}
                      className={`grid w-full grid-cols-12 items-center rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                        selected
                          ? 'bg-sky-500/18 text-sky-900 dark:text-sky-100'
                          : 'hover:bg-black/5 dark:hover:bg-white/6'
                      }`}
                    >
                      <span className="col-span-6 flex items-center gap-2 truncate font-medium">
                        {renderNodeIcon(node, 'h-4 w-4 shrink-0')}
                        <span className="truncate">{node.name}</span>
                      </span>
                      <span className="col-span-4 truncate text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                        {node.modified}
                      </span>
                      <span className="col-span-2 text-right text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                        {node.size}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview Inspector */}
          {selectedItem && (
            <aside className="macos-scroll flex w-60 shrink-0 flex-col border-l border-black/8 dark:border-white/10 bg-slate-50/60 dark:bg-slate-950/35 p-3.5 overflow-y-auto">
              <div className="mb-3 flex flex-col items-center text-center">
                {selectedItem.type === 'image' && selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    referrerPolicy="no-referrer"
                    className="mb-2.5 aspect-video w-full rounded-lg border border-black/10 dark:border-white/15 object-cover shadow-sm"
                  />
                ) : (
                  <div className="my-2">{renderNodeIcon(selectedItem, 'h-12 w-12')}</div>
                )}
                <div className="w-full truncate text-xs font-semibold">{selectedItem.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedItem.kind} · {selectedItem.size}
                </div>
              </div>

              <div className="space-y-1.5 border-t border-black/8 dark:border-white/10 pt-2.5 text-[11px]">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Modified</span>
                  <span className="tabular-nums font-medium">{selectedItem.modified}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Location</span>
                  <span className="truncate font-mono text-[10px]">{selectedItem.path}</span>
                </div>
              </div>

              {selectedItem.content && (
                <div className="mt-3 flex flex-1 flex-col gap-2">
                  <pre className="macos-scroll max-h-44 overflow-auto rounded-lg border border-black/8 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 p-2 font-mono text-[10.5px] leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                    {selectedItem.content}
                  </pre>
                  <button
                    type="button"
                    onClick={() => onOpenNoteFromFile(selectedItem.name, selectedItem.content ?? '')}
                    className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500"
                  >
                    Open in Notes
                  </button>
                </div>
              )}

              {selectedItem.type === 'image' &&
                onSelectWallpaper &&
                matchWallpaperId(selectedItem.name) && (
                  <button
                    type="button"
                    onClick={() => {
                      const wpId = matchWallpaperId(selectedItem.name);
                      if (wpId) onSelectWallpaper(wpId);
                    }}
                    className="mt-3 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500"
                  >
                    Set as Wallpaper
                  </button>
                )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
