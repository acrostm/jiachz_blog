"use client";

import React from "react";

import Link from "next/link";

import {
  BILIBILI_PAGE,
  EMAIL,
  GITHUB_PAGE,
  JUEJIN_PAGE,
  NICKNAME,
  PATHS,
  SLOGAN,
  SOURCE_CODE_GITHUB_PAGE,
} from "@/constants";
import { cn } from "@/lib/utils";

type ThemeId = "amber" | "green" | "ice" | "rose";

type ThemeToken = {
  label: string;
  bg: string;
  bgLight: string;
  fg: string;
  dim: string;
  bright: string;
  glow: string;
};

type TuiFile = {
  title: string;
  summary: string;
  lines: string[];
};

type TerminalEntry = {
  id: string;
  prompt?: string;
  command?: string;
  output: string[];
  tone?: "normal" | "muted" | "error";
};

type ExplorerFileNode = {
  type: "file";
  name: string;
  path: FilePath;
};

type ExplorerFolderNode = {
  type: "folder";
  name: string;
  path: DirectoryPath;
  children: ExplorerNode[];
};

type ExplorerNode = ExplorerFileNode | ExplorerFolderNode;

const THEMES: Record<ThemeId, ThemeToken> = {
  amber: {
    label: "amber",
    bg: "#0d0d0d",
    bgLight: "#1a1a1a",
    fg: "#d4a14f",
    dim: "#8a6a35",
    bright: "#ffb84d",
    glow: "212,161,79",
  },
  green: {
    label: "green",
    bg: "#07110d",
    bgLight: "#102019",
    fg: "#7bd88f",
    dim: "#4d8b5d",
    bright: "#b6ffca",
    glow: "123,216,143",
  },
  ice: {
    label: "ice",
    bg: "#071014",
    bgLight: "#111f25",
    fg: "#87d7e7",
    dim: "#4d8a95",
    bright: "#c8f7ff",
    glow: "135,215,231",
  },
  rose: {
    label: "rose",
    bg: "#14090d",
    bgLight: "#241218",
    fg: "#f08ba8",
    dim: "#98556a",
    bright: "#ffc0d0",
    glow: "240,139,168",
  },
};

const THEME_ORDER: ThemeId[] = ["amber", "green", "ice", "rose"];

