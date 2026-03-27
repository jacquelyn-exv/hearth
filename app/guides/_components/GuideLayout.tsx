"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import type { GuideSection } from "../../../types";

interface GuideLayoutProps {
  title: string;
  subtitle: string;
  icon: string;
  readTime: string;
  lastUpdated: string;
  sections: GuideSection[];
  children: ReactNode;
  relatedGuides?: { slug: string; title: string; icon: string }[];
}

function ContentRequestForm({ relatedGuide }: { relatedGuide: string }) {
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-semibold text-green-800">Got it — thanks!</p>
        <p className="text-sm text-green-700 mt-1">We review every request and publish the most popular ones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What do you want to learn about?" className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" rows={3} />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional — we'll notify you when it's published)" className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      <button onClick={() => { if (question.trim()) { console.log({ question, email, relatedGuide }); setSubmitted(true); } }} disabled={!question.trim()} className="w-full bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-white font-medium py-3 rounded-xl text-sm transition-colors">
        Submit request
      </button>
    </div>
  );
}

export default function GuideLayout({ title, subtitle, icon, readTime, lastUpdated, sections, children, relatedGuides = [] }: GuideLayoutProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.anchor || "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); },
      { rootMargin: "-20% 0% -60% 0%", threshold: 0 }
    );
    sections.forEach(({ anchor }) => { const el = document.getElementById(anchor); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-amber-600 font-semibold text-base">🏡 Hearth</Link>
            <span className="text-stone-300">/</span>
            <Link href="/guides" className="text-stone-500 hover:text-stone-700 transition-colors">Guides</Link>
            <span className="text-stone-300">/</span>
            <span className="text-stone-800 font-medium truncate max-w-[160px]">{title}</span>
          </div>
          <Link href="/signup" className="hidden sm:flex items-center gap-1.5 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg transition-colors">
            Track your home free
          </Link>
        </div>
      </div>

      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{icon}</span>
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <span>{readTime} read</span>
                <span>·</span>
                <span>Updated {new Date(lastUpdated).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 leading-tight mb-3">{title}</h1>
            <p className="text-lg text-stone-600 leading-relaxed">{subtitle}</p>
            <div className="flex flex-wrap gap-2 mt-6">
              {sections.map((s) => (
                <a key={s.anchor} href={`#${s.anchor}`} className="text-xs font-medium px-3 py-1.5 bg-stone-100 hover:bg-amber-50 hover:text-amber-700 text-stone-600 rounded-full transition-colors">{s.title}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex gap-10 items-start">
          <article className="flex-1 min-w-0">{children}</article>
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-20 space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">In this guide</p>
              <nav className="space-y-0.5">
                {sections.map((s) => (
                  <a key={s.anchor} href={`#${s.anchor}`} className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${activeSection === s.anchor ? "bg-amber-50 text-amber-700 font-medium" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"}`}>{s.title}</a>
                ))}
              </nav>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="font-semibold text-amber-900 text-sm mb-1">Track your home in Hearth</p>
              <p className="text-xs text-amber-700 mb-3 leading-relaxed">Log your systems, get smart maintenance reminders, and build a verified history — free.</p>
              <Link href="/signup" className="block text-center text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-colors">Get started free</Link>
            </div>
            {relatedGuides.length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Related guides</p>
                <div className="space-y-1">
                  {relatedGuides.map((g) => (
                    <Link key={g.slug} href={`/guides/${g.slug}`} className="flex items-center gap-2 text-sm text-stone-600 hover:text-amber-600 py-1.5 transition-colors">
                      <span>{g.icon}</span><span>{g.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <div className="border-t border-stone-200 bg-white mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-2xl mb-2">💬</p>
            <h3 className="font-semibold text-stone-900 mb-1">Still have questions?</h3>
            <p className="text-sm text-stone-500 mb-4">Tell us what you want to learn about and we'll write it.</p>
            <ContentRequestForm relatedGuide={title} />
          </div>
        </div>
      </div>
    </div>
  );
}
