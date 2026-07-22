'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function DemoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    churchName: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.churchName.trim()) {
      newErrors.churchName = 'Church name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setFormData({ name: '', churchName: '', email: '', message: '' });
      setIsSubmitted(true);
      
      // Show success toast
      toast.success('Thank you! We will contact you soon to schedule your demo.');
      
      // Close modal after delay
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitted(false);
    setErrors({});
  };

  // Handle clicks outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    };

    // Handle escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent scrolling
      
      // Focus the first input field
      if (initialFocusRef.current) {
        initialFocusRef.current.focus();
      }
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = ''; // Re-enable scrolling
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <Button 
        onClick={openModal}
        className="relative overflow-hidden bg-[var(--accent)] hover:bg-[var(--accent-soft)] text-white transition-colors"
      >
        Book a demo
      </Button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
        >
          <div 
            ref={modalRef}
            className="w-full max-w-md rounded-2xl bg-[var(--panel)] shadow-xl border border-[var(--border)]"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[var(--text-strong)]">
                  Schedule a Demo
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-full hover:bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              
              {isSubmitted ? (
                <div className="py-6 text-center">
                  <div className="text-[var(--good)] mx-auto mb-4">✓</div>
                  <p className="text-[var(--text)]">
                    Thank you! We've received your request and will contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-[var(--text)] mb-1">
                        Your Name *
                      </label>
                      <Input
                        ref={initialFocusRef}
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full ${errors.name ? 'border-[var(--danger)]' : ''}`}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                      />
                      {errors.name && (
                        <p id="name-error" className="mt-1 text-sm text-[var(--danger)]">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="churchName" className="block text-sm font-medium text-[var(--text)] mb-1">
                        Church Name *
                      </label>
                      <Input
                        type="text"
                        id="churchName"
                        name="churchName"
                        value={formData.churchName}
                        onChange={handleChange}
                        className={`w-full ${errors.churchName ? 'border-[var(--danger)]' : ''}`}
                        aria-invalid={!!errors.churchName}
                        aria-describedby={errors.churchName ? "churchName-error" : undefined}
                      />
                      {errors.churchName && (
                        <p id="churchName-error" className="mt-1 text-sm text-[var(--danger)]">
                          {errors.churchName}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-1">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full ${errors.email ? 'border-[var(--danger)]' : ''}`}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                      />
                      {errors.email && (
                        <p id="email-error" className="mt-1 text-sm text-[var(--danger)]">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-[var(--text)] mb-1">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us more about your church..."
                        rows={4}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeModal}
                      className="border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg)]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[var(--accent)] hover:bg-[var(--accent-soft)] text-white"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Request'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