const SITE_FILES = {
  "/home/home.txt": {
    title: "home.txt",
    summary: "入口文件，介绍这个隐藏终端页和最短使用方式。",
    lines: [
      "      _ _            _         ",
      "     (_) | __ _  ___| |__  ____",
      "     | | |/ _` |/ __| '_ \\|_  /",
      "     | | | (_| | (__| | | |/ / ",
      "    _/ |_|\\__,_|\\___|_| |_/___|",
      "   |__/                         ",
      "",
      `Hello, I'm ${NICKNAME}.`,
      "Full-Stack Developer / product-minded builder / careful verifier.",
      "",
      "This page is a hidden TUI corner inside my blog.",
      "Use the Explorer, run `help`, or type `less about.txt`.",
      "",
      "Shortcuts:",
      "  ↑ / ↓         move through files",
      "  /             focus terminal",
      "  theme ice     switch the color theme",
      "  open github   jump to my GitHub profile",
    ],
  },
  "/home/about.txt": {
    title: "about.txt",
    summary: "个人简介，尽量保留博客现有语气，而不是做成传统简历。",
    lines: [
      `${NICKNAME} / Full-Stack Developer`,
      "",
      "I like building durable tools, content systems, and small experiments",
      "that can survive real use instead of only looking good in screenshots.",
      "",
      "Current working style:",
      "  - read the existing system first",
      "  - keep changes small and explainable",
      "  - verify with builds, browser checks, and real flows",
      "",
      "Main stack:",
      "  Next.js / React / TypeScript / Tailwind",
      "  Java / Spring Boot / Node / Nest",
      "  Prisma / PostgreSQL / MySQL",
      "",
      `Slogan: ${SLOGAN}`,
    ],
  },
  "/home/skills/languages.md": {
    title: "languages.md",
    summary: "把技能按工程用途写出来，而不是罗列徽章。",
    lines: [
      "# Languages and frameworks",
      "",
      "| Area      | Tools                         | How I use them |",
      "|-----------|-------------------------------|----------------|",
      "| Frontend  | TypeScript, React, Next.js    | App Router, stateful UI, content surfaces |",
      "| Styling   | Tailwind, CSS, HTML           | Responsive systems and readable interaction |",
      "| Backend   | Java, Spring Boot             | APIs, business services, layered architecture |",
      "| Node side | Node, Nest                    | Tooling, route handlers, TS backend flows |",
      "| Data      | Prisma, PostgreSQL, MySQL     | Schema, queries, admin workflows |",
      "",
      "Preference: make the data shape and UI state obvious before polishing.",
    ],
  },
  "/home/skills/tools.md": {
    title: "tools.md",
    summary: "日常工作台和部署相关工具。",
    lines: [
      "# Tools",
      "",
      "Editors:     WebStorm / VS Code / Codex",
      "Shell:       zsh",
      "Infra:       Ubuntu / Docker / Nginx / Cloudflare",
      "Design:      Figma for layout density and visual rhythm",
      "Debugging:   browser screenshots, console logs, small repros",
      "",
      "I treat tools as feedback loops. The important question is not",
      "`can it run?`, but `can the next change be made with confidence?`",
    ],
  },
  "/home/projects/jiachz_blog.md": {
    title: "jiachz_blog.md",
    summary: "当前博客项目本身，包含文章、日报、News、Steam 价格等功能。",
    lines: [
      "# jiachz.com",
      "",
      "A personal blog and product playground built with Next.js 15.",
      "",
      "Interesting parts:",
      "  - Markdown reading surface with custom rendering polish",
      "  - Daily reports with tags and calendar reading mode",
      "  - News aggregation and saved preferences",
      "  - Steam regional price comparison",
      "  - Admin activity logs and security pages",
      "",
      `Source: ${SOURCE_CODE_GITHUB_PAGE}`,
    ],
  },
  "/home/projects/routelens.md": {
    title: "routelens.md",
    summary: "一个偏学习和工程边界的本地观测项目。",
    lines: [
      "# RouteLens",
      "",
      "A local-first C++20 observability learning project.",
      "",
      "Why it matters here:",
      "  - read-only by default",
      "  - no HTTPS MITM, firewall edits, or packet capture",
      "  - small parser/test steps before broader product ideas",
      "",
      "It is a good reminder that constraints are part of the design.",
    ],
  },
  "/home/projects/labs.md": {
    title: "labs.md",
    summary: "站点里持续迭代的小实验。",
    lines: [
      "# Labs",
      "",
      "news/          聚合实时热榜、技术社区和开源趋势",
      "daily-reports/ 按日期归档的自动化日报",
      "steam-prices/  Steam 多区官方价格实时比价",
      "messages/      留言和反馈入口",
      "",
      "Most experiments start as one practical question, then become a",
      "small route with enough polish to be used repeatedly.",
    ],
  },
  "/home/writing/blog.md": {
    title: "blog.md",
    summary: "内容输出的方向。",
    lines: [
      "# Writing",
      "",
      "I write to keep a trace of what I learned, built, and corrected.",
      "",
      "Recurring topics:",
      "  - frontend systems and interaction polish",
      "  - backend and data modeling notes",
      "  - local-first tooling experiments",
      "  - daily technical signal reports",
      "",
      `Read: ${PATHS.SITE_BLOG}`,
    ],
  },
  "/home/contact/links.md": {
    title: "links.md",
    summary: "公开联系入口。",
    lines: [
      "# Contact",
      "",
      `Email:    ${EMAIL}`,
      `GitHub:   ${GITHUB_PAGE}`,
      `Juejin:   ${JUEJIN_PAGE}`,
      `Bilibili: ${BILIBILI_PAGE}`,
      "",
      "Terminal shortcuts:",
      "  open github",
      "  open mail",
      "  open blog",
      "  open source",
    ],
  },
  "/home/.config/themes.md": {
    title: "themes.md",
    summary: "这个 TUI 页的本地主题配置。",
    lines: [
      "# Themes",
      "",
      "Available themes:",
      "  amber   default warm terminal",
      "  green   phosphor monitor",
      "  ice     cold cyan terminal",
      "  rose    soft neon pink",
      "",
      "Run:",
      "  theme amber",
      "  theme green",
      "  theme ice",
      "  theme rose",
    ],
  },
} satisfies Record<string, TuiFile>;

