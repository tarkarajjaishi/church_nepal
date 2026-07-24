'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const VideoShowcase = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                    {/* Video Frame */}
                    <div className="w-full lg:w-2/3">
                        <Card className="bg-black aspect-video w-full overflow-hidden relative rounded-xl shadow-lg">
                            <CardContent className="p-0 h-full flex items-center justify-center relative">
                                {/* Placeholder image background */}
                                <div 
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: "url('https://placehold.co/800x450?text=Product+Demo+Video')" }}
                                />
                                
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-40" />
                                
                                {/* Play Button Overlay */}
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="relative z-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full w-20 h-20 flex items-center justify-center backdrop-blur-sm"
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor" 
                                        className="w-8 h-8 text-white"
                                    >
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    </svg>
                                </Button>
                            </CardContent>
                        </Card>
                        
                        {/* Caption */}
                        <p className="mt-4 text-center text-[var(--muted)] italic">
                            See how churches manage their community with our platform
                        </p>
                    </div>
                    
                    {/* Highlights */}
                    <div className="w-full lg:w-1/3 mt-8 lg:mt-0">
                        <h3 className="text-2xl font-bold text-[var(--text-strong)] mb-6">Powerful Features</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <div className="bg-[var(--accent-soft)] rounded-full p-2 mr-4">
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor" 
                                        className="w-5 h-5 text-[var(--accent)]"
                                    >
                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-[var(--text)]">Manage events, groups, and members in one place</span>
                            </li>
                            <li className="flex items-start">
                                <div className="bg-[var(--accent-soft)] rounded-full p-2 mr-4">
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor" 
                                        className="w-5 h-5 text-[var(--accent)]"
                                    >
                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-[var(--text)]">Accept donations and track offerings seamlessly</span>
                            </li>
                            <li className="flex items-start">
                                <div className="bg-[var(--accent-soft)] rounded-full p-2 mr-4">
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor" 
                                        className="w-5 h-5 text-[var(--accent)]"
                                    >
                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-[var(--text)]">Customize themes and branding for your church</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="relative max-w-4xl w-full max-h-[90vh]">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute -top-12 right-0 text-white text-xl font-bold bg-[var(--text)] rounded-full w-8 h-8 flex items-center justify-center"
                            >
                                &times;
                            </button>
                            
                            <Card className="bg-black aspect-video w-full overflow-hidden rounded-xl">
                                <CardContent className="p-0 h-full flex items-center justify-center">
                                    <div 
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{ backgroundImage: "url('https://placehold.co/1200x675?text=Demo+Video+Player')" }}
                                    />
                                    
                                    {/* Video Player Placeholder */}
                                    <div className="relative z-10 text-white text-center p-8">
                                        <h3 className="text-2xl font-bold mb-4">Product Demo Video</h3>
                                        <p className="mb-6">This is where the actual video player would go in production</p>
                                        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 inline-block">
                                            <p>Embedded video player component</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default VideoShowcase;
