"use client";

import Link from "next/link";
import { useState } from "react";

const GUIDES = [
  { slug: "roof", title: "Roof", description: "Materials, lifespans, failure timelines, inspection, and finding a roofer who won't upsell you.", icon: "🏠", readTime: "18 min", topics: ["Asphalt shingles", "Metal roofing", "Flashing", "Ice dams", "Post-storm inspection"] },
  { slug: "siding", title: "Siding", description: "Every material explained, what fails and why, and how to catch water intrusion early.", icon: "🪵", readTime: "15 min", topics: ["Vinyl", "Fiber cement", "Engineered wood", "Stucco & EIFS", "Flashing"] },
  { slug: "gutters", title: "Gutters, Fascia & Soffits", description: "How your drainage system works, what fails first, and why clean gutters protect your foundation.", icon: "🌧️", readTime: "12 min", topics: ["Seamless aluminum", "Fascia rot", "Downspout drainage", "Gutter guards", "Cleaning frequency"] },
  { slug: "windows", title: "Windows", description: "Frame materials, glazing performance, seal failure, and what the energy ratings actually mean.", icon: "🪟", readTime: "13 min", topics: ["U-factor & SHGC", "Double vs. triple pane", "Seal failure", "Frame materials", "IGU replacement"] },
  { slug: "entry-doors", title: "Entry Doors", description: "Door materials, security ratings, weatherstripping maintenance, and when to replace.", icon: "🚪", readTime: "11 min", topics: ["Steel vs. fiberglass", "Weatherstripping", "Deadbolts", "Threshold seals", "Frame rot"] },
  { slug: "sliding-doors", title: "Sliding Glass Doors", description: "Track systems, roller maintenance, security details, and how to fix most problems yourself.", icon: "🪟", readTime: "10 min", topics: ["Rollers & track", "Anti-lift pins", "Pile weatherstripping", "IGU failure", "Security"] },
  { slug: "hvac", title: "HVAC", description: "System types, key components, failure timeline, and the repair vs. replace decision.", icon: "❄️", readTime: "14 min", topics: ["Split systems", "Heat pumps", "Capacitors", "Refrigerant", "The 5,000 rule"] },
  { slug: "water-heater", title: "Water Heater", description: "Tank vs. tankless, maintenance that matters, and how to replace before a failure causes damage.", icon: "🔥", readTime: "12 min", topics: ["Tank vs. tankless", "Anode rod", "TPR valve", "Heat pump units", "When to replace"] },
];

export default function GuidesIndexPage() {
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-amber-600 font-semibold text-lg">🏡 Hearth</Link>
          <Link href="/signup" className="text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg transition-colors">Track your home free</Link>
        </div>
      </div>

      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-stone-900 leading-tight mb-3">The Hearth Home Guide</h1>
            <p className="text-xl text-stone-600 leading-relaxed">Deep-dive guides on every major home system. Written for homeowners who want to actually understand their home — not just get a quote.</p>
            <div className="flex items-center gap-4 mt-6 text-sm text-stone-500">
              <span>8 complete guides</span><span>·</span><span>80+ articles</span><span>·</span><span>Free, no login required</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GUIDES.map((guide) => (
            <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group bg-white rounded-2xl border border-stone-200 p-6 hover:border-amber-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-3xl">{guide.icon}</span>
                <span className="text-xs text-stone-400 mt-1">{guide.readTime}</span>
              </div>
              <h2 className="font-bold text-stone-900 text-lg mb-2 group-hover:text-amber-700 transition-colors">{guide.title}</h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-4">{guide.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {guide.topics.slice(0, 3).map((topic) => (
                  <span key={topic} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{topic}</span>
                ))}
                {guide.topics.length > 3 && <span className="text-xs text-stone-400 px-2 py-0.5">+{guide.topics.length - 3} more</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-3xl mb-3">💬</p>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">What do you want to learn?</h2>
            <p className="text-stone-500 mb-8 leading-relaxed">We write guides based on what homeowners actually want to know. Submit a question and we'll add it to our content calendar.</p>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
                <p className="text-3xl mb-3">✅</p>
                <p className="font-semibold text-green-900 text-lg">Got it — thank you!</p>
                <p className="text-green-700 text-sm mt-2">We'll notify you when it's published if you left an email.</p>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What do you want to understand better about your home?" className="w-full border border-stone-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none text-stone-800 placeholder:text-stone-400" rows={4} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional — we'll notify you when it's published)" className="w-full border border-stone-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-stone-800 placeholder:text-stone-400" />
                <button onClick={() => { if (question.trim()) { console.log({ question, email }); setSubmitted(true); } }} disabled={!question.trim()} className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-2xl text-sm transition-colors">Submit request</button>
                <p className="text-xs text-stone-400 text-center">No account required. We read every submission.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Ready to track your home?</h3>
            <p className="text-amber-100 text-sm">Log your systems, get smart maintenance reminders, and build a verified home history — free.</p>
          </div>
          <Link href="/signup" className="flex-shrink-0 bg-white text-amber-600 hover:bg-amber-50 font-semibold px-6 py-3 rounded-xl transition-colors text-sm">Create your free account</Link>
        </div>
      </div>
    </div>
  );
}