type FilePath = keyof typeof SITE_FILES;

const FILE_SYSTEM = {
  "/home": {
    folders: ["skills", "projects", "writing", "contact", ".config"],
    files: ["/home/home.txt", "/home/about.txt"],
  },
  "/home/skills": {
    folders: [],
    files: ["/home/skills/languages.md", "/home/skills/tools.md"],
  },
  "/home/projects": {
    folders: [],
    files: [
      "/home/projects/jiachz_blog.md",
      "/home/projects/routelens.md",
      "/home/projects/labs.md",
    ],
  },
  "/home/writing": {
    folders: [],
    files: ["/home/writing/blog.md"],
  },
  "/home/contact": {
    folders: [],
    files: ["/home/contact/links.md"],
  },
  "/home/.config": {
    folders: [],
    files: ["/home/.config/themes.md"],
  },
} satisfies Record<string, { folders: string[]; files: FilePath[] }>;

type DirectoryPath = keyof typeof FILE_SYSTEM;

const DEFAULT_FILE: FilePath = "/home/home.txt";
const DEFAULT_DIRECTORY: DirectoryPath = "/home";
const FLAT_FILE_PATHS = Object.keys(SITE_FILES) as FilePath[];
const DIRECTORY_PATHS = Object.keys(FILE_SYSTEM) as DirectoryPath[];

const EXPLORER_TREE: ExplorerNode[] = [
  {
    type: "folder",
    name: "home",
    path: "/home",
    children: [
      { type: "file", name: "home.txt", path: "/home/home.txt" },
      { type: "file", name: "about.txt", path: "/home/about.txt" },
      {
        type: "folder",
        name: "skills",
        path: "/home/skills",
        children: [
          {
            type: "file",
            name: "languages.md",
            path: "/home/skills/languages.md",
          },
          { type: "file", name: "tools.md", path: "/home/skills/tools.md" },
        ],
      },
      {
        type: "folder",
        name: "projects",
        path: "/home/projects",
        children: [
          {
            type: "file",
            name: "jiachz_blog.md",
            path: "/home/projects/jiachz_blog.md",
          },
          {
            type: "file",
            name: "routelens.md",
            path: "/home/projects/routelens.md",
          },
          { type: "file", name: "labs.md", path: "/home/projects/labs.md" },
        ],
      },
      {
        type: "folder",
        name: "writing",
        path: "/home/writing",
        children: [
          { type: "file", name: "blog.md", path: "/home/writing/blog.md" },
        ],
      },
      {
        type: "folder",
        name: "contact",
        path: "/home/contact",
        children: [
          { type: "file", name: "links.md", path: "/home/contact/links.md" },
        ],
      },
      {
        type: "folder",
        name: ".config",
        path: "/home/.config",
        children: [
          {
            type: "file",
            name: "themes.md",
            path: "/home/.config/themes.md",
          },
        ],
      },
    ],
  },
];

const INITIAL_EXPANDED_FOLDERS: DirectoryPath[] = [
  "/home",
  "/home/skills",
  "/home/projects",
];

const INITIAL_HISTORY: TerminalEntry[] = [
  {
    id: "boot",
    output: [
      "Boot sequence complete.",
      "Type `help` for commands, or click a file in Explorer.",
    ],
    tone: "muted",
  },
];

const LINK_TARGETS: Record<string, string> = {
  bilibili: BILIBILI_PAGE,
  blog: PATHS.SITE_BLOG,
  github: GITHUB_PAGE,
  juejin: JUEJIN_PAGE,
  mail: `mailto:${EMAIL}`,
  messages: PATHS.SITE_MESSAGES,
  source: SOURCE_CODE_GITHUB_PAGE,
};

