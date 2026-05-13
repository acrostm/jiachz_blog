import { GsapReveal } from "@/components/motion/gsap-reveal";
import { Wrapper } from "@/components/wrapper";

import { BlogList, getPublishedBlogs } from "@/features/blog";

export const revalidate = 60;

export default async function Page() {
  const { blogs, total, uvMap } = await getPublishedBlogs();
  const totalViews = Object.values(uvMap ?? {}).reduce(
    (sum, value) => sum + value,
    0,
  );

  return (
    <Wrapper className="flex min-h-screen flex-col px-6 pb-24 pt-12">
      <GsapReveal>
        <section className="relative mb-10 overflow-hidden rounded-[2rem] border border-[var(--future-line)] px-6 py-10 md:px-10 md:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgb(223_114_69/0.18),transparent_32%),radial-gradient(circle_at_88%_16%,rgb(34_211_238/0.16),transparent_28%)]" />
          <div className="relative z-[1] grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div data-gsap-reveal>
              <div className="mb-6 flex items-center gap-3">
                <span className="future-label">Blog Index</span>
                <span className="h-px w-16 bg-[color:var(--future-accent)] opacity-55" />
              </div>
              <h1 className="future-heading max-w-4xl text-5xl font-black leading-[0.95] md:text-7xl">
                工程笔记，
                <br />
                在暗场里发光。
              </h1>
              <p className="future-muted mt-6 max-w-2xl text-base leading-8 md:text-lg">
                这里收集软件开发、系统设计、AI 工具链和真实项目里的决策记录。
                每篇文章都是一个可复盘的现场切片。
              </p>
            </div>

            <div
              data-gsap-reveal
              className="future-panel grid grid-cols-2 gap-4 rounded-3xl p-5"
            >
              <div>
                <p className="future-label">Articles</p>
                <p className="mt-3 font-mono text-4xl font-semibold tracking-normal">
                  {String(total).padStart(2, "0")}
                </p>
              </div>
              <div>
                <p className="future-label">Reads</p>
                <p className="mt-3 font-mono text-4xl font-semibold tracking-normal">
                  {totalViews}
                </p>
              </div>
              <div className="col-span-2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <p className="future-muted col-span-2 text-sm leading-6">
                随发布状态自动更新，不引入新的内容模型。
              </p>
            </div>
          </div>
        </section>

        <BlogList blogs={blogs} uvMap={uvMap} />
      </GsapReveal>
    </Wrapper>
  );
}
