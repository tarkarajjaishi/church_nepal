"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PublicLayout from "../public-layout";

const GetStartedPage = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Create Your Church",
      description: "Sign up and set up your basic church information.",
      tip: "Choose a memorable subdomain that reflects your church's identity."
    },
    {
      title: "Customize Your Look",
      description: "Select themes, colors, and upload your logo.",
      tip: "Use high-quality images for the best visual impact."
    },
    {
      title: "Add Your Content",
      description: "Upload sermons, events, and build your pages.",
      tip: "Start with essential pages like 'About Us' and 'Service Times'."
    },
    {
      title: "Invite Your Team",
      description: "Grant access to staff members and volunteers.",
      tip: "Assign roles based on responsibilities for better security."
    },
    {
      title: "Go Live!",
      description: "Launch your site and start engaging your community.",
      tip: "Promote your new website through social media and bulletins."
    }
  ];

  return (
    <PublicLayout>
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Getting Started Guide</h1>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Follow these simple steps to launch your church website in no time.
          </p>
        </div>

        {/* Progress Rail */}
        <div className="mb-12">
          <div className="flex justify-between mb-2">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  index <= currentStep 
                    ? 'bg-[var(--accent)] text-white' 
                    : 'bg-[var(--panel-2)] text-[var(--muted)]'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
          <div className="relative h-2 bg-[var(--panel-2)] rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-[var(--accent)] transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-8">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/3">
                <Badge variant="secondary" className="mb-3 bg-[var(--accent-soft)] text-[var(--accent)]">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
                <h2 className="text-2xl font-bold mb-3">{steps[currentStep].title}</h2>
                <p className="text-[var(--muted)] mb-4">{steps[currentStep].description}</p>
                
                <div className="mt-6 p-4 bg-[var(--panel-2)] rounded-lg border border-[var(--border-soft)]">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--accent)] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p><span className="font-medium">Pro Tip:</span> {steps[currentStep].tip}</p>
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/3 flex items-center justify-center">
                <div className="bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-lg w-48 h-48 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            variant="outline"
          >
            Previous
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Next: {steps[currentStep + 1].title}
            </Button>
          ) : (
            <Link href="/signup">
              <Button>
                Create Your Church Today
              </Button>
            </Link>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default GetStartedPage;
