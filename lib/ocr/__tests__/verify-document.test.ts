import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock global fetch for Groq API calls ────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ─── Mock environment ────────────────────────────────────────────────────────

vi.stubEnv('GROQ_API_KEY', 'gsk_test_key_12345')

// ─── Mock pdfjs-dist ─────────────────────────────────────────────────────────

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: vi.fn(),
}))

// ─── Mock mammoth ────────────────────────────────────────────────────────────

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}))

import { verifyDocument } from '../verify-document'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groqResponse(content: Record<string, unknown>) {
  return {
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
  }
}

function groqError(status: number, message: string) {
  return {
    ok: false,
    status,
    text: () => Promise.resolve(JSON.stringify({ error: { message } })),
  }
}

const FAKE_IMAGE_BUFFER = Buffer.from('fake-image-data-for-testing')
const LARGE_BUFFER = Buffer.alloc(5 * 1024 * 1024) // 5MB - over 4MB limit

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('verifyDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ────────────────────────────────────────────────────────────────────────────
  // IMAGE VERIFICATION VIA VLM
  // ────────────────────────────────────────────────────────────────────────────

  describe('Image verification (VLM)', () => {

    it('verifies name found in a PNG document - exact match', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 95,
        extracted_name: 'Jean Pierre Dupont',
        found_parts: ['Jean', 'Pierre', 'Dupont'],
        missing_parts: [],
        document_type_detected: 'National ID Card',
        reasoning: 'The name Jean Pierre Dupont is clearly visible on the National ID card.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Jean Pierre Dupont', 'National ID')

      expect(result.success).toBe(true)
      expect(result.nameFound).toBe(true)
      expect(result.confidence).toBe(95)
      expect(result.method).toBe('vlm')
      expect(result.matchDetails.foundParts).toContain('Jean')
      expect(result.matchDetails.foundParts).toContain('Pierre')
      expect(result.matchDetails.foundParts).toContain('Dupont')
      expect(result.matchDetails.missingParts).toHaveLength(0)
    })

    it('verifies name found in JPEG format', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 88,
        extracted_name: 'Sarah Johnson',
        found_parts: ['Sarah', 'Johnson'],
        missing_parts: [],
        document_type_detected: 'Medical License',
        reasoning: 'Name matches the doctor license document.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/jpeg', 'Sarah Johnson', 'Medical License')

      expect(result.success).toBe(true)
      expect(result.confidence).toBe(88)
      expect(result.method).toBe('vlm')
    })

    it('verifies name found in WEBP format', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 82,
        extracted_name: 'Raj Patel',
        found_parts: ['Raj', 'Patel'],
        missing_parts: [],
        document_type_detected: 'Passport',
        reasoning: 'Name visible in passport.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/webp', 'Raj Patel', 'Passport')
      expect(result.success).toBe(true)
    })

    // ── Name mismatch tests ──────────────────────────────────────────────────

    it('detects WRONG name - completely different person', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: false,
        confidence: 5,
        extracted_name: 'Marie Claire Leblanc',
        found_parts: [],
        missing_parts: ['Jean', 'Pierre', 'Dupont'],
        document_type_detected: 'National ID Card',
        reasoning: 'The document belongs to Marie Claire Leblanc, not Jean Pierre Dupont.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Jean Pierre Dupont', 'National ID')

      expect(result.success).toBe(false)
      expect(result.nameFound).toBe(false)
      expect(result.confidence).toBe(5)
      expect(result.matchDetails.missingParts).toContain('Jean')
      expect(result.matchDetails.missingParts).toContain('Pierre')
      expect(result.matchDetails.missingParts).toContain('Dupont')
    })

    it('detects PARTIAL name match - first name only', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: false,
        confidence: 40,
        extracted_name: 'Jean Martin',
        found_parts: ['Jean'],
        missing_parts: ['Pierre', 'Dupont'],
        document_type_detected: 'National ID Card',
        reasoning: 'Only first name Jean matches. Last name is Martin, not Dupont.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Jean Pierre Dupont', 'National ID')

      expect(result.success).toBe(false)
      expect(result.confidence).toBe(40)
      expect(result.matchDetails.foundParts).toContain('Jean')
      expect(result.matchDetails.missingParts).toContain('Dupont')
    })

    it('detects MISSPELLED name - close but not matching', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: false,
        confidence: 30,
        extracted_name: 'Jéan Piere Dupon',
        found_parts: [],
        missing_parts: ['Tsanta', 'Rakotonjanahary'],
        document_type_detected: 'National ID Card',
        reasoning: 'Document shows Jéan Piere Dupon which does not match Tsanta Rakotonjanahary.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Tsanta Rakotonjanahary', 'National ID')

      expect(result.success).toBe(false)
      expect(result.nameFound).toBe(false)
    })

    it('detects name with REVERSED order still matches', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 90,
        extracted_name: 'Dupont Jean Pierre',
        found_parts: ['Jean', 'Pierre', 'Dupont'],
        missing_parts: [],
        document_type_detected: 'National ID Card',
        reasoning: 'Name found in reversed order: Dupont, Jean Pierre.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Jean Pierre Dupont', 'National ID')

      expect(result.success).toBe(true)
      expect(result.confidence).toBe(90)
    })

    it('low confidence (< 70) means not verified even if name_found', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 45,
        extracted_name: 'Jean P. Dupont',
        found_parts: ['Jean', 'Dupont'],
        missing_parts: ['Pierre'],
        document_type_detected: 'Blurry document',
        reasoning: 'Document is very blurry, name partially visible.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Jean Pierre Dupont', 'National ID')

      expect(result.success).toBe(false) // confidence < 70
    })

    // ── Edge cases ───────────────────────────────────────────────────────────

    it('handles image too large for VLM (> 4MB)', async () => {
      const result = await verifyDocument(LARGE_BUFFER, 'image/png', 'Jean Dupont', 'National ID')

      expect(result.success).toBe(false)
      expect(result.method).toBe('fallback')
      expect(result.extractedTextPreview).toContain('too large')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('handles VLM API error gracefully', async () => {
      mockFetch.mockResolvedValueOnce(groqError(500, 'Internal server error'))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Jean Dupont', 'National ID')

      expect(result.success).toBe(false)
      expect(result.method).toBe('fallback')
    })

    it('handles VLM network failure gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Jean Dupont', 'National ID')

      expect(result.success).toBe(false)
      expect(result.method).toBe('fallback')
    })

    it('handles VLM returning invalid JSON gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'not valid json' } }] }),
      })

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Jean Dupont', 'National ID')

      expect(result.success).toBe(false)
      expect(result.method).toBe('fallback')
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // PDF VERIFICATION VIA TEXT EXTRACTION + LLM
  // ────────────────────────────────────────────────────────────────────────────

  describe('PDF verification (text extraction + LLM)', () => {

    it('verifies name in a text-based PDF', async () => {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve({
          numPages: 1,
          getPage: vi.fn().mockResolvedValue({
            getTextContent: vi.fn().mockResolvedValue({
              items: [
                { str: 'Republic of Mauritius' },
                { str: 'National Identity Card' },
                { str: 'Name: Jean Pierre Dupont' },
                { str: 'DOB: 15/01/1990' },
              ],
            }),
          }),
        }),
      } as never)

      // LLM call for text analysis
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 98,
        extracted_name: 'Jean Pierre Dupont',
        found_parts: ['Jean', 'Pierre', 'Dupont'],
        missing_parts: [],
        document_type_detected: 'National Identity Card',
        reasoning: 'Name clearly present in the document text.',
      }))

      const result = await verifyDocument(Buffer.from('fake-pdf'), 'application/pdf', 'Jean Pierre Dupont', 'National ID')

      expect(result.success).toBe(true)
      expect(result.confidence).toBe(98)
      expect(result.method).toBe('llm-text')
    })

    it('detects wrong name in PDF', async () => {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve({
          numPages: 1,
          getPage: vi.fn().mockResolvedValue({
            getTextContent: vi.fn().mockResolvedValue({
              items: [
                { str: 'Medical License' },
                { str: 'Dr. Sarah Johnson' },
                { str: 'License No: DOC-56789' },
              ],
            }),
          }),
        }),
      } as never)

      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: false,
        confidence: 0,
        extracted_name: 'Sarah Johnson',
        found_parts: [],
        missing_parts: ['Jean', 'Pierre', 'Dupont'],
        document_type_detected: 'Medical License',
        reasoning: 'Document belongs to Sarah Johnson, not Jean Pierre Dupont.',
      }))

      const result = await verifyDocument(Buffer.from('fake-pdf'), 'application/pdf', 'Jean Pierre Dupont', 'Medical License')

      expect(result.success).toBe(false)
      expect(result.nameFound).toBe(false)
    })

    it('handles scanned PDF (no extractable text) gracefully', async () => {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve({
          numPages: 1,
          getPage: vi.fn().mockResolvedValue({
            getTextContent: vi.fn().mockResolvedValue({ items: [] }),
          }),
        }),
      } as never)

      const result = await verifyDocument(Buffer.from('scanned-pdf'), 'application/pdf', 'Jean Dupont', 'National ID')

      expect(result.success).toBe(false)
      expect(result.method).toBe('fallback')
      expect(result.extractedTextPreview).toContain('scanned PDF')
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // WORD DOCUMENT VERIFICATION VIA TEXT EXTRACTION + LLM
  // ────────────────────────────────────────────────────────────────────────────

  describe('Word document verification (mammoth + LLM)', () => {

    it('verifies name in a .docx file', async () => {
      const mammoth = await import('mammoth')
      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: 'Business Plan\nPrepared by Jean Pierre Dupont\nTarget Market: Mauritius Healthcare',
        messages: [],
      })

      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 92,
        extracted_name: 'Jean Pierre Dupont',
        found_parts: ['Jean', 'Pierre', 'Dupont'],
        missing_parts: [],
        document_type_detected: 'Business Plan',
        reasoning: 'Author name found in the business plan document.',
      }))

      const result = await verifyDocument(
        Buffer.from('fake-docx'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Jean Pierre Dupont',
        'Business Plan'
      )

      expect(result.success).toBe(true)
      expect(result.confidence).toBe(92)
      expect(result.method).toBe('llm-text')
    })

    it('detects wrong name in Word document', async () => {
      const mammoth = await import('mammoth')
      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: 'Financial Report\nPrepared by Marie Claire Leblanc\nFiscal Year 2025-2026',
        messages: [],
      })

      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: false,
        confidence: 0,
        extracted_name: 'Marie Claire Leblanc',
        found_parts: [],
        missing_parts: ['Jean', 'Pierre', 'Dupont'],
        document_type_detected: 'Financial Report',
        reasoning: 'Document authored by Marie Claire Leblanc, not Jean Pierre Dupont.',
      }))

      const result = await verifyDocument(
        Buffer.from('fake-docx'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Jean Pierre Dupont',
        'Financial Report'
      )

      expect(result.success).toBe(false)
      expect(result.nameFound).toBe(false)
    })

    it('handles old .doc format', async () => {
      const mammoth = await import('mammoth')
      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: 'Reference Letter for Dr. Raj Patel',
        messages: [],
      })

      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 85,
        extracted_name: 'Raj Patel',
        found_parts: ['Raj', 'Patel'],
        missing_parts: [],
        document_type_detected: 'Reference Letter',
        reasoning: 'Name found in reference letter.',
      }))

      const result = await verifyDocument(Buffer.from('old-doc'), 'application/msword', 'Raj Patel', 'Reference Letter')

      expect(result.success).toBe(true)
      expect(result.method).toBe('llm-text')
    })

    it('handles Word extraction failure gracefully', async () => {
      const mammoth = await import('mammoth')
      vi.mocked(mammoth.extractRawText).mockRejectedValue(new Error('Corrupt file'))

      const result = await verifyDocument(
        Buffer.from('corrupt-docx'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Jean Dupont',
        'Business Plan'
      )

      expect(result.success).toBe(false)
      expect(result.method).toBe('fallback')
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // NAME VARIATION TESTS - Different formats and edge cases
  // ────────────────────────────────────────────────────────────────────────────

  describe('Name variations', () => {

    it('handles Malagasy names with long surnames', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 91,
        extracted_name: 'Tsantaniaina Rakotonjanahary',
        found_parts: ['Tsantaniaina', 'Rakotonjanahary'],
        missing_parts: [],
        document_type_detected: 'National ID',
        reasoning: 'Full name matches.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Tsantaniaina Rakotonjanahary', 'National ID')
      expect(result.success).toBe(true)
    })

    it('handles French names with accents', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 88,
        extracted_name: 'François Réné Beaumont',
        found_parts: ['François', 'Réné', 'Beaumont'],
        missing_parts: [],
        document_type_detected: 'Passport',
        reasoning: 'Accented name matches passport.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'François Réné Beaumont', 'Passport')
      expect(result.success).toBe(true)
    })

    it('handles single-word names', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 80,
        extracted_name: 'Madonna',
        found_parts: ['Madonna'],
        missing_parts: [],
        document_type_detected: 'ID Card',
        reasoning: 'Single name matches.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Madonna', 'ID Card')
      expect(result.success).toBe(true)
    })

    it('handles hyphenated names', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 87,
        extracted_name: 'Marie-Claire Duval-Leblanc',
        found_parts: ['Marie-Claire', 'Duval-Leblanc'],
        missing_parts: [],
        document_type_detected: 'National ID',
        reasoning: 'Hyphenated name matches.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Marie-Claire Duval-Leblanc', 'National ID')
      expect(result.success).toBe(true)
    })

    it('handles names with particles (de, van, von)', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: true,
        confidence: 84,
        extracted_name: 'Charles de Gaulle',
        found_parts: ['Charles', 'de', 'Gaulle'],
        missing_parts: [],
        document_type_detected: 'Passport',
        reasoning: 'Name with particle matches.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Charles de Gaulle', 'Passport')
      expect(result.success).toBe(true)
    })

    it('rejects completely unrelated name', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: false,
        confidence: 0,
        extracted_name: 'Zhang Wei',
        found_parts: [],
        missing_parts: ['Jean', 'Pierre', 'Dupont'],
        document_type_detected: 'Chinese National ID',
        reasoning: 'Document belongs to Zhang Wei, a Chinese citizen. No match with Jean Pierre Dupont.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Jean Pierre Dupont', 'National ID')
      expect(result.success).toBe(false)
      expect(result.confidence).toBe(0)
    })

    it('rejects document with similar but different name', async () => {
      mockFetch.mockResolvedValueOnce(groqResponse({
        name_found: false,
        confidence: 25,
        extracted_name: 'Jean Pierre Durant',
        found_parts: ['Jean', 'Pierre'],
        missing_parts: ['Dupont'],
        document_type_detected: 'National ID',
        reasoning: 'Last name is Durant, not Dupont. Close but different person.',
      }))

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Jean Pierre Dupont', 'National ID')
      expect(result.success).toBe(false)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // UNSUPPORTED FILE TYPE
  // ────────────────────────────────────────────────────────────────────────────

  describe('Unsupported file types', () => {
    it('returns fallback for unknown mime type', async () => {
      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'application/zip', 'Jean Dupont', 'Document')

      expect(result.success).toBe(false)
      expect(result.method).toBe('fallback')
      expect(result.extractedTextPreview).toContain('unsupported')
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // API KEY MISSING
  // ────────────────────────────────────────────────────────────────────────────

  describe('Missing API key', () => {
    it('returns fallback when GROQ_API_KEY is not set', async () => {
      const originalKey = process.env.GROQ_API_KEY
      delete process.env.GROQ_API_KEY

      const result = await verifyDocument(FAKE_IMAGE_BUFFER, 'image/png', 'Jean Dupont', 'National ID')

      expect(result.success).toBe(false)
      expect(result.method).toBe('fallback')

      process.env.GROQ_API_KEY = originalKey
    })
  })
})
