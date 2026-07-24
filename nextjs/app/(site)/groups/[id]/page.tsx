'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function GroupDetail({ params }: { params: { id: string } }) {
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [joining, setJoining] = useState<boolean>(false)
  const [joinSuccess, setJoinSuccess] = useState<boolean>(false)
  
  // Join form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [baptismStatus, setBaptismStatus] = useState('')
  const [churchBackground, setChurchBackground] = useState('')
  const [howFound, setHowFound] = useState('')
  const [interestAreas, setInterestAreas] = useState('')
  const [testimony, setTestimony] = useState('')

  // Fetch group details
  async function fetchGroup() {
    try {
      setLoading(true)
      const response = await api.get(`/groups/${params.id}`)
      setGroup(response.data)
    } catch (error) {
      console.error('Error fetching group:', error)
      // Don't show toast here as it might be annoying during navigation
    } finally {
      setLoading(false)
    }
  }

  // Submit join request
  async function joinGroup() {
    if (!email || !firstName) {
      toast.error('Please fill in required fields (first name and email)')
      return
    }

    setJoining(true)
    try {
      // Prepare member application data
      const applicationData = {
        firstName,
        lastName: lastName || undefined,
        email,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        maritalStatus: maritalStatus || undefined,
        baptismStatus: baptismStatus || undefined,
        churchBackground: churchBackground || undefined,
        howFound: howFound || undefined,
        interestAreas: interestAreas || undefined,
        testimony: testimony || undefined,
      }

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(applicationData).filter(([, v]) => v !== undefined)
      )

      const response = await api.post(`/groups/${group.id}/join`, cleanedData)
      
      if (response.data) {
        setJoinSuccess(true)
        // Reset form
        setFirstName('')
        setLastName('')
        setEmail('')
        setPhone('')
        setAddress('')
        setCity('')
        setDateOfBirth('')
        setGender('')
        setMaritalStatus('')
        setBaptismStatus('')
        setChurchBackground('')
        setHowFound('')
        setInterestAreas('')
        setTestimony('')
        
        toast.success('Join request submitted! We will review your application and contact you soon.')
      }
    } catch (error) {
      console.error('Error submitting join request:', error)
      toast.error('Failed to submit join request. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  // Initialize
  async function loadData() {
    await fetchGroup()
  }

  useEffect(() => {
    loadData()
  }, [params.id])

  if (loading && !group) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center py-20">
        <div className="animate-pulse">
          <div className="h-12 bg-muted rounded w-32 mb-4" />
          <div className="h-8 bg-muted rounded w-full mb-2" />
          <div className="h-8 bg-muted rounded w-2/3" />
        </div>
        <p className="mt-4 text-muted-foreground">Loading group details...</p>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <Users className="size-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-church-blue mb-2">Group Not Found</h3>
          <p className="text-muted-foreground">The group you're looking for doesn't exist or has been removed.</p>
          <Button 
            variant="outline" 
            onClick={() => {
              // Redirect to groups page
              window.location.href = '/groups'
            }}
          >
            Back to Groups
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Group Header */}
      <section className="pb-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-3xl font-bold text-church-blue mb-4">
              {group.name}
            </h1>
            {group.category && (
              <span
                className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700"
              >
                {group.category}
              </span>
            )}
          </div>
          
          {group.image_url && (
            <div className="w-full h-64 bg-cover bg-center rounded-lg mb-6" 
                 style={{ backgroundImage: `url(${group.image_url})` }}></div>
          )}
        </div>
      </section>

      {/* Group Details */}
      <section className="mb-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="space-y-6">
            {/* Description */}
            {group.description && (
              <div>
                <h2 className="text-xl font-semibold text-church-blue mb-3">About This Group</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {group.description}
                </p>
              </div>
            )}

            {/* Meeting Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-church-blue mb-2">Meeting Information</h3>
                <div className="space-y-3">
                  {group.meeting_day && (
                    <div className="flex items-center gap-3">
                      <Calendar className="size-5 text-church-blue" />
                      <div>
                        <p className="font-medium">{group.meeting_day}</p>
                        {group.meeting_time && (
                          <p className="text-sm text-muted-foreground">at {group.meeting_time}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {group.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="size-5 text-church-blue" />
                      <div>
                        <p className="font-medium">{group.location}</p>
                        <p className="text-sm text-muted-foreground">Meeting location</p>
                      </div>
                    </div>
                  )}
                  {group.max_members && (
                    <div className="flex items-center gap-3">
                      <Users className="size-5 text-church-blue" />
                      <div>
                        <p className="font-medium">{group.max_members} members max</p>
                        {/* We don't have current_members count, so we'll omit it for now */}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional Info */}
              <div>
                <h3 className="text-lg font-semibold text-church-blue mb-2">Additional Details</h3>
                <div className="space-y-3">
                  {group.enabled !== undefined && !group.enabled && (
                    <p className="text-warning">This group is currently not accepting new members.</p>
                  )}
                  {group.created_at && (
                    <p className="text-sm text-muted-foreground">
                      Established: {new Date(group.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Request Section */}
      <section className="mb-12">
        <div className="mx-auto max-w-4xl px-4">
          {joinSuccess ? (
            <div className="text-center py-12">
              <CheckCircle2 className="mx-auto size-12 text-success mb-4" />
              <h3 className="text-xl font-semibold text-church-blue mb-3">
                Join Request Sent!
              </h3>
              <p className="text-muted-foreground mb-6">
                Thank you for your interest in joining "{group.name}". 
                Our team will review your application and contact you soon.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setJoinSuccess(false)
                }}
              >
                Browse More Groups
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-church-blue mb-6">
                Join This Group
              </h2>
              <p className="text-muted-foreground mb-6">
                To join "{group.name}", please fill out the form below. 
                This helps us get to know you better and ensure our groups are a good fit for everyone.
              </p>
              
              {/* Join Form */}
              <form onSubmit={(e) => {
                e.preventDefault()
                joinGroup()
              }} className="space-y-6">
                
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Your first name"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Your last name"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+977..."
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <select
                      id="maritalStatus"
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="">Select marital status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="baptismStatus">Baptism Status</Label>
                    <select
                      id="baptismStatus"
                      value={baptismStatus}
                      onChange={(e) => setBaptismStatus(e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="">Select baptism status</option>
                      <option value="baptized">Baptized</option>
                      <option value="not_baptized">Not Baptized</option>
                      <option value="in_process">In Process</option>
                    </select>
                  </div>
                </div>
                
                {/* Church Background */}
                <div className="space-y-3">
                  <Label htmlFor="churchBackground">Church Background</Label>
                  <Input
                    id="churchBackground"
                    value={churchBackground}
                    onChange={(e) => setChurchBackground(e.target.value)}
                    placeholder="Your previous church experience"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="howFound">How did you hear about us?</Label>
                    <Input
                      id="howFound"
                      value={howFound}
                      onChange={(e) => setHowFound(e.target.value)}
                      placeholder="Friend, social media, event, etc."
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="interestAreas">Interest Areas</Label>
                    <Input
                      id="interestAreas"
                      value={interestAreas}
                      onChange={(e) => setInterestAreas(e.target.value)}
                      placeholder="What interests you about our groups?"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="testimony">Your Testimony (Optional)</Label>
                  <Textarea
                    id="testimony"
                    value={testimony}
                    onChange={(e) => setTestimony(e.target.value)}
                    rows={4}
                    placeholder="Briefly share your faith journey or what you're seeking in a small group..."
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={joining}
                    className="bg-church-blue hover:bg-church-blue/90"
                  >
                    {joining ? 'Submitting...' : 'Send Join Request'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}