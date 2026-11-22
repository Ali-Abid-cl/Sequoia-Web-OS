export type AppId = 'finder' | 'safari' | 'terminal' | 'notes' | 'calculator' | 'settings';

export type ThemeMode = 'light' | 'dark';

export type WallpaperId = 'sequoia' | 'sonoma' | 'sierra' | 'silk';

export interface WallpaperOption {
  id: WallpaperId;
  name: string;
  subtitle: string;
  imageUrl: string;
  fallbackGradient: string;
  accentColor: string;
}

export interface WindowState {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  zIndex: number;
}

export interface FSNode {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'image';
  path: string;
  kind: string;
  size: string;
  modified: string;
  content?: string;
  imageUrl?: string;
  children?: FSNode[];
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
}

export interface AgenticAction {
  type: 'open_app' | 'create_note' | 'run_terminal_cmd' | 'set_theme' | 'set_wallpaper';
  target?: string;
  title?: string;
  body?: string;
  command?: string;
  label: string;
}

export interface TraceStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'blocked';
}
