"use client";

import React from "react";

import {
  BrainCircuit,
  Code2,
  Database,
  Layers3,
  ServerCog,
  Wrench,
} from "lucide-react";

import {
  IconBrandGithub,
  IconLogoCloudflare,
  IconLogoGoogle,
  IconLogoVscodeDark,
  IconLogoVscodeLight,
  IconLogoWebstormDark,
  IconLogoWebstormLight,
  IconSkillCSS,
  IconSkillDocker,
  IconSkillFigmaDark,
  IconSkillFigmaLight,
  IconSkillHTML,
  IconSkillJavaDark,
  IconSkillJavaLight,
  IconSkillJavaScript,
  IconSkillMybatisDark,
  IconSkillMybatisLight,
  IconSkillMysqlDark,
  IconSkillMysqlLight,
  IconSkillNestjsDark,
  IconSkillNestjsLight,
  IconSkillNextjsDark,
  IconSkillNextjsLight,
  IconSkillNginx,
  IconSkillNodejsDark,
  IconSkillNodejsLight,
  IconSkillPostgresqlDark,
  IconSkillPostgresqlLight,
  IconSkillPrisma,
  IconSkillReactDark,
  IconSkillReactLight,
  IconSkillSpringDark,
  IconSkillSpringLight,
  IconSkillStackoverflowDark,
  IconSkillStackoverflowLight,
  IconSkillTailwindcssDark,
  IconSkillTailwindcssLight,
  IconSkillTypeScript,
  IconSkillUbuntuDark,
  IconSkillUbuntuLight,
} from "@/components/icons";

import { cn } from "@/lib/utils";

type SkillGroupId = "all" | "frontend" | "backend" | "infra" | "tools";

type Skill = {
  id: string;
  name: string;
  group: Exclude<SkillGroupId, "all">;
  signal: string;
  description: string;
  icon: React.ReactNode;
};

const GROUPS: Array<{
  id: SkillGroupId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "all", label: "All", icon: BrainCircuit },
  { id: "frontend", label: "Frontend", icon: Code2 },
  { id: "backend", label: "Backend", icon: Database },
  { id: "infra", label: "Infra", icon: ServerCog },
  { id: "tools", label: "Tools", icon: Wrench },
];

