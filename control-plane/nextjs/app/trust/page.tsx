'use client';

import { useState } from 'react';
import PublicLayout from '../public-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TrustCenterPage = () => {
  const [activeSection, setActiveSection] = useState('security');

  const subprocessors = [
    { name: 'AWS', purpose: 'Cloud Infrastructure' },
    { name: 'Stripe', purpose: 'Payment Processing' },
    { name: 'SendGrid', purpose: 'Email Delivery' },
    { name: 'Cloudflare', purpose: 'CDN & Security' },
    { name: 'Sentry', purpose: 'Error Monitoring' },
  ];

  const complianceBadges = [
    { name: 'SOC 2 Type II', status: 'Compliant' },
    { name: 'GDPR Ready', status: 'Compliant' },
    { name: 'ISO 27001', status: 'Pending' },
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-[var(--panel-2)]">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] mb-4">Trust Center</h1>
            <p className="text-lg md:text-xl text-[var(--muted)] max-w-2xl mx-auto">
              Learn how we protect your data and maintain the highest standards of security and compliance.
            </p>
          </div>
        </section>

        {/* Navigation */}
        <nav className="sticky top-0 z-10 bg-[var(--panel)] border-b border-[var(--border)]">
          <div className="container mx-auto px-4">
            <ul className="flex flex-wrap justify-center gap-4 py-4">
              {['security', 'data', 'encryption', 'backups', 'uptime', 'subprocessors', 'compliance'].map((section) => (
                <li key={section}>
                  <Button
                    variant="ghost"
                    onClick={() => setActiveSection(section)}
                    className={`capitalize ${activeSection === section ? 'bg-[var(--accent-soft)]' : ''}`}
                  >
                    {section.replace(/([A-Z])/g, ' $1').trim()}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-12">
          {/* Security Practices */}
          {activeSection === 'security' && (
            <section className="mb-16">
              <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
                <h2 className="text-2xl font-bold text-[var(--text)] mb-4">Security Practices</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Multi-factor authentication for all admin access</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Regular security audits and penetration testing</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Role-based access controls with principle of least privilege</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Secure development lifecycle (SDLC) with code reviews</span>
                  </li>
                </ul>
              </Card>
            </section>
          )}

          {/* Data Isolation */}
          {activeSection === 'data' && (
            <section className="mb-16">
              <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
                <h2 className="text-2xl font-bold text-[var(--text)] mb-4">Data Isolation</h2>
                <p className="text-[var(--text)] mb-4">
                  Each church operates within its own isolated tenant environment. Data from one church cannot be accessed by another church.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Database-level separation using tenant identifiers</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Application-level checks enforce tenant boundaries</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Network isolation prevents cross-tenant access</span>
                  </li>
                </ul>
              </Card>
            </section>
          )}

          {/* Encryption */}
          {activeSection === 'encryption' && (
            <section className="mb-16">
              <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
                <h2 className="text-2xl font-bold text-[var(--text)] mb-4">Encryption</h2>
                <p className="text-[var(--text)] mb-4">
                  All data is encrypted both in transit and at rest using industry-standard protocols.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">TLS 1.3 for data in transit</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">AES-256 for data at rest</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Key rotation policy with secure key management</span>
                  </li>
                </ul>
              </Card>
            </section>
          )}

          {/* Backups */}
          {activeSection === 'backups' && (
            <section className="mb-16">
              <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
                <h2 className="text-2xl font-bold text-[var(--text)] mb-4">Backups</h2>
                <p className="text-[var(--text)] mb-4">
                  We perform regular automated backups to ensure data recovery capabilities in case of any incidents.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Daily incremental backups with weekly full backups</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Off-site storage with geographic redundancy</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Monthly backup recovery tests to verify integrity</span>
                  </li>
                </ul>
              </Card>
            </section>
          )}

          {/* Uptime SLA */}
          {activeSection === 'uptime' && (
            <section className="mb-16">
              <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
                <h2 className="text-2xl font-bold text-[var(--text)] mb-4">Uptime SLA</h2>
                <p className="text-[var(--text)] mb-4">
                  We guarantee 99.9% uptime for our services, excluding scheduled maintenance windows.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Real-time monitoring with automated alerts</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">Automatic failover to redundant systems</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text)]">24/7 incident response team</span>
                  </li>
                </ul>
              </Card>
            </section>
          )}

          {/* Subprocessors Table */}
          {activeSection === 'subprocessors' && (
            <section className="mb-16">
              <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
                <h2 className="text-2xl font-bold text-[var(--text)] mb-4">Subprocessors</h2>
                <p className="text-[var(--text)] mb-6">
                  We work with trusted third-party vendors to provide essential services. Below is a list of our subprocessors.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[var(--text)]">
                    <thead className="bg-[var(--panel-2)]">
                      <tr>
                        <th className="py-3 px-4 font-medium">Name</th>
                        <th className="py-3 px-4 font-medium">Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subprocessors.map((processor, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-[var(--panel-2)]' : ''}>
                          <td className="py-3 px-4">{processor.name}</td>
                          <td className="py-3 px-4">{processor.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          )}

          {/* Compliance Badges */}
          {activeSection === 'compliance' && (
            <section className="mb-16">
              <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
                <h2 className="text-2xl font-bold text-[var(--text)] mb-4">Compliance</h2>
                <p className="text-[var(--text)] mb-6">
                  We adhere to strict regulatory and industry standards to ensure your data is handled responsibly.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {complianceBadges.map((badge, index) => (
                    <div key={index} className="bg-[var(--panel-2)] p-4 rounded-lg text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        badge.status === 'Compliant' 
                          ? 'bg-[var(--good-soft)] text-[var(--good)]' 
                          : 'bg-[var(--muted)] text-[var(--text)]'
                      }`}>
                        {badge.name}
                      </div>
                      <p className="mt-2 text-[var(--muted)] text-sm">{badge.status}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}
        </main>

        {/* CTA Section */}
        <section className="py-16 bg-[var(--panel-2)]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-[var(--text)] mb-4">Need More Information?</h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto mb-8">
              Request additional security documentation or contact our compliance team for more details.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild>
                <a href="mailto:security@churchnepal.com?subject=Security Documentation Request">
                  Request Security Docs
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/status">View System Status</a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default TrustCenterPage;
