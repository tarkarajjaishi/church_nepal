'use client'

import Link from 'next/link'
import { GraduationCap, BookOpen, Target, Quote, Facebook, Youtube, Instagram, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Pastor() {
  return (
    <div>
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-bold text-church-blue mb-8">Our Pastor</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Meet Ps. Bishal Rai — shepherd, teacher and friend.
          </p>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Biography</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ps. Bishal has faithfully served Grace Nepal Church since its earliest days. 
                  His heart beats for discipleship, the local church, and the unreached peoples of the Himalayas.
                </p>
              </Card>
            </div>
            
            <div>
              <Card className="p-6 bg-church-blue text-white border-0">
                <Quote className="size-8 text-gold mb-4" />
                <p className="text-lg italic mb-4">
                  &quot;For I know the plans I have for you&quot; — Jeremiah 29:11
                </p>
              </Card>
              
              <div className="mt-6 flex gap-4">
                <a href="https://facebook.com/gracenepalchurch" target="_blank" rel="noopener noreferrer" className="grid place-items-center size-10 rounded-full bg-secondary text-church-blue hover:bg-gold transition-colors">
                  <Facebook className="size-4" />
                </a>
                <a href="https://youtube.com/@gracenepalchurch" target="_blank" rel="noopener noreferrer" className="grid place-items-center size-10 rounded-full bg-secondary text-church-blue hover:bg-gold transition-colors">
                  <Youtube className="size-4" />
                </a>
                <a href="https://instagram.com/gracenepalchurch" target="_blank" rel="noopener noreferrer" className="grid place-items-center size-10 rounded-full bg-secondary text-church-blue hover:bg-gold transition-colors">
                  <Instagram className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
