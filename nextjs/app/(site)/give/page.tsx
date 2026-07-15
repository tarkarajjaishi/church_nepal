'use client'

import { useState } from "react";
import { toast } from "sonner";
import { Heart, QrCode, Building2, Smartphone, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { images } from "@/lib/data";
import { useCampaigns } from "@/lib/hooks";

const methods = [
  { id: "esewa", label: "eSewa", icon: Smartphone },
  { id: "khalti", label: "Khalti", icon: Smartphone },
  { id: "bank", label: "Bank Transfer", icon: Building2 },
  { id: "qr", label: "QR Code", icon: QrCode },
];

const amounts = [500, 1000, 2500, 5000];

export default function Give() {
  const { data: campaigns = [] } = useCampaigns();
  const [freq, setFreq] = useState("one");
  const [amount, setAmount] = useState<number | "">(1000);
  const [method, setMethod] = useState("esewa");

  return (
    <div>
      <PageHero title="Give" crumb="Give" image={images.worship1}
        subtitle="Every gift is an act of worship that helps us reach Nepal with the hope of Christ." />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-10 items-start">
          {/* Giving form */}
          <Reveal>
            <Card className="p-7 border-border/60">
              <div className="flex items-center gap-2 text-church-blue">
                <Heart className="size-5 text-gold" />
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>Make a Gift</h3>
              </div>

              <Tabs value={freq} onValueChange={setFreq} className="mt-5">
                <TabsList className="w-full">
                  <TabsTrigger value="one" className="flex-1">One Time</TabsTrigger>
                  <TabsTrigger value="monthly" className="flex-1">Monthly Giving</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mt-6 grid grid-cols-4 gap-2">
                {amounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    className={`py-3 rounded-xl text-sm transition-colors ${amount === a ? "bg-church-blue text-white" : "bg-secondary text-church-blue hover:bg-gold hover:text-church-blue"}`}
                  >
                    Rs {a}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                className="mt-3"
                placeholder="Other amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              />

              <div className="mt-6 grid grid-cols-2 gap-3">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${method === m.id ? "border-gold bg-gold-soft/40" : "border-border hover:border-gold"}`}
                  >
                    <m.icon className="size-5 text-church-blue" />
                    <span className="text-sm text-church-blue">{m.label}</span>
                    {method === m.id && <Check className="size-4 text-gold ml-auto" />}
                  </button>
                ))}
              </div>

              <Button
                size="lg"
                className="mt-6 w-full bg-gold text-church-blue hover:bg-gold/90"
                onClick={() => toast.success(`Thank you for your ${freq === "one" ? "gift" : "monthly pledge"}!`, { description: `Rs ${amount || 0} via ${methods.find((m) => m.id === method)?.label}` })}
              >
                Give Rs {amount || 0} {freq === "monthly" ? "/ month" : ""}
              </Button>
              <p className="mt-3 text-xs text-center text-muted-foreground">Secure giving · You will be redirected to complete payment.</p>
            </Card>
          </Reveal>

          {/* Campaigns */}
          <Reveal delay={0.1}>
            <SectionHeading center={false} eyebrow="Where It Goes" title="Current Campaigns" />
            <div className="mt-6 space-y-4">
              {campaigns.map((c) => {
                const pct = Math.round((c.raised / c.goal) * 100);
                return (
                  <Card key={c.id} className="p-5 border-border/60">
                    <div className="flex justify-between items-center">
                      <span className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{c.title}</span>
                      <span className="text-sm text-gold">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-3" />
                    <div className="mt-2 text-sm text-muted-foreground">Rs {c.raised.toLocaleString('en-US')} of Rs {c.goal.toLocaleString('en-US')}</div>
                  </Card>
                );
              })}
              {[["Mission", "Reaching unreached villages"], ["Children Ministry", "Discipling the next generation"]].map(([t, d]) => (
                <Card key={t} className="p-5 border-border/60">
                  <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{t}</div>
                  <p className="text-sm text-muted-foreground mt-1">{d}</p>
                </Card>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