export const TuiPortfolio = () => {
  const [activeFile, setActiveFile] = React.useState<FilePath>(DEFAULT_FILE);
  const [cwd, setCwd] = React.useState<DirectoryPath>(DEFAULT_DIRECTORY);
  const [themeId, setThemeId] = React.useState<ThemeId>("amber");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [terminalInput, setTerminalInput] = React.useState("");
  const [history, setHistory] =
    React.useState<TerminalEntry[]>(INITIAL_HISTORY);
  const [expandedFolders, setExpandedFolders] = React.useState(
    () => new Set<DirectoryPath>(INITIAL_EXPANDED_FOLDERS),
  );
  const terminalInputRef = React.useRef<HTMLInputElement>(null);
  const terminalScrollRef = React.useRef<HTMLDivElement>(null);
  const entryIdRef = React.useRef(0);

  const file = SITE_FILES[activeFile];
  const theme = THEMES[themeId];
  const prompt = `jiach@blog:${cwd}$`;
  const themeStyle = {
    "--tui-bg": theme.bg,
    "--tui-bg-light": theme.bgLight,
    "--tui-fg": theme.fg,
    "--tui-dim": theme.dim,
    "--tui-bright": theme.bright,
    "--tui-glow-rgb": theme.glow,
  } as React.CSSProperties;

  React.useEffect(() => {
    terminalScrollRef.current?.scrollTo({
      top: terminalScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history]);

  function selectFile(path: FilePath) {
    setActiveFile(path);
    const directory = getDirectoryFromFile(path);

    if (directory) {
      setCwd(directory);
      setExpandedFolders((current) => {
        const next = new Set(current);
        next.add(directory);
        next.add("/home");
        return next;
      });
    }
  }

  function toggleFolder(path: DirectoryPath) {
    setExpandedFolders((current) => {
      const next = new Set(current);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return next;
    });
  }

  function makeEntry(
    command: string,
    output: string[],
    options: { prompt?: string; tone?: TerminalEntry["tone"] } = {},
  ): TerminalEntry {
    entryIdRef.current += 1;

    return {
      id: `entry-${entryIdRef.current}`,
      prompt: options.prompt ?? prompt,
      command,
      output,
      tone: options.tone ?? "normal",
    };
  }

  function submitCommand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runTerminalCommand();
  }

  function handleCommandKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    runTerminalCommand();
  }

  function runTerminalCommand() {
    const command = terminalInput.trim();

    if (!command) {
      return;
    }

    setTerminalInput("");

    if (command === "clear") {
      setHistory([]);
      return;
    }

    const result = executeCommand(command);
    setHistory((current) => [
      ...current,
      makeEntry(command, result.output, { tone: result.tone }),
    ]);
  }

  function executeCommand(command: string): {
    output: string[];
    tone?: TerminalEntry["tone"];
  } {
    const [action = "", ...args] = command.split(/\s+/);
    const target = args.join(" ");

    switch (action.toLowerCase()) {
      case "help":
        return {
          output: [
            "Available commands:",
            "  ls [dir]          list files",
            "  cd <dir>          change directory",
            "  less <file>       open a file in the editor",
            "  cat <file>        print a file in terminal",
            "  pwd               print current directory",
            "  theme <name>      amber | green | ice | rose",
            "  open <target>     github | mail | blog | source",
            "  whoami            print a short profile",
            "  clear             clear terminal",
          ],
        };
      case "ls": {
        const directory = resolveDirectory(target || cwd, cwd);

        if (!directory) {
          return {
            output: [`ls: cannot access '${target}': No such directory`],
            tone: "error",
          };
        }

        return {
          output: listDirectory(directory),
        };
      }
      case "cd": {
        const directory = resolveDirectory(target || "/home", cwd);

        if (!directory) {
          return {
            output: [`cd: no such directory: ${target || "(empty)"}`],
            tone: "error",
          };
        }

        setCwd(directory);
        setExpandedFolders((current) => {
          const next = new Set(current);
          next.add(directory);
          next.add("/home");
          return next;
        });

        return {
          output: [`cwd -> ${directory}`],
          tone: "muted",
        };
      }
      case "pwd":
        return { output: [cwd] };
      case "less": {
        const path = resolveFilePath(target, cwd);

        if (!path) {
          return {
            output: [`less: ${target || "(empty)"}: No such file`],
            tone: "error",
          };
        }

        selectFile(path);
        return { output: [`opened ${SITE_FILES[path].title}`], tone: "muted" };
      }
      case "cat": {
        const path = resolveFilePath(target, cwd);

        if (!path) {
          return {
            output: [`cat: ${target || "(empty)"}: No such file`],
            tone: "error",
          };
        }

        return { output: SITE_FILES[path].lines };
      }
      case "theme": {
        if (!isThemeId(target)) {
          return {
            output: [`theme: choose one of ${THEME_ORDER.join(", ")}`],
            tone: "error",
          };
        }

        setThemeId(target);
        return { output: [`theme -> ${target}`], tone: "muted" };
      }
      case "open": {
        const href = LINK_TARGETS[target.toLowerCase()];

        if (!href) {
          return {
            output: [`open: unknown target '${target}'`],
            tone: "error",
          };
        }

        window.open(href, "_blank", "noreferrer");
        return { output: [`opening ${target} -> ${href}`], tone: "muted" };
      }
      case "whoami":
        return {
          output: [
            `${NICKNAME}: Full-Stack Developer`,
            "stack: Next.js / React / TypeScript / Java / Spring / Node",
            "mode: build small, verify clearly, keep learning",
          ],
        };
      default:
        return {
          output: [`${action}: command not found. Try 'help'.`],
          tone: "error",
        };
    }
  }

  function handleShellKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const target = event.target;

    if (target instanceof HTMLElement) {
      const tagName = target.tagName.toLowerCase();

      if (
        tagName === "input" ||
        tagName === "textarea" ||
        target.isContentEditable
      ) {
        return;
      }
    }

    if (event.key === "/") {
      event.preventDefault();
      terminalInputRef.current?.focus();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    event.preventDefault();
    const currentIndex = FLAT_FILE_PATHS.indexOf(activeFile);
    const nextIndex =
      event.key === "ArrowDown"
        ? (currentIndex + 1) % FLAT_FILE_PATHS.length
        : (currentIndex - 1 + FLAT_FILE_PATHS.length) % FLAT_FILE_PATHS.length;
    const nextFile = FLAT_FILE_PATHS[nextIndex] ?? activeFile;
    selectFile(nextFile);
  }

  return (
    <main
      className="tui-crt min-h-screen overflow-hidden bg-[var(--tui-bg)] text-[13px] leading-[1.4] text-[var(--tui-fg)]"
      style={themeStyle}
      onKeyDown={handleShellKeyDown}
      tabIndex={-1}
    >
      <div className="tui-border-glow flex h-screen max-h-screen flex-col border border-[var(--tui-dim)] bg-[var(--tui-bg)] font-mono">
        <TopStatusBar themeId={themeId} setThemeId={setThemeId} />

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_3px_minmax(148px,0.28fr)]">
          <div className="flex min-h-0">
            <ExplorerPanel
              activeFile={activeFile}
              expandedFolders={expandedFolders}
              nodes={EXPLORER_TREE}
              onSelectFile={selectFile}
              onToggleFolder={toggleFolder}
            />

            <EditorPanel activeFile={activeFile} file={file} />

            <button
              type="button"
              className="hidden w-6 shrink-0 items-center justify-center border-l border-[var(--tui-dim)] bg-[var(--tui-bg)] text-[10px] tracking-wider text-[var(--tui-fg)] transition-colors hover:bg-[var(--tui-bg-light)] md:flex"
              aria-pressed={previewOpen}
              onClick={() => setPreviewOpen((current) => !current)}
            >
              <span className="[writing-mode:vertical-rl]">PREVIEW</span>
            </button>

            {previewOpen && (
              <PreviewPanel activeFile={activeFile} file={file} />
            )}
          </div>

          <button
            type="button"
            aria-label="Resize terminal"
            className="h-[3px] w-full cursor-row-resize bg-transparent transition-colors hover:bg-[color:rgb(var(--tui-glow-rgb)/0.28)]"
          />

          <TerminalPanel
            history={history}
            input={terminalInput}
            inputRef={terminalInputRef}
            prompt={prompt}
            scrollRef={terminalScrollRef}
            onCommandKeyDown={handleCommandKeyDown}
            onInputChange={setTerminalInput}
            onSubmit={submitCommand}
          />
        </div>
      </div>
    </main>
  );
};

