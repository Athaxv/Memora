"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What is Memory OS and how does it work?",
    answer: "Memory OS is an AI-powered second brain that captures everything you choose to remember — links, notes, messages, PDFs — and organizes them into a semantic knowledge graph. Every item is auto-summarized, tagged, and connected to related memories using vector embeddings.",
  },
  {
    question: "How is this different from Notion or a bookmarking app?",
    answer: "Bookmarking apps store links. Notion requires manual organization. Memory OS does both automatically — it extracts content, generates summaries, applies AI tags, and builds connections between your memories without you lifting a finger. Think of it as a search engine for your own knowledge.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Yes. Your data is stored in an encrypted database and never shared with other users. AI processing happens through secure API calls and we never train models on your data. You can export or delete your data at any time.",
  },
  {
    question: "What sources can I capture from?",
    answer: "You can capture from anywhere: browser extension (Chrome, Firefox), WhatsApp forwarding, email forwarding, manual notes, file uploads (PDFs, images, text), social bookmarks (Twitter/X, Reddit), and our REST API for custom integrations.",
  },
  {
    question: "How does the AI tagging and linking work?",
    answer: "When you save something, our AI reads the content, generates a concise summary, extracts 3-8 descriptive tags, creates a vector embedding, and then finds semantically similar memories already in your graph. Related items are automatically linked — no manual tagging needed.",
  },
  {
    question: "Can I export my data?",
    answer: "Absolutely. Memory OS supports full data export in standard formats (JSON, Markdown). We also offer two-way sync with Notion and Obsidian. Your knowledge belongs to you — we never lock it in.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative w-full border-b border-zinc-200/80 flex justify-center z-10 bg-transparent">
      <div className="flex w-full max-w-[1200px] flex-col items-center px-6 py-24 md:px-10 lg:px-12 relative">
        {/* Architect limits */}
        <div className="absolute left-0 right-0 top-0 h-px border-t border-dashed border-zinc-200/80 pointer-events-none hidden lg:block z-0" />

        <div className="w-full max-w-3xl relative z-10">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d97706] mb-3">
              Got questions?
            </p>
            <h2 className="text-[2rem] md:text-[3rem] font-bold text-zinc-900 tracking-tight">
              <span className="italic font-serif text-[#111118]">Frequently </span>
              <span className="font-sans">asked</span>
            </h2>
          </div>

          <div className="flex flex-col border-t border-zinc-200">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-zinc-200">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between py-5 text-left transition-colors hover:bg-zinc-50/50"
                  aria-expanded={openIndex === index}
                >
                  <span className="text-[14px] font-bold text-zinc-900 tracking-tight pr-8">
                    {faq.question}
                  </span>
                  <div className={cn("text-zinc-400 transition-transform duration-300", openIndex === index ? "rotate-90" : "")}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    openIndex === index ? "max-h-40 opacity-100 mb-5" : "max-h-0 opacity-0"
                  )}
                >
                  <p className="text-[14px] text-zinc-600 leading-relaxed pr-8">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center text-[13px] font-medium text-zinc-600">
             Can&rsquo;t find your answer here? <Link href="/contact" className="text-[#d97706] underline underline-offset-4 decoration-[#fbbf9b] hover:decoration-[#d97706] transition-colors">Get in touch</Link>.
          </div>
        </div>
      </div>
    </section>
  );
}
