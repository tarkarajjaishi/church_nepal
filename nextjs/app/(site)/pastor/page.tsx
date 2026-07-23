'use client'

import { Quote, Facebook, Youtube, Instagram } from "lucide-react"
import { Card } from "@/components/ui/card"
import { PageHero } from "@/components/site/PageHero"
import { EditableBlock } from "@/components/site/EditableBlock"
import { useContentBlock } from "@/lib/hooks"
import { useLang } from "@/lib/language"

const socialIconMap: Record<string, { Icon: any; label: string }> = { facebook: { Icon: Facebook, label: 'Facebook' }, youtube: { Icon: Youtube, label: 'YouTube' }, instagram: { Icon: Instagram, label: 'Instagram' } }

export default function Pastor() {
  const { lang } = useLang()
  const hero = useContentBlock('pastor_hero')
  const biography = useContentBlock('pastor_biography')
  const quote = useContentBlock('pastor_quote')
  const social = useContentBlock('pastor_social')

  return (
    <div>
      {/* Hero */}
      <EditableBlock block={hero}>
        <PageHero
          title={hero?.title || "Our Pastor"}
          subtitle={hero?.subtitle || "Meet Ps. Bishal Rai — shepherd, teacher and friend."}
          image={hero?.items?.[0]?.image || ''}
          crumb={hero?.title || "Our Pastor"}
        />
      </EditableBlock>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Biography */}
            <div>
              <EditableBlock block={biography}>
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-church-blue mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    {biography?.title || "Biography"}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {biography?.body || "Ps. Bishal has faithfully served Grace Nepal Church since its earliest days. His heart beats for discipleship, the local church, and the unreached peoples of the Himalayas."}
                  </p>
                </Card>
              </EditableBlock>
            </div>

            {/* Quote + Social */}
            <div>
              <EditableBlock block={quote}>
                <Card className="p-6 bg-church-blue text-white border-0">
                  <Quote className="size-8 text-gold mb-4" />
                  <p className="text-lg italic mb-4">
                    {quote?.body || '"For I know the plans I have for you" — Jeremiah 29:11'}
                  </p>
                </Card>
              </EditableBlock>

              <EditableBlock block={social}>
                <div className="mt-6 flex gap-4">
                  {(social?.items || []).map((item: any, i: number) => {
                    const entry = socialIconMap[item.platform]
                    if (!entry?.Icon || !item.url) return null
                    return (
                      <a
                        key={i}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={entry.label}
                        className="grid place-items-center size-10 rounded-full bg-secondary text-church-blue hover:bg-gold transition-colors"
                      >
                        <entry.Icon className="size-4" />
                      </a>
                    )
                  })}
                </div>
              </EditableBlock>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
