"use client";

import { useState } from "react";
import PublicLayout from "../public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Define types
type TemplateCategory = "Modern" | "Classic" | "Minimal" | "Bold";
type Template = {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
};

const TEMPLATES_DATA: Template[] = [
  {
    id: "modern-1",
    name: "Grace Community",
    category: "Modern",
    description: "A vibrant modern design with bold imagery."
  },
  {
    id: "classic-1",
    name: "Heritage Faith",
    category: "Classic",
    description: "Traditional elements with timeless elegance."
  },
  {
    id: "minimal-1",
    name: "Simple Light",
    category: "Minimal",
    description: "Clean lines and ample whitespace for clarity."
  },
  {
    id: "bold-1",
    name: "New Hope",
    category: "Bold",
    description: "High contrast design for impactful presence."
  },
  {
    id: "modern-2",
    name: "City Church",
    category: "Modern",
    description: "Contemporary urban aesthetic."
  },
  {
    id: "classic-2",
    name: "St. Mary's",
    category: "Classic",
    description: "Rich traditional styling with gold accents."
  },
  {
    id: "minimal-2",
    name: "Purity",
    category: "Minimal",
    description: "Ultra clean layout focused on core content."
  },
  {
    id: "bold-2",
    name: "Fire & Grace",
    category: "Bold",
    description: "Dramatic visuals and strong typography."
  }
];

const ALL_CATEGORIES: TemplateCategory[] = ["Modern", "Classic", "Minimal", "Bold"];

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "All">("All");

  const filteredTemplates = selectedCategory === "All"
    ? TEMPLATES_DATA
    : TEMPLATES_DATA.filter(template => template.category === selectedCategory);

  return (
    <PublicLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-[var(--text-strong)]">Church Website Templates</h1>
        <p className="text-center mb-8 text-[var(--muted)] max-w-2xl mx-auto">
          Browse our collection of professionally designed templates tailored for churches.
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button
            variant={selectedCategory === "All" ? "default" : "outline"}
            onClick={() => setSelectedCategory("All")}
            className={selectedCategory === "All" 
              ? "bg-[var(--accent)] border-[var(--accent)]" 
              : "border-[var(--border)]"
            }
          >
            All
          </Button>
          {ALL_CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category 
                ? "bg-[var(--accent)] border-[var(--accent)]" 
                : "border-[var(--border)]"
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col h-full"
            >
              <CardContent className="p-0 flex-grow flex flex-col">
                {/* Thumbnail */}
                <div className="relative pb-[60%] w-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-soft)] to-[var(--panel-2)] flex items-center justify-center">
                    <div className="w-3/4 h-3/4 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <div className="w-16 h-16 bg-[var(--accent)] rounded-lg"></div>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-5 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-[var(--text-strong)]">{template.name}</h3>
                    <Badge variant="secondary" className="bg-[var(--accent-soft)] text-[var(--accent)]">
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-[var(--muted)] text-sm mb-4 flex-grow">{template.description}</p>
                  
                  <div className="flex gap-2 mt-auto">
                    <Button variant="outline" className="flex-1 border-[var(--border)] hover:bg-[var(--panel-2)]">
                      Preview
                    </Button>
                    <Button className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-2)]">
                      Use Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