function TopStatusBar({
  setThemeId,
  themeId,
}: {
  setThemeId: (themeId: ThemeId) => void;
  themeId: ThemeId;
}) {
  return (
    <header className="grid min-h-9 grid-cols-1 gap-2 border-b border-[var(--tui-dim)] bg-[var(--tui-bg-light)] px-2 py-1 text-[11px] uppercase tracking-wider text-[var(--tui-dim)] sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-[var(--tui-fg)]">NOW PLAYING:</span>
        <span className="truncate">LOCAL BUILD / NOT STREAMING</span>
      </div>

      <div className="flex items-center justify-start gap-2 sm:justify-center">
        {THEME_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={themeId === id}
            className={cn(
              "border border-[var(--tui-dim)] px-2 py-0.5 transition-colors",
              themeId === id
                ? "bg-[var(--tui-fg)] text-[var(--tui-bg)]"
                : "text-[var(--tui-fg)] hover:bg-[var(--tui-bg)]",
            )}
            onClick={() => setThemeId(id)}
          >
            {THEMES[id].label}
          </button>
        ))}
      </div>

      <nav className="flex min-w-0 items-center gap-3 sm:justify-end">
        <Link
          className="hover:text-[var(--tui-bright)]"
          href={PATHS.SITE_ABOUT}
        >
          ABOUT
        </Link>
        <Link
          className="hover:text-[var(--tui-bright)]"
          href={GITHUB_PAGE}
          target="_blank"
          rel="noreferrer"
        >
          GITHUB
        </Link>
        <Link
          className="hover:text-[var(--tui-bright)]"
          href={`mailto:${EMAIL}`}
        >
          MAIL
        </Link>
      </nav>
    </header>
  );
}