const SKILLS: Skill[] = [
  {
    id: "typescript",
    name: "TypeScript",
    group: "frontend",
    signal: "类型约束",
    description: "把 UI、API 数据和复杂状态先变成可推断的工程边界。",
    icon: <IconSkillTypeScript />,
  },
  {
    id: "react",
    name: "React",
    group: "frontend",
    signal: "交互层",
    description: "用组件拆解页面体验，优先让状态流向清晰且可维护。",
    icon: (
      <>
        <IconSkillReactDark className="dark:hidden" />
        <IconSkillReactLight className="hidden dark:inline-block" />
      </>
    ),
  },
  {
    id: "next",
    name: "Next.js",
    group: "frontend",
    signal: "站点骨架",
    description: "用 App Router、Route Handler 和缓存边界承载内容型产品。",
    icon: (
      <>
        <IconSkillNextjsDark className="dark:hidden" />
        <IconSkillNextjsLight className="hidden dark:inline-block" />
      </>
    ),
  },
  {
    id: "tailwind",
    name: "Tailwind",
    group: "frontend",
    signal: "视觉系统",
    description: "把未来感玻璃、响应式间距和细粒度状态写进可复用 class。",
    icon: (
      <>
        <IconSkillTailwindcssDark className="dark:hidden" />
        <IconSkillTailwindcssLight className="hidden dark:inline-block" />
      </>
    ),
  },
  {
    id: "html-css-js",
    name: "HTML / CSS / JS",
    group: "frontend",
    signal: "基础功",
    description: "语义、布局和浏览器行为是所有花哨交互的底层约束。",
    icon: (
      <span className="flex items-center gap-1">
        <IconSkillHTML />
        <IconSkillCSS />
        <IconSkillJavaScript />
      </span>
    ),
  },
  {
    id: "java",
    name: "Java",
    group: "backend",
    signal: "业务服务",
    description: "面向后端业务建模、接口组织和稳定服务交付。",
    icon: (
      <>
        <IconSkillJavaDark className="dark:hidden" />
        <IconSkillJavaLight className="hidden dark:inline-block" />
      </>
    ),
  },
  {
    id: "spring",
    name: "Spring Boot",
    group: "backend",
    signal: "服务框架",
    description: "处理分层架构、接口编排、数据库访问和常规后端能力。",
    icon: (
      <>
        <IconSkillSpringDark className="dark:hidden" />
        <IconSkillSpringLight className="hidden dark:inline-block" />
      </>
    ),
  },
  {
    id: "node-nest",
    name: "Node / Nest",
    group: "backend",
    signal: "TS 后端",
    description: "更贴近前端工程的后端 API、任务编排和工具服务。",
    icon: (
      <span className="flex items-center gap-1">
        <span>
          <IconSkillNodejsDark className="dark:hidden" />
          <IconSkillNodejsLight className="hidden dark:inline-block" />
        </span>
        <span>
          <IconSkillNestjsDark className="dark:hidden" />
          <IconSkillNestjsLight className="hidden dark:inline-block" />
        </span>
      </span>
    ),
  },
  {
    id: "data",
    name: "Prisma / SQL",
    group: "backend",
    signal: "数据层",
    description: "用 Prisma、PostgreSQL、MySQL 和 MyBatis 描述数据流转。",
    icon: (
      <span className="flex items-center gap-1">
        <IconSkillPrisma />
        <span>
          <IconSkillPostgresqlDark className="dark:hidden" />
          <IconSkillPostgresqlLight className="hidden dark:inline-block" />
        </span>
        <span>
          <IconSkillMysqlDark className="dark:hidden" />
          <IconSkillMysqlLight className="hidden dark:inline-block" />
        </span>
        <span>
          <IconSkillMybatisDark className="dark:hidden" />
          <IconSkillMybatisLight className="hidden dark:inline-block" />
        </span>
      </span>
    ),
  },
  {
    id: "linux",
    name: "Ubuntu",
    group: "infra",
    signal: "运行环境",
    description: "理解服务在真实机器上的部署、权限、网络和日志。",
    icon: (
      <>
        <IconSkillUbuntuDark className="dark:hidden" />
        <IconSkillUbuntuLight className="hidden dark:inline-block" />
      </>
    ),
  },
  {
    id: "docker",
    name: "Docker",
    group: "infra",
    signal: "交付单元",
    description: "让开发、构建和部署有更清晰的运行边界。",
    icon: <IconSkillDocker />,
  },
  {
    id: "edge",
    name: "Nginx / Cloudflare",
    group: "infra",
    signal: "边缘入口",
    description: "反向代理、DNS、HTTPS 和访问入口层是站点体验的一部分。",
    icon: (
      <span className="flex items-center gap-1">
        <IconSkillNginx />
        <IconLogoCloudflare />
      </span>
    ),
  },
  {
    id: "figma",
    name: "Figma",
    group: "tools",
    signal: "设计草图",
    description: "把抽象想法变成能落地的布局、密度和视觉节奏。",
    icon: (
      <>
        <IconSkillFigmaDark className="dark:hidden" />
        <IconSkillFigmaLight className="hidden dark:inline-block" />
      </>
    ),
  },
  {
    id: "research",
    name: "Search / GitHub / SO",
    group: "tools",
    signal: "问题定位",
    description: "用搜索、源码、社区讨论和 AI 协作快速缩小未知范围。",
    icon: (
      <span className="flex items-center gap-1">
        <IconLogoGoogle />
        <IconBrandGithub />
        <span>
          <IconSkillStackoverflowDark className="dark:hidden" />
          <IconSkillStackoverflowLight className="hidden dark:inline-block" />
        </span>
      </span>
    ),
  },
  {
    id: "ide",
    name: "WebStorm / VSCode",
    group: "tools",
    signal: "日常工作台",
    description: "围绕编辑器、终端和自动化命令组织持续开发流程。",
    icon: (
      <span className="flex items-center gap-1">
        <span>
          <IconLogoWebstormDark className="dark:hidden" />
          <IconLogoWebstormLight className="hidden dark:inline-block" />
        </span>
        <span>
          <IconLogoVscodeDark className="dark:hidden" />
          <IconLogoVscodeLight className="hidden dark:inline-block" />
        </span>
      </span>
    ),
  },
];

