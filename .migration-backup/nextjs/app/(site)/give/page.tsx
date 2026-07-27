'use client'

import { useState } from "react";
import { toast } from "sonner";
import { Heart, QrCode, Building2, Smartphone, Check, Wallet, User, Mail, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { EditableBlock } from "@/components/site/EditableBlock";
import { useContentBlock, useCampaigns, useFunds } from "@/lib/hooks";
import { images } from "@/lib/data";

const defaultMethods = [
  { id: "esewa", label: "eSewa" },
  { id: "khalti", label: "Khalti" },
  { id: "stripe", label: "Credit Card" },
  { id: "bank", label: "Bank Transfer" },
  { id: "qr", label: "QR Code" },
];

const defaultAmounts = [500, 1000, 2500, 5000];

const methodIconMap: Record<string, any> = { esewa: Smartphone, khalti: Smartphone, stripe: Smartphone, bank: Building2, qr: QrCode };

export default function Give() {
  const { data: campaigns = [] } = useCampaigns();
  const { data: funds = [] } = useFunds();
  const enabledCampaigns = (campaigns as any[]).filter((c: any) => c.enabled !== false)
  const [freq, setFreq] = useState("one");
  const [amount, setAmount] = useState<number | "">(1000);
  const [method, setMethod] = useState("esewa");
  const [donating, setDonating] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [fundId, setFundId] = useState<string>("");
  const [campaignId, setCampaignId] = useState<string>("");

  // CMS content blocks
  const hero = useContentBlock('give_hero');
  const formBlock = useContentBlock('give_form');
  const methodsBlock = useContentBlock('give_methods');
  const campaignsBlock = useContentBlock('give_campaigns');

  // Derive data from CMS blocks with full fallback chains
  const heroItems = hero?.items?.[0] || {};
  const formData = formBlock?.items?.[0] || {};
  const methods = methodsBlock?.items?.length ? methodsBlock.items : defaultMethods;
  const amounts = formData.amounts?.length ? formData.amounts : defaultAmounts;

  return (
    <div>
      {/* Hero */}
      <EditableBlock block={hero}>
        <PageHero
          title={hero?.title || "Give"}
          crumb={heroItems.crumb || "Give"}
          image={hero?.items?.[0]?.image || images.worship1}
          subtitle={hero?.subtitle || "Every gift is an act of worship that helps us reach Nepal with the hope of Christ."}
        />
      </EditableBlock>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-10 items-start">
          {/* Giving form */}
          <EditableBlock block={formBlock}>
            <Reveal>
              <Card className="p-7 border-border/60">
                <div className="flex items-center gap-2 text-church-blue">
                  <Heart className="size-5 text-gold" />
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{formBlock?.title || "Make a Gift"}</h3>
                </div>

                <Tabs value={freq} onValueChange={setFreq} className="mt-5">
                  <TabsList className="w-full">
                    <TabsTrigger value="one" className="flex-1">{formData.oneTimeLabel || "One Time"}</TabsTrigger>
                    <TabsTrigger value="monthly" className="flex-1">{formData.monthlyLabel || "Monthly Giving"}</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fund" className="text-church-blue mb-1 block"><Wallet className="size-4 inline mr-1" />Fund</Label>
                    <Select value={fundId} onValueChange={setFundId}>
                      <SelectTrigger id="fund">
                        <SelectValue placeholder="Select a fund" />
                      </SelectTrigger>
                      <SelectContent>
                        {funds.map((f: any) => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="campaign" className="text-church-blue mb-1 block"><Target className="size-4 inline mr-1" />Campaign</Label>
                    <Select value={campaignId} onValueChange={setCampaignId}>
                      <SelectTrigger id="campaign">
                        <SelectValue placeholder="Select a campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {enabledCampaigns.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="amount" className="text-church-blue mb-1 block">Amount (Rs)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Other amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2" role="group" aria-label="Amount presets">
                  {amounts.map((a: number) => (
                    <button
                      key={a}
                      onClick={() => setAmount(a)}
                      className={`py-3 rounded-xl text-sm transition-colors ${amount === a ? "bg-church-blue text-white" : "bg-secondary text-church-blue hover:bg-gold hover:text-church-blue"}`}
                      aria-pressed={amount === a}
                    >
                      Rs {a}
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label="Payment method">
                  {methods.map((m: any) => {
                    const Icon = methodIconMap[m.id] || Smartphone;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${method === m.id ? "border-gold bg-gold-soft/40" : "border-border hover:border-gold"}`}
                        aria-pressed={method === m.id}
                      >
                        <Icon className="size-5 text-church-blue" />
                        <span className="text-sm text-church-blue">{m.label}</span>
                        {method === m.id && <Check className="size-4 text-gold ml-auto" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-3">
                  <div>
                    <Label htmlFor="donor-name" className="text-church-blue mb-1 block"><User className="size-4 inline mr-1" />Full Name</Label>
                    <Input
                      id="donor-name"
                      type="text"
                      placeholder="Your full name"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="donor-email" className="text-church-blue mb-1 block"><Mail className="size-4 inline mr-1" />Email</Label>
                      <Input
                        id="donor-email"
                        type="email"
                        placeholder="you@example.com"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="donor-phone" className="text-church-blue mb-1 block"><Phone className="size-4 inline mr-1" />Phone</Label>
                      <Input
                        id="donor-phone"
                        type="tel"
                        placeholder="98XXXXXXXX"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  disabled={donating || !amount}
                  className="mt-6 w-full bg-gold text-church-blue hover:bg-gold/90"
                  onClick={async () => {
                    if (!amount) return;
                    setDonating(true);
                    try {
                      const res = await fetch('/api/give', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          amount: Number(amount),
                          payment_method: method,
                          frequency: freq,
                          donor_name: donorName,
                          donor_email: donorEmail,
                          donor_phone: donorPhone,
                          fund_id: fundId || undefined,
                          campaign_id: campaignId || undefined,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok && data.payment_url) {
                        window.location.href = data.payment_url;
                      } else if (res.ok) {
                        toast.success(formData.successMessage || `Thank you for your ${freq === "one" ? "gift" : "monthly pledge"}!`, {
                          description: `Rs ${amount} via ${methods.find((m: any) => m.id === method)?.label}`,
                        });
                      } else {
                        toast.error(data.error || data.detail || "Could not initiate payment. Please try again.");
                      }
                    } catch {
                      toast.error("Network error. Please try again.");
                    } finally {
                      setDonating(false);
                    }
                  }}
                >
                  {donating ? "Processing..." : formData.submitLabel?.replace('{amount}', String(amount || 0)) || `Give Rs ${amount || 0} ${freq === "monthly" ? "/ month" : ""}`}
                </Button>
                <p className="mt-3 text-xs text-center text-muted-foreground">{formData.secureNote || "Secure giving · You will be redirected to complete payment."}</p>
              </Card>
            </Reveal>
          </EditableBlock>

          {/* Campaigns */}
          <EditableBlock block={campaignsBlock}>
            <Reveal delay={0.1}>
              <SectionHeading
                center={false}
                eyebrow={campaignsBlock?.subtitle || "Where It Goes"}
                title={campaignsBlock?.title || "Current Campaigns"}
              />
              <div className="mt-6 space-y-4">
                {campaigns.map((c: any) => {
                  const pct = Math.round((c.raised / c.goal) * 100);
                  return (
                    <Card key={c.id} className="p-5 border-border/60">
                      <div className="flex justify-between items-center">
                        <span className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{c.title}</span>
                        <span className="text-sm text-gold">{pct}%</span>
                      </div>
                      <Progress value={pct} className="mt-3" />
                      <div className="mt-2 text-sm text-muted-foreground">Rs {c.raised.toLocaleString()} of Rs {c.goal.toLocaleString()}</div>
                    </Card>
                  );
                })}
                {(campaignsBlock?.items || []).map((item: any, i: number) => (
                  <Card key={`cms-campaign-${i}`} className="p-5 border-border/60">
                    <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{item.title}</div>
                    <p className="text-sm text-muted-foreground mt-1">{item.description || item.subtitle || ""}</p>
                  </Card>
                ))}
              </div>
            </Reveal>
          </EditableBlock>
        </div>
      </section>
    </div>
  );
}