function ExplorerPanel({
  activeFile,
  expandedFolders,
  nodes,
  onSelectFile,
  onToggleFolder,
}: {
  activeFile: FilePath;
  expandedFolders: Set<DirectoryPath>;
  nodes: ExplorerNode[];
  onSelectFile: (path: FilePath) => void;
  onToggleFolder: (path: DirectoryPath) => void;
}) {
  return (
    <aside
      aria-label="Explorer"
      className="hidden w-[210px] shrink-0 flex-col border-r border-[var(--tui-dim)] md:flex"
    >
      <div className="flex items-center justify-between border-b border-[var(--tui-dim)] px-2 py-1 text-[11px] uppercase tracking-wider">
        <span>Explorer</span>
        <span className="flex gap-2 text-[var(--tui-dim)]">
          <button
            type="button"
            className="hover:text-[var(--tui-bright)]"
            onClick={() => onToggleFolder("/home")}
          >
            ⊞
          </button>
          <span>x</span>
        </span>
      </div>

      <div className="tui-scrollbar min-h-0 flex-1 overflow-auto p-1">
        {nodes.map((node) => (
          <ExplorerTreeItem
            key={node.path}
            activeFile={activeFile}
            depth={0}
            expandedFolders={expandedFolders}
            node={node}
            onSelectFile={onSelectFile}
            onToggleFolder={onToggleFolder}
          />
        ))}
      </div>

      <p className="border-t border-[var(--tui-dim)] px-2 py-1 text-[10px] text-[var(--tui-dim)]">
        ↑↓ navigate · / terminal · ↵ select
      </p>
    </aside>
  );
}

