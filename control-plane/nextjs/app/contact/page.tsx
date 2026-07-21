"use client";

import Link from "next/link";
import { useTranslation } from "@/components/i18n-hook";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import PublicLayout from "../public-layout";

export default function ContactPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    churchName: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.churchName.trim()) newErrors.churchName = 'Church name is required';
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call - no backend, handle locally
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', churchName: '', message: '' });
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6">
          <Card className="lp-card max-w-md mx-auto text-center">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-[var(--good-soft)] mx-auto mb-4 flex items-center justify-center" aria-hidden="true">
                <svg className="w-8 h-8 text-[var(--good)]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Message Sent!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted)] mb-6">
                {t("contact.success.message")}
              </p>
              <Link href="/">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">Return to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)]">
        <main className="max-w-[var(--max)] mx-auto">
          {/* Hero Section */}
          <section className="section-wrapper-lg text-center">
            <h1 className="lp-h1 mb-4">Request a Demo</h1>
            <p className="lp-lead text-[var(--muted)] max-w-2xl mx-auto">
              {t("contact.hero.subtitle")}
            </p>
          </section>

          {/* Contact Content - Two Column Layout */}
          <section className="section-wrapper">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Contact Form */}
              <div>
                <Card className="lp-card">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl">Get in Touch</CardTitle>
                    <CardDescription>
                      {t("contact.form.subtitle")}
                    </CardDescription>
                  </CardHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div>
                      <label htmlFor="name" className="text-sm font-medium mb-2 block text-[var(--muted)]">
                        Name *
                      </label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        placeholder="Your full name"
                        className={errors.name ? 'border-[var(--danger)]' : ''}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                      />
                      {errors.name && (
                        <p id="name-error" className="text-[var(--danger)] text-sm mt-1" role="alert">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="text-sm font-medium mb-2 block text-[var(--muted)]">
                        Email *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        placeholder="your.email@example.com"
                        className={errors.email ? 'border-[var(--danger)]' : ''}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      {errors.email && (
                        <p id="email-error" className="text-[var(--danger)] text-sm mt-1" role="alert">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="church-name" className="text-sm font-medium mb-2 block text-[var(--muted)]">
                        Church Name *
                      </label>
                      <Input
                        id="church-name"
                        type="text"
                        value={formData.churchName}
                        onChange={handleInputChange('churchName')}
                        placeholder="Name of your church"
                        className={errors.churchName ? 'border-[var(--danger)]' : ''}
                        aria-invalid={!!errors.churchName}
                        aria-describedby={errors.churchName ? 'church-name-error' : undefined}
                      />
                      {errors.churchName && (
                        <p id="church-name-error" className="text-[var(--danger)] text-sm mt-1" role="alert">
                          {errors.churchName}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="text-sm font-medium mb-2 block text-[var(--muted)]">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={handleInputChange('message')}
                        placeholder="Tell us about your needs, timeline, and any questions you have..."
                        className={`min-h-[120px] ${errors.message ? 'border-[var(--danger)]' : ''}`}
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? 'message-error' : undefined}
                      />
                      {errors.message && (
                        <p id="message-error" className="text-[var(--danger)] text-sm mt-1" role="alert">
                          {errors.message}
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                      size="lg"
                    >
                      {isSubmitting ? 'Sending...' : t("contact.form.submit")}
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Contact Details */}
              <div className="space-y-8">
                {/* Contact Information */}
                <Card className="lp-card">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-xl">Contact Information</CardTitle>
                    <CardDescription>
                      Reach out to us directly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-md bg-[var(--accent-soft)] flex items-center justify-center" aria-hidden="true">
                        <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-strong)]">Email</p>
                        <a href="mailto:hello@churchnepal.com" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                          hello@churchnepal.com
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-md bg-[var(--accent-soft)] flex items-center justify-center" aria-hidden="true">
                        <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.69l1.5 3.75a1 1 0 00-.17.61v2.24l2.2-1.2a1 1 0 01.5.86v4.24a1 1 0 01-.5.86l-2.2 1.2V19a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h3.28a1 1 0 01.94.69l1.5 3.75a1 1 0 00-.17.61v2.24l2.2-1.2a1 1 0 01.5.86v4.24a1 1 0 01-.5.86l-2.2 1.2V19a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-strong)]">Phone</p>
                        <a href="tel:+977-1-234567" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                          +977-1-234567 (Nepal)
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-md bg-[var(--accent-soft)] flex items-center justify-center" aria-hidden="true">
                        <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-strong)]">Location</p>
                        <p className="text-sm text-[var(--muted)]">
                          Kathmandu, Nepal
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Time */}
                <Card className="lp-card bg-[var(--panel-2)] border-[var(--border)]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--good-soft)] flex items-center justify-center" aria-hidden="true">
                        <svg className="w-6 h-6 text-[var(--good)]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-1">
                          Quick Response
                        </h3>
                        <p className="text-sm text-[var(--muted)]">
                          We typically respond within 24 hours during business days. For urgent matters, please mention "URGENT" in your message.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Hours */}
                <Card className="lp-card bg-[var(--panel-2)] border-[var(--border)]">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-3">
                      Business Hours
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Monday - Friday</span>
                        <span className="text-[var(--text)]">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Saturday</span>
                        <span className="text-[var(--text)]">10:00 AM - 4:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Sunday</span>
                        <span className="text-[var(--muted)]">Closed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </main>
      </div>
    </PublicLayout>
  );
}