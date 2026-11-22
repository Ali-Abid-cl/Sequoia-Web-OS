import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { FSNode } from '../../types/os';

interface TerminalAppProps {
  fsRoot: FSNode;
  onCreateFileOrFolder: (parentPath: string, name: string, type: 'file' | 'folder', content?: string) => void;
  clearTrigger: number;
  externalCommand?: { id: string; command: string } | null;
}

const DESTRUCTIVE_PATTERNS: RegExp[] = [
  /\brm\s+.*(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|--recursive|--force)\b/i,
  /\bsudo\s+rm\b/i,
  /\bmkfs(\.[a-z0-9]+)?\b/i,
  /\bdd\s+if=/i,
  /:\(\)\s*\{\s*:\|\:&\s*\};:/,
];

function isDestructiveCommand(raw: string): boolean {
  return DESTRUCTIVE_PATTERNS.some((pattern) => pattern.test(raw));
}

interface TerminalLine {
  id: string;
  type: 'prompt' | 'output' | 'error' | 'ai';
  text: string;
  cwd?: string;
}

const KNOWN_COMMANDS = [
  'help',
  'ls',
  'cd',
  'pwd',
  'cat',
  'echo',
  'mkdir',
  'touch',
  'clear',
  'whoami',
  'date',
  'uname',
  'neofetch',
  'ai',
];

function resolvePath(cwd: string, target?: string): string {
  if (!target || target === '~') return '~';
  if (target === '.') return cwd;
  if (target === '..') {
    if (cwd === '~') return '~';
    const parts = cwd.split('/');
    parts.pop();
    return parts.length <= 1 ? '~' : parts.join('/');
  }
  if (target.startsWith('~/')) return target.replace(/\/+$/, '');
  return cwd === '~' ? `~/${target}` : `${cwd}/${target}`;
}

function findNode(root: FSNode, path: string): FSNode | null {
  if (root.path === path) return root;
  for (const child of root.children ?? []) {
    if (child.path === path) return child;
    if (child.type === 'folder') {
      const found = findNode(child, path);
      if (found) return found;
    }
  }
  return null;
}