function ExplorerTreeItem({
  activeFile,
  depth,
  expandedFolders,
  node,
  onSelectFile,
  onToggleFolder,
}: {
  activeFile: FilePath;
  depth: number;
  expandedFolders: Set<DirectoryPath>;
  node: ExplorerNode;
  onSelectFile: (path: FilePath) => void;
  onToggleFolder: (path: DirectoryPath) => void;
}) {
  const paddingLeft = `${depth * 0.75 + 0.25}rem`;

  if (node.type === "file") {
    const active = activeFile === node.path;

    return (
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-1 px-1 py-0.5 text-left text-[var(--tui-fg)] transition-colors hover:bg-[var(--tui-bg-light)]",
          active &&
            "bg-[color:rgb(var(--tui-glow-rgb)/0.16)] text-[var(--tui-bright)] tui-glow",
        )}
        style={{ paddingLeft }}
        onClick={() => onSelectFile(node.path)}
      >
        <span className="text-[10px] text-[var(--tui-dim)]">◇</span>
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  const expanded = expandedFolders.has(node.path);

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-1 px-1 py-0.5 text-left text-[var(--tui-fg)] transition-colors hover:bg-[var(--tui-bg-light)]"
        style={{ paddingLeft }}
        aria-expanded={expanded}
        onClick={() => onToggleFolder(node.path)}
      >
        <span className="text-[10px] text-[var(--tui-dim)]">
          {expanded ? "▾" : "▸"}
        </span>
        <span className="truncate">{node.name}</span>
      </button>

      {expanded &&
        node.children.map((child) => (
          <ExplorerTreeItem
            key={child.path}
            activeFile={activeFile}
            depth={depth + 1}
            expandedFolders={expandedFolders}
            node={child}
            onSelectFile={onSelectFile}
            onToggleFolder={onToggleFolder}
          />
        ))}
    </div>
  );
}

