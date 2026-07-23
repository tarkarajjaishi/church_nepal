'use client'

import { useState } from "react";
import Link from 'next/link';
import { Radio, Users, Send, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/site/PageHero";
import { EditableBlock } from "@/components/site/EditableBlock";
import { Reveal } from "@/components/site/Reveal";
import { useServiceTimes, useContentBlock } from "@/lib/hooks";
import { images } from "@/lib/data";

interface ChatMessage {
  id: string;
  name: string;
  text: string;
}

const FALLBACK_CHAT: ChatMessage[] = [
  { id: "c1", name: "Sunita", text: "Praise God! Worshipping from Pokhara 🙏" },
  { id: "c2", name: "Ramesh", text: "Amen! Powerful message today." },
  { id: "c3", name: "Kabita", text: "Blessings to everyone joining online ❤️" },
];

export default function Live() {
  const { data: serviceTimes = [] } = useServiceTimes();

  const heroBlock = useContentBlock("live_hero");
  const streamBlock = useContentBlock("live_stream");
  const chatHeadingBlock = useContentBlock("live_chat_heading");
  const chatMessagesBlock = useContentBlock("live_chat_messages");
  const scheduleBlock = useContentBlock("live_schedule");

  const heroItems = heroBlock?.items?.[0] || {};
  const streamItems = streamBlock?.items?.[0] || {};
  const chatHeadingItems = chatHeadingBlock?.items?.[0] || {};
  const scheduleItems = scheduleBlock?.items?.[0] || {};

  const initialMessages: ChatMessage[] = Array.isArray(chatMessagesBlock?.items)
    ? chatMessagesBlock.items.map((m: any, i: number) => ({ id: `cm${i}`, name: m.name || "Guest", text: m.text || "" }))
    : FALLBACK_CHAT;

  const [chat, setChat] = useState<ChatMessage[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [viewers, setViewers] = useState(342);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setChat((prev) => [...prev, { id: `c${Date.now()}`, name: "You", text }]);
    setMessage("");
    setViewers((v) => v + 1);
  }

  return (
    <div>
      <EditableBlock block={heroBlock}>
        <PageHero
          title={heroBlock?.title || "Join Us Live"}
          crumb={heroItems.eyebrow || "Live Stream"}
          image={heroBlock?.image || images.band}
          subtitle={heroBlock?.subtitle || "Can't be with us in person? Worship along with our congregation from anywhere in the world."}
        />
      </EditableBlock>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-3 gap-8">
          <EditableBlock block={streamBlock}>
            <Reveal className="lg:col-span-2">
              <Card className="overflow-hidden border-border/60">
                <div className="relative aspect-video bg-church-blue grid place-items-center">
                  {streamItems.youtubeUrl ? (
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${streamItems.youtubeUrl.includes('v=') ? new URLSearchParams(streamItems.youtubeUrl.split('?')[1]).get('v') : streamItems.youtubeUrl.split('/').pop()}?autoplay=0&rel=0`}
                      title={streamBlock?.title || "Sunday Celebration Service"}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <img src={streamBlock?.image || images.praise} alt="Live worship" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                      <div className="relative text-center text-white">
                        <Badge className="bg-red-600 text-white border-0 mb-3"><span className="mr-1.5 inline-block size-2 rounded-full bg-white animate-pulse" /> {streamItems.badge || "LIVE"}</Badge>
                        <h3 className="text-white" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.5rem" }}>{streamBlock?.title || "Sunday Celebration Service"}</h3>
                        <p className="text-white/70 mt-1 flex items-center justify-center gap-2"><Users className="size-4" /> {viewers} watching now</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{streamBlock?.title || "Sunday Celebration Service"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{streamBlock?.subtitle || "Join us for worship, the Word, and prayer. God is doing something beautiful — and you're part of it."}</p>
                </div>
              </Card>
            </Reveal>
          </EditableBlock>

          <EditableBlock block={chatHeadingBlock}>
            <Reveal delay={0.1}>
              <Card className="border-border/60 flex flex-col h-full">
                <div className="p-4 border-b flex items-center gap-2 text-church-blue"><Radio className="size-4 text-gold" /> <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{chatHeadingBlock?.title || "Live Chat"}</span></div>
                <div className="p-4 space-y-3 flex-1 min-h-[240px] max-h-[360px] overflow-y-auto">
                  {chat.map((c) => (
                    <div key={c.id} className="text-sm">
                      <span className={c.name === "You" ? "text-gold" : "text-church-blue"} style={{ fontWeight: 600 }}>{c.name}: </span>
                      <span className="text-muted-foreground">{c.text}</span>
                    </div>
                  ))}
                </div>
                <form className="p-4 border-t flex gap-2" onSubmit={sendMessage}>
                  <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={chatHeadingItems.placeholder || "Say something kind..."} />
                   <Button type="submit" size="icon" className="bg-church-blue hover:bg-church-blue/90 shrink-0" aria-label="Send message"><Send className="size-4" /></Button>
                </form>
              </Card>
            </Reveal>
          </EditableBlock>
        </div>

        <EditableBlock block={scheduleBlock}>
          <div className="mx-auto max-w-7xl px-4 mt-12">
            <Card className="p-6 border-border/60">
              <div className="flex items-center gap-2 text-church-blue mb-4"><Calendar className="size-5 text-gold" /> <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{scheduleBlock?.title || "Weekly Live Schedule"}</span></div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {serviceTimes.slice(0, 4).map((s) => (
                  <div key={s.id} className="rounded-xl bg-section p-4">
                    <div className="text-church-blue" style={{ fontWeight: 600 }}>{s.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{s.day} · {s.time}</div>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-6 bg-gold text-church-blue hover:bg-gold/90"><Link href={scheduleItems.ctaLink || "/events"}>{scheduleItems.ctaLabel || "See All Events"}</Link></Button>
            </Card>
          </div>
        </EditableBlock>
      </section>
    </div>
  );
}
