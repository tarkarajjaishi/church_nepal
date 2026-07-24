import { describe, it, expect } from 'vitest'
import { isValidHex, buildThemeCss, findPresetByName, THEME_PRESETS } from '@/lib/theme'

describe('theme', () => {
  describe('isValidHex', () => {
    it('returns true for valid hex colors', () => {
      expect(isValidHex('#0b3c5d')).toBe(true)
      expect(isValidHex('#fff')).toBe(true)
      expect(isValidHex('0b3c5d')).toBe(true)
    })

    it('returns false for invalid hex colors', () => {
      expect(isValidHex('red')).toBe(false)
      expect(isValidHex('#gg0000')).toBe(false)
    })
  })

  describe('buildThemeCss', () => {
    it('returns CSS string for a valid color', () => {
      const css = buildThemeCss('#0b3c5d')
      expect(css).toContain('--church-blue')
      expect(css).toContain('--primary')
    })
  })

  describe('findPresetByName', () => {
    it('returns preset when found', () => {
      const preset = findPresetByName('classic-church')
      expect(preset).toBeDefined()
      expect(preset?.name).toBe('classic-church')
    })

    it('returns undefined when not found', () => {
      const preset = findPresetByName('nonexistent')
      expect(preset).toBeUndefined()
    })
  })

  describe('THEME_PRESETS', () => {
    it('has multiple presets', () => {
      expect(THEME_PRESETS.length).toBeGreaterThan(0)
    })

    it('each preset has required fields', () => {
      for (const preset of THEME_PRESETS) {
        expect(preset.name).toBeTruthy()
        expect(preset.primary).toBeTruthy()
        expect(preset.headingFont).toBeTruthy()
        expect(preset.bodyFont).toBeTruthy()
      }
    })
  })
})
