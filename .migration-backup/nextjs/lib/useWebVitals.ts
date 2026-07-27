'use client'

import { useEffect, useState } from 'react'

export function useWebVitals() {
  const [vitals, setVitals] = useState<Record<string, number>>({})

  useEffect(() => {
    // Collect Core Web Vitals
    if ('web-vital' in window) {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = require('web-vitals')

      getCLS((metric: any) => {
        console.log('CLS:', metric.value)
        setVitals((v) => ({ ...v, cls: metric.value }))
      })

      getFID((metric: any) => {
        console.log('FID:', metric.value)
        setVitals((v) => ({ ...v, fid: metric.value }))
      })

      getFCP((metric: any) => {
        console.log('FCP:', metric.value)
        setVitals((v) => ({ ...v, fcp: metric.value }))
      })

      getLCP((metric: any) => {
        console.log('LCP:', metric.value)
        setVitals((v) => ({ ...v, lcp: metric.value }))
      })

      getTTFB((metric: any) => {
        console.log('TTFB:', metric.value)
        setVitals((v) => ({ ...v, ttfb: metric.value }))
      })
    }

    // Log to analytics
    if (vitals && Object.keys(vitals).length > 0) {
      console.log('Web Vitals:', vitals)
      // Send to analytics service
    }
  }, [vitals])

  return vitals
}