export const SkillConstellation = () => {
  const [selectedGroup, setSelectedGroup] = React.useState<SkillGroupId>("all");
  const [activeSkillId, setActiveSkillId] = React.useState(SKILLS[0]?.id);
  const visibleSkills = SKILLS.filter(
    (skill) => selectedGroup === "all" || skill.group === selectedGroup,
  );
  const activeSkill =
    visibleSkills.find((skill) => skill.id === activeSkillId) ??
    visibleSkills[0];

  return (
    <section
      data-about-reveal
      className="future-panel-strong relative isolate overflow-hidden rounded-[2rem] p-5 md:p-6"
    >
      <div className="absolute inset-0 -z-10 opacity-80 [background-image:linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute left-1/2 top-16 -z-10 size-72 -translate-x-1/2 rounded-full border border-[var(--future-line)] opacity-50" />
      <div className="absolute left-1/2 top-8 -z-10 size-96 -translate-x-1/2 rounded-full border border-[var(--future-line)] opacity-30" />

      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="future-label mb-3">Skill Constellation</p>
          <h2 className="text-3xl font-black leading-tight text-[var(--future-ink)] md:text-4xl">
            技术栈从列表变成可探索地图
          </h2>
          <p className="future-muted mt-3 max-w-2xl text-sm leading-6 md:text-base">
            Hover 或聚焦一个节点，看它在这个站点里的实际用途。这里不是能力打分，
            更像一张工程现场的关系图。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {GROUPS.map((group) => {
            const Icon = group.icon;
            const active = selectedGroup === group.id;

            return (
              <button
                key={group.id}
                type="button"
                aria-pressed={active}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full border px-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] transition duration-200",
                  active
                    ? "border-[var(--future-accent)] bg-[var(--future-accent-soft)] text-[var(--future-ink)]"
                    : "border-[var(--future-line)] bg-white/[0.04] text-[var(--future-muted)] hover:border-[var(--future-cyan)] hover:text-[var(--future-ink)]",
                )}
                onClick={() => setSelectedGroup(group.id)}
              >
                <Icon className="size-3.5" />
                {group.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="relative min-h-[360px] rounded-3xl border border-[var(--future-line)] bg-black/[0.07] p-4 dark:bg-black/20">
          <div className="pointer-events-none absolute inset-8 rounded-full border border-dashed border-[var(--future-line)] opacity-60" />
          <div className="pointer-events-none absolute inset-20 rounded-full border border-dashed border-[var(--future-line)] opacity-40" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 grid size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[var(--future-line)] bg-[var(--future-panel-strong)] shadow-2xl backdrop-blur-xl">
            <Layers3 className="size-9 text-[var(--future-accent)]" />
            <span className="future-label mt-2 block text-center">Stack</span>
          </div>

          <div className="relative z-[1] grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visibleSkills.map((skill, index) => {
              const active = activeSkill?.id === skill.id;

              return (
                <button
                  key={skill.id}
                  type="button"
                  className={cn(
                    "group min-h-[104px] rounded-2xl border p-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--future-accent)]",
                    active
                      ? "border-[var(--future-accent)] bg-[var(--future-accent-soft)] shadow-[0_0_34px_rgb(223_114_69/0.18)]"
                      : "border-[var(--future-line)] bg-white/[0.05] hover:-translate-y-1 hover:border-[var(--future-cyan)] hover:bg-white/[0.08]",
                  )}
                  style={{
                    transform: `translateY(${index % 2 === 0 ? 0 : 18}px)`,
                  }}
                  onFocus={() => setActiveSkillId(skill.id)}
                  onMouseEnter={() => setActiveSkillId(skill.id)}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-2xl text-[var(--future-ink)]">
                      {skill.icon}
                    </span>
                    <span className="rounded-full border border-[var(--future-line)] px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--future-muted)]">
                      {skill.group}
                    </span>
                  </span>
                  <span className="mt-3 block truncate text-sm font-bold text-[var(--future-ink)]">
                    {skill.name}
                  </span>
                  <span className="future-muted mt-1 block truncate text-xs">
                    {skill.signal}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="flex min-h-[360px] flex-col justify-between rounded-3xl border border-[var(--future-line)] bg-white/[0.04] p-5">
          {activeSkill && (
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-14 place-items-center rounded-2xl border border-[var(--future-line)] bg-white/[0.08] text-3xl">
                  {activeSkill.icon}
                </span>
                <div>
                  <p className="future-label">{activeSkill.group}</p>
                  <h3 className="mt-1 text-2xl font-black text-[var(--future-ink)]">
                    {activeSkill.name}
                  </h3>
                </div>
              </div>
              <p className="text-lg font-semibold text-[var(--future-accent)]">
                {activeSkill.signal}
              </p>
              <p className="future-muted mt-3 text-sm leading-7">
                {activeSkill.description}
              </p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-[var(--future-line)] pt-5">
            {GROUPS.filter((group) => group.id !== "all").map((group) => {
              const count = SKILLS.filter(
                (skill) => skill.group === group.id,
              ).length;

              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-[var(--future-line)] bg-white/[0.04] p-3"
                >
                  <p className="font-mono text-xs text-[var(--future-muted)]">
                    {group.label}
                  </p>
                  <p className="mt-2 font-mono text-2xl font-black text-[var(--future-ink)]">
                    {count}
                  </p>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
};