function EditorPanel({
  activeFile,
  file,
}: {
  activeFile: FilePath;
  file: TuiFile;
}) {
  return (
    <section aria-label="Editor" className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-7 shrink-0 items-center justify-between border-b border-[var(--tui-dim)] bg-[var(--tui-bg-light)] px-2 text-[11px]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[var(--tui-dim)]">@</span>
          <span className="truncate text-[var(--tui-fg)]">{file.title}</span>
          <span className="hidden truncate text-[var(--tui-dim)] sm:inline">
            {activeFile}
          </span>
        </div>
        <span className="text-[var(--tui-dim)]">x</span>
      </div>

      <div className="tui-scrollbar min-h-0 flex-1 overflow-auto p-2">
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3">
          {file.lines.map((line, index) => (
            <React.Fragment key={`${file.title}-${index}`}>
              <span className="select-none text-right text-[var(--tui-dim)]">
                {index + 1}
              </span>
              <span className="min-h-[1.4em] whitespace-pre-wrap break-words text-[var(--tui-fg)]">
                {line || " "}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewPanel({
  activeFile,
  file,
}: {
  activeFile: FilePath;
  file: TuiFile;
}) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-[var(--tui-dim)] bg-[var(--tui-bg-light)] xl:flex">
      <div className="border-b border-[var(--tui-dim)] px-2 py-1 text-[11px] uppercase tracking-wider">
        Preview
      </div>
      <div className="tui-scrollbar min-h-0 flex-1 space-y-4 overflow-auto p-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--tui-dim)]">
            selected
          </p>
          <h2 className="tui-glow mt-1 break-all text-lg font-bold text-[var(--tui-bright)]">
            {file.title}
          </h2>
          <p className="mt-2 text-[var(--tui-fg)]">{file.summary}</p>
        </div>

        <div className="border border-[var(--tui-dim)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--tui-dim)]">
            file path
          </p>
          <p className="mt-2 break-all text-[var(--tui-fg)]">{activeFile}</p>
        </div>

        <div className="grid gap-2">
          {[
            { label: "Blog", href: PATHS.SITE_BLOG },
            { label: "Messages", href: PATHS.SITE_MESSAGES },
            { label: "GitHub", href: GITHUB_PAGE, external: true },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className="border border-[var(--tui-dim)] px-3 py-2 text-[var(--tui-fg)] transition-colors hover:border-[var(--tui-bright)] hover:bg-[var(--tui-bg)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

function TerminalPanel({
  history,
  input,
  inputRef,
  onInputChange,
  onSubmit,
  prompt,
  scrollRef,
  onCommandKeyDown,
}: {
  history: TerminalEntry[];
  input: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onCommandKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  prompt: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <section className="flex min-h-0 flex-col border-t border-[var(--tui-dim)]">
      <button
        type="button"
        className="flex h-6 shrink-0 items-center gap-2 border-b border-[var(--tui-dim)] bg-[var(--tui-bg-light)] px-2 text-left text-[11px] uppercase tracking-wider"
        onClick={() => inputRef.current?.focus()}
      >
        <span>▼</span>
        <span>Terminal</span>
      </button>

      <div
        ref={scrollRef}
        role="region"
        aria-label="Command line"
        className="tui-scrollbar min-h-0 flex-1 overflow-auto p-2"
      >
        {history.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "mb-2",
              entry.tone === "muted" && "text-[var(--tui-dim)]",
              entry.tone === "error" && "text-[#ff6b6b]",
            )}
          >
            {entry.command && (
              <p>
                <span className="text-[var(--tui-bright)]">{entry.prompt}</span>{" "}
                {entry.command}
              </p>
            )}
            {entry.output.map((line, index) => (
              <p key={`${entry.id}-${index}`} className="whitespace-pre-wrap">
                {line || " "}
              </p>
            ))}
          </div>
        ))}

        <form className="flex items-center gap-2" onSubmit={onSubmit}>
          <label
            htmlFor="tui-command"
            className="shrink-0 text-[var(--tui-bright)]"
          >
            {prompt}
          </label>
          <input
            ref={inputRef}
            id="tui-command"
            type="text"
            value={input}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[var(--tui-fg)] caret-transparent outline-none"
            aria-label="Terminal command"
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onCommandKeyDown}
          />
          <span className="tui-cursor">_</span>
        </form>
      </div>
    </section>
  );
}

function getDirectoryFromFile(path: FilePath): DirectoryPath | undefined {
  const directory = path.slice(0, path.lastIndexOf("/"));

  return isDirectoryPath(directory) ? directory : undefined;
}

function isDirectoryPath(value: string): value is DirectoryPath {
  return DIRECTORY_PATHS.includes(value as DirectoryPath);
}

function isFilePath(value: string): value is FilePath {
  return FLAT_FILE_PATHS.includes(value as FilePath);
}

function isThemeId(value: string): value is ThemeId {
  return THEME_ORDER.includes(value as ThemeId);
}

function listDirectory(path: DirectoryPath) {
  const directory = FILE_SYSTEM[path];
  const folders = directory.folders.map((folder) => `${folder}/`);
  const files = directory.files.map((filePath) => SITE_FILES[filePath].title);

  return [...folders, ...files].length > 0
    ? [...folders, ...files]
    : ["(empty)"];
}

function resolveDirectory(
  target: string,
  currentDirectory: DirectoryPath,
): DirectoryPath | undefined {
  const nextTarget = target.trim();

  if (!nextTarget || nextTarget === ".") {
    return currentDirectory;
  }

  if (nextTarget === "..") {
    const parent =
      currentDirectory.split("/").slice(0, -1).join("/") || "/home";
    return isDirectoryPath(parent) ? parent : "/home";
  }

  const directPath = normalizePath(
    nextTarget.startsWith("/")
      ? nextTarget
      : `${currentDirectory}/${nextTarget}`,
  );

  if (isDirectoryPath(directPath)) {
    return directPath;
  }

  const homePath = normalizePath(`/home/${nextTarget}`);

  return isDirectoryPath(homePath) ? homePath : undefined;
}

function resolveFilePath(
  target: string,
  currentDirectory: DirectoryPath,
): FilePath | undefined {
  const nextTarget = target.trim();

  if (!nextTarget) {
    return undefined;
  }

  const directPath = normalizePath(
    nextTarget.startsWith("/")
      ? nextTarget
      : `${currentDirectory}/${nextTarget}`,
  );

  if (isFilePath(directPath)) {
    return directPath;
  }

  const homePath = normalizePath(`/home/${nextTarget}`);

  if (isFilePath(homePath)) {
    return homePath;
  }

  return FLAT_FILE_PATHS.find((path) => {
    const file = SITE_FILES[path];
    return file.title === nextTarget || path.endsWith(`/${nextTarget}`);
  });
}

function normalizePath(path: string) {
  return path.replace(/\/+/g, "/").replace(/\/$/, "");
}
