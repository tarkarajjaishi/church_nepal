'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProvisionProgress from '@/components/admin/provision-progress';

export default function NewChurchPage() {
  const [step, setStep] = useState(1); // 1: info, 2: plan, 3: admin, 4: review
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    plan: 'basic',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });
  const [isProvisioning, setIsProvisioning] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (value.startsWith('-')) value = value.substring(1);
    if (value.endsWith('-')) value = value.slice(0, -1);
    setFormData(prev => ({ ...prev, subdomain: value }));
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
  };

  const handleFinish = () => {
    router.push('/admin/churches');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Create New Church</h1>
        <p className="text-[var(--muted)] mt-1">Set up a new church instance with our guided wizard.</p>
      </Card>

      {isProvisioning ? (
        <ProvisionProgress 
          churchData={formData} 
          onComplete={handleFinish}
        />
      ) : (
        <>
          {/* Step Indicators */}
          <div className="flex justify-between mb-8 max-w-2xl mx-auto">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className="flex flex-col items-center">
                <Badge 
                  variant={step === num ? 'default' : 'outline'} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${step > num ? '!bg-[var(--good)] !text-white' : ''}`}
                >
                  {step > num ? '✓' : num}
                </Badge>
                <span className={`text-xs mt-2 ${step === num ? 'text-[var(--accent)] font-medium' : 'text-[var(--muted)]'}`}>
                  {num === 1 && 'Info'}
                  {num === 2 && 'Plan'}
                  {num === 3 && 'Admin'}
                  {num === 4 && 'Review'}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[var(--text)]">Church Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1">Church Name</label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Grace Community Church"
                      required
                      className="bg-[var(--panel-2)] border-[var(--border-soft)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1">Subdomain</label>
                    <div className="relative">
                      <Input
                        type="text"
                        name="subdomain"
                        value={formData.subdomain}
                        onChange={handleSubdomainChange}
                        placeholder="your-church"
                        required
                        className="bg-[var(--panel-2)] border-[var(--border-soft)] text-[var(--text)] pr-24"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--muted)]">
                        .churchnepal.com
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">Lowercase letters, numbers, and hyphens only.</p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[var(--text)]">Select Plan</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['basic', 'pro', 'enterprise'].map(plan => (
                      <div 
                        key={plan}
                        onClick={() => setFormData(prev => ({ ...prev, plan }))}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.plan === plan 
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]' 
                            : 'border-[var(--border-soft)] hover:bg-[var(--panel-2)]'
                        }`}
                      >
                        <div className="font-medium capitalize">{plan}</div>
                        <div className="text-sm text-[var(--muted)] mt-1">
                          {plan === 'basic' && 'Basic features'}
                          {plan === 'pro' && 'Advanced tools'}
                          {plan === 'enterprise' && 'Full access'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[var(--text)]">Admin Account</h2>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1">Admin Email</label>
                    <Input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      placeholder="admin@yourchurch.org"
                      required
                      className="bg-[var(--panel-2)] border-[var(--border-soft)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1">Password</label>
                    <Input
                      type="password"
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      required
                      className="bg-[var(--panel-2)] border-[var(--border-soft)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1">Confirm Password</label>
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="bg-[var(--panel-2)] border-[var(--border-soft)] text-[var(--text)]"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[var(--text)]">Review Details</h2>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-[var(--text)]">Name:</span> {formData.name}</div>
                    <div><span className="font-medium text-[var(--text)]">Subdomain:</span> {formData.subdomain}.churchnepal.com</div>
                    <div><span className="font-medium text-[var(--text)]">Plan:</span> {formData.plan}</div>
                    <div><span className="font-medium text-[var(--text)]">Admin:</span> {formData.adminEmail}</div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                )}
                {step < 4 ? (
                  <Button type="button" className="ml-auto" onClick={nextStep}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" className="ml-auto">
                    Create Church
                  </Button>
                )}
              </div>
            </Card>
          </form>
        </>
      )}
    </div>
  );
}
