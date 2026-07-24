'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface Form {
  id: string
  title: string
  description?: string
  fields: FormField[]
  status: string
  submit_action: string
}

export default function FormSubmissionPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch form details
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await api.get<Form>(`/forms/${slug}`)
        setForm(response.data)
      } catch (err: any) {
        setError('Form not found or inactive')
        toast.error('Form not found or inactive')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchForm()
    }
  }, [slug])

  // Generate Zod schema for form validation
  const generateValidationSchema = () => {
    if (!form) return z.object({})
    
    const shape: any = {}
    
    form.fields.forEach(field => {
      let fieldSchema: any
      
      switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
          fieldSchema = z.string()
          if (field.required) fieldSchema = fieldSchema.min(1, `${field.label} is required`)
          if (field.type === 'email') fieldSchema = fieldSchema.email('Invalid email address')
          break
          
        case 'number':
          fieldSchema = z.string()
          if (field.required) fieldSchema = fieldSchema.min(1, `${field.label} is required`)
          fieldSchema = fieldSchema.transform(val => Number(val))
          if (field.type === 'number') fieldSchema = fieldSchema.refine(val => !isNaN(val), { message: 'Must be a number' })
          break
          
        case 'textarea':
          fieldSchema = z.string()
          if (field.required) fieldSchema = fieldSchema.min(1, `${field.label} is required`)
          break
          
        case 'select':
          fieldSchema = z.string()
          if (field.required) fieldSchema = fieldSchema.min(1, `${field.label} is required`)
          if (field.options?.length) {
            fieldSchema = fieldSchema.refine(
              val => field.options!.includes(val),
              { message: `Please select a valid option` }
            )
          }
          break
          
        case 'checkbox':
          fieldSchema = z.boolean()
          if (field.required) {
            fieldSchema = fieldSchema.refine(
              val => val === true,
              { message: `${field.label} is required` }
            )
          }
          break
          
        case 'date':
          fieldSchema = z.string()
          if (field.required) fieldSchema = fieldSchema.min(1, `${field.label} is required`)
          break
          
        default:
          fieldSchema = z.string()
          if (field.required) fieldSchema = fieldSchema.min(1, `${field.label} is required`)
      }
      
      shape[field.id] = fieldSchema
    })
    
    return z.object(shape)
  }

  // Initialize form
  const methods = useForm({
    resolver: zodResolver(generateValidationSchema()),
    defaultValues: form?.fields.reduce((acc, field) => {
      acc[field.id] = field.type === 'checkbox' ? false : ''
      return acc
    }, {} as Record<string, any>)
  })

  const { handleSubmit, formState: { errors }, setValue, watch } = methods

  // Update form when form data loads
  useEffect(() => {
    if (form) {
      methods.reset()
      methods.clearErrors()
    }
  }, [form, methods])

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    setError(null)
    
    try {
      // Transform data to match API expectations
      const submissionData = {
        data: data
      }
      
      const response = await api.post(`/forms/${slug}/submit`, submissionData)
      setSubmitted(true)
      setSubmissionId(response.data.id)
      toast.success('Form submitted successfully!')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to submit form. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const watchedValue = watch(field.id)
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              {...methods.register(field.id)}
              className="w-full"
            />
            {errors[field.id] && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors[field.id]?.message as string}
              </p>
            )}
          </div>
        )
        
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              rows={3}
              {...methods.register(field.id)}
              className="w-full resize-none"
            />
            {errors[field.id] && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors[field.id]?.message as string}
              </p>
            )}
          </div>
        )
        
      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              onValueChange={(value) => setValue(field.id, value)}
              defaultValue={watchedValue}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[field.id] && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors[field.id]?.message as string}
              </p>
            )}
          </div>
        )
        
      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={watchedValue || false}
                onCheckedChange={(checked) => setValue(field.id, checked as boolean)}
              />
              <Label htmlFor={field.id} className="text-sm font-medium cursor-pointer">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {errors[field.id] && (
              <p className="text-sm text-red-600 flex items-center gap-1 ml-6">
                <AlertCircle className="h-4 w-4" />
                {errors[field.id]?.message as string}
              </p>
            )}
          </div>
        )
        
      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              {...methods.register(field.id)}
              className="w-full"
            />
            {errors[field.id] && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors[field.id]?.message as string}
              </p>
            )}
          </div>
        )
        
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Form Not Found</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-church-blue hover:bg-church-blue/90"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted && submissionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle>Form Submitted Successfully!</CardTitle>
            <CardDescription>
              Thank you for your submission. Your form has been received and is being processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Submission ID</p>
              <p className="font-mono text-sm">{submissionId}</p>
            </div>
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-church-blue hover:bg-church-blue/90"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-2 border-border/50">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-church-blue">{form?.title}</CardTitle>
            {form?.description && (
              <CardDescription className="text-lg mt-2">
                {form.description}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  {form?.fields.map(renderField)}
                </div>
                
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 text-base bg-church-blue hover:bg-church-blue/90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Submit Form
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