export const TerminalApp: React.FC<TerminalAppProps> = ({
  fsRoot,
  onCreateFileOrFolder,
  clearTrigger,
  externalCommand,
}) => {
  const [cwd, setCwd] = useState('~/Desktop');
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sandboxAlertCmd, setSandboxAlertCmd] = useState<string | null>(null);
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'welcome-1',
      type: 'output',
      text: 'Last login: Sat Nov 21 09:32:50 on ttys001 — Sequoia zsh 5.9 (Sandbox Protected)',
    },
    {
      id: 'welcome-2',
      type: 'output',
      text: "Type 'help' for built-in commands or 'ai <prompt>' to query Gemini.",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastExternalIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (clearTrigger > 0) {
      setLines([]);
    }
  }, [clearTrigger]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, isAiLoading]);

  const appendLines = (newLines: Omit<TerminalLine, 'id'>[]) => {
    setLines((prev) => [
      ...prev,
      ...newLines.map((l, idx) => ({ ...l, id: `${Date.now()}-${idx}-${Math.random()}` })),
    ]);
  };

  const runCommand = async (rawInput: string) => {
    const trimmed = rawInput.trim();
    appendLines([{ type: 'prompt', text: trimmed, cwd }]);
    if (!trimmed) return;

    setCmdHistory((prev) => [trimmed, ...prev]);
    setHistoryIdx(-1);

    // Agent Sandbox Security Guardrail
    if (isDestructiveCommand(trimmed)) {
      appendLines([
        {
          type: 'error',
          text: `[SANDBOX] Intercepted destructive command: "${trimmed}". Execution isolated.`,
        },
      ]);
      setSandboxAlertCmd(trimmed);
      return;
    }

    const [cmd, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(' ');

    switch (cmd) {
      case 'clear':
        setLines([]);
        return;

      case 'help':
        appendLines([
          {
            type: 'output',
            text: [
              'Built-in zsh commands:',
              '  help              Show this command reference',
              '  ls [path]         List directory contents',
              '  cd <dir>          Change directory (~, .., Desktop, Documents, Projects, Pictures)',
              '  pwd               Print working directory',
              '  cat <file>        Display file contents',
              '  mkdir <name>      Create a folder in current directory',
              '  touch <name>      Create an empty file in current directory',
              '  echo <text>       Print text to stdout',
              '  whoami            Display active username',
              '  date              Print current system date/time',
              '  uname             Print kernel & OS details',
              '  neofetch          Display system hardware & OS summary',
              '  ai <prompt>       Ask Gemini directly inside Terminal',
              '  clear             Clear terminal screen',
            ].join('\n'),
          },
        ]);
        return;

      case 'pwd':
        appendLines([{ type: 'output', text: cwd.replace('~', '/Users/ali') }]);
        return;

      case 'whoami':
        appendLines([{ type: 'output', text: 'ali' }]);
        return;

      case 'date':
        appendLines([{ type: 'output', text: new Date().toString() }]);
        return;

      case 'uname':
        appendLines([{ type: 'output', text: 'Darwin Sequoia-MacBook.local 24.1.0 arm64' }]);
        return;

      case 'echo':
        appendLines([{ type: 'output', text: arg }]);
        return;

      case 'neofetch':
        appendLines([
          {
            type: 'output',
            text: [
              '                    \'c.          ali@Sequoia-MacBook',
              '                 ,xNMM.          ----------------------',
              '               .OMMMMo           OS: macOS Sequoia 15.2 (Web)',
              '               OMMM0,            Host: Apple Silicon Web Engine',
              '     .;loddo:\' loolloddol;.      Kernel: Darwin 24.1.0 arm64',
              '   cKMMMMMMMMMMNWMMMMMMMMMM0:    Shell: zsh 5.9 (Sandbox Active)',
              ' .KMMMMMMMMMMMMMMMMMMMMMMMWd.    Resolution: Viewport Dynamic',
              ' XMMMMMMMMMMMMMMMMMMMMMMMX.      WM: Quartz Glass Compositor',
              ';MMMMMMMMMMMMMMMMMMMMMMMM:       AI Engine: Gemini 4 Hydrogen',
              ':MMMMMMMMMMMMMMMMMMMMMMMM:       Container: Cloud Run Ready (8080)',
              '.MMMMMMMMMMMMMMMMMMMMMMMMX.',
              ' kMMMMMMMMMMMMMMMMMMMMMMMMWd.',
              ' .XMMMMMMMMMMMMMMMMMMMMMMMMMMk',
              '  .XMMMMMMMMMMMMMMMMMMMMMMMMK.',
              '    kMMMMMMMMMMMMMMMMMMMMMMd',
              '     ;KMMMMMMMWXXWMMMMMMMk.',
              '       .cooc,.    .,coo:.',
            ].join('\n'),
          },
        ]);
        return;

      case 'ls': {
        const targetPath = resolvePath(cwd, rest[0]);
        const node = findNode(fsRoot, targetPath);
        if (!node) {
          appendLines([{ type: 'error', text: `ls: ${rest[0]}: No such file or directory` }]);
          return;
        }
        if (node.type !== 'folder') {
          appendLines([{ type: 'output', text: node.name }]);
          return;
        }
        const listing = (node.children ?? [])
          .map((c) => (c.type === 'folder' ? `${c.name}/` : c.name))
          .join('    ');
        appendLines([{ type: 'output', text: listing || '(empty directory)' }]);
        return;
      }

      case 'cd': {
        const targetPath = resolvePath(cwd, rest[0]);
        const node = findNode(fsRoot, targetPath);
        if (!node) {
          appendLines([{ type: 'error', text: `cd: no such file or directory: ${rest[0]}` }]);
          return;
        }
        if (node.type !== 'folder') {
          appendLines([{ type: 'error', text: `cd: not a directory: ${rest[0]}` }]);
          return;
        }
        setCwd(node.path);
        return;
      }

      case 'cat': {
        if (!rest[0]) {
          appendLines([{ type: 'error', text: 'usage: cat <filename>' }]);
          return;
        }
        const targetPath = resolvePath(cwd, rest[0]);
        const node = findNode(fsRoot, targetPath);
        if (!node) {
          appendLines([{ type: 'error', text: `cat: ${rest[0]}: No such file or directory` }]);
          return;
        }
        if (node.type === 'folder') {
          appendLines([{ type: 'error', text: `cat: ${rest[0]}: Is a directory` }]);
          return;
        }
        if (node.type === 'image') {
          appendLines([{ type: 'output', text: `[Binary image file: ${node.name} (${node.size})]` }]);
          return;
        }
        appendLines([{ type: 'output', text: node.content ?? '' }]);
        return;
      }

      case 'mkdir':
      case 'touch': {
        const name = rest[0];
        if (!name || name.includes('/')) {
          appendLines([{ type: 'error', text: `usage: ${cmd} <name>` }]);
          return;
        }
        onCreateFileOrFolder(cwd, name, cmd === 'mkdir' ? 'folder' : 'file', '');
        appendLines([{ type: 'output', text: `Created ${cmd === 'mkdir' ? 'directory' : 'file'} '${name}' in ${cwd}` }]);
        return;
      }

      case 'ai': {
        if (!arg) {
          appendLines([{ type: 'error', text: 'usage: ai <your question or command request>' }]);
          return;
        }
        setIsAiLoading(true);
        try {
          const res = await fetch('/api/gemini/terminal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: arg, cwd }),
          });
          const data = await res.json();
          if (!res.ok) {
            appendLines([{ type: 'error', text: data.error || 'Gemini request failed.' }]);
          } else {
            appendLines([{ type: 'ai', text: data.output || '(empty response)' }]);
          }
        } catch (err) {
          appendLines([
            {
              type: 'error',
              text: err instanceof Error ? err.message : 'Network error calling /api/gemini/terminal',
            },
          ]);
        } finally {
          setIsAiLoading(false);
        }
        return;
      }

      default:
        appendLines([{ type: 'error', text: `zsh: command not found: ${cmd}. Type 'help' for commands.` }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isAiLoading) {
      const val = input;
      setInput('');
      void runCommand(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const nextIdx = Math.min(cmdHistory.length - 1, historyIdx + 1);
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[nextIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(/\s+/);
      if (parts.length === 1) {
        const match = KNOWN_COMMANDS.find((c) => c.startsWith(parts[0]));
        if (match) setInput(`${match} `);
      } else {
        const prefix = parts[parts.length - 1];
        const currentFolder = findNode(fsRoot, cwd);
        const match = currentFolder?.children?.find((c) =>
          c.name.toLowerCase().startsWith(prefix.toLowerCase())
        );
        if (match) {
          parts[parts.length - 1] = match.name;
          setInput(parts.join(' '));
        }
      }
    }
  };

  useEffect(() => {
    if (externalCommand && externalCommand.id !== lastExternalIdRef.current) {
      lastExternalIdRef.current = externalCommand.id;
      void runCommand(externalCommand.command);
    }
  });

  const shortDir = cwd === '~' ? '~' : cwd.split('/').pop() || '~';

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="relative flex h-full w-full flex-col bg-[#0d1117] p-3.5 font-mono text-[12.5px] leading-relaxed text-slate-200 select-text"
    >
      <div ref={scrollRef} className="macos-scroll flex-1 space-y-1.5 overflow-y-auto pr-1">
        {lines.map((line) => {
          if (line.type === 'prompt') {
            const pDir = line.cwd === '~' ? '~' : line.cwd?.split('/').pop() || '~';
            return (
              <div key={line.id} className="flex flex-wrap gap-x-2">
                <span className="text-emerald-400">ali@Sequoia</span>
                <span className="text-sky-400">{pDir}</span>
                <span className="text-slate-500">%</span>
                <span className="text-white">{line.text}</span>
              </div>
            );
          }
          if (line.type === 'error') {
            return (
              <pre key={line.id} className="whitespace-pre-wrap font-mono text-rose-400">
                {line.text}
              </pre>
            );
          }
          if (line.type === 'ai') {
            return (
              <pre
                key={line.id}
                className="my-1 whitespace-pre-wrap rounded-md border border-sky-500/30 bg-sky-950/35 px-3 py-2 font-mono text-sky-100"
              >
                {line.text}
              </pre>
            );
          }
          return (
            <pre key={line.id} className="whitespace-pre-wrap font-mono text-slate-300">
              {line.text}
            </pre>
          );
        })}

        {isAiLoading && (
          <div className="text-sky-400">Querying Gemini 4 Hydrogen...</div>
        )}

        {/* Active Prompt */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="shrink-0 text-emerald-400">ali@Sequoia</span>
          <span className="shrink-0 text-sky-400">{shortDir}</span>
          <span className="shrink-0 text-slate-500">%</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAiLoading}
            autoFocus
            spellCheck={false}
            aria-label="Terminal command input"
            className="min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-white outline-none caret-emerald-400"
          />
        </div>
      </div>

      {/* macOS Agent Sandbox Security Alert Modal */}
      {sandboxAlertCmd && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Agent Sandbox Protection Alert"
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4 macos-glass"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/40 bg-slate-900/95 p-5 text-center font-sans text-slate-100 shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Agent Sandbox Protection</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              Agent Sandbox Protection: Destructive command intercepted and isolated.
            </p>
            <div className="mt-3 rounded-lg border border-rose-500/25 bg-black/40 px-3 py-2 font-mono text-[11px] text-rose-300 break-all">
              {sandboxAlertCmd}
            </div>
            <button
              type="button"
              onClick={() => {
                setSandboxAlertCmd(null);
                inputRef.current?.focus();
              }}
              className="mt-4 w-full rounded-lg bg-rose-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-500"
            >
              Keep Isolated &amp; Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
