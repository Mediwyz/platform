import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileValidationService } from '../shared/services/file-validation.service';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface VerifyBody {
  documentId?: string;
  documentUrl?: string;
  name?: string;
  type?: string;
  /** Registered user's full name — used for name-matching verification */
  userFullName?: string;
}

interface GroqDocAnalysis {
  documentType: string | null;
  nameFound: string | null;
  isAuthentic: boolean;
  confidence: 'low' | 'medium' | 'high';
  issues: string[];
  rawText: string | null;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private fileValidation: FileValidationService,
  ) {}

  async verify(body: VerifyBody) {
    const doc = body.documentId
      ? await this.prisma.document.findUnique({
          where: { id: body.documentId },
          select: {
            id: true, url: true, name: true, type: true,
            size: true, verificationStatus: true,
            user: { select: { firstName: true, lastName: true } },
          },
        })
      : null;

    const url = doc?.url ?? body.documentUrl;
    const name = doc?.name ?? body.name ?? 'document';
    const type = doc?.type ?? body.type ?? 'other';
    const size = doc?.size ?? 0;
    const userFullName = body.userFullName ??
      (doc?.user ? `${doc.user.firstName} ${doc.user.lastName}` : undefined);

    if (!url) throw new BadRequestException('documentId or documentUrl is required');

    // Structural checks
    const checks: Array<{ rule: string; pass: boolean; detail?: string }> = [];
    checks.push({ rule: 'url-format', pass: /^https?:\/\/|^\//.test(url) });

    const mimeByExt = this.inferMime(url);
    checks.push({
      rule: 'mime-aligns-with-type',
      pass: this.mimeFitsType(mimeByExt, type),
      detail: `${mimeByExt} ↔ ${type}`,
    });
    checks.push({ rule: 'size-present', pass: size > 0 });

    // AI vision check (only for image/PDF types where we can read content)
    let aiResult: GroqDocAnalysis | null = null;
    const isVisualDoc = mimeByExt.startsWith('image/');
    if (isVisualDoc && process.env.GROQ_API_KEY) {
      aiResult = await this.analyzeWithGroq(url, name, type, userFullName);
      checks.push({
        rule: 'ai-authentic',
        pass: aiResult.isAuthentic,
        detail: aiResult.confidence,
      });
      if (userFullName && aiResult.nameFound) {
        const nameSimilarity = this.nameSimilarity(userFullName, aiResult.nameFound);
        checks.push({
          rule: 'ai-name-match',
          pass: nameSimilarity >= 0.7,
          detail: `"${aiResult.nameFound}" vs registered "${userFullName}" (${Math.round(nameSimilarity * 100)}%)`,
        });
      }
    }

    const passCount = checks.filter(c => c.pass).length;
    const confidence = passCount / checks.length;
    const verified = confidence >= 0.66;

    if (doc?.id && verified !== (doc.verificationStatus === 'approved')) {
      await this.prisma.document.update({
        where: { id: doc.id },
        data: { verificationStatus: verified ? 'approved' : 'rejected' },
      }).catch(() => {});
    }

    return {
      success: true,
      verified,
      confidence,
      documentId: doc?.id ?? null,
      currentStatus: doc?.verificationStatus ?? 'unknown',
      nameFound: aiResult?.nameFound ?? null,
      method: aiResult ? 'groq-vision' : 'structural-checks-only',
      checks,
      matchDetails: {
        extractedName: aiResult?.nameFound ?? name,
        registeredName: userFullName ?? null,
        confidence,
        aiConfidence: aiResult?.confidence ?? null,
        issues: aiResult?.issues ?? [],
      },
    };
  }

  private async analyzeWithGroq(
    imageUrl: string,
    documentName: string,
    documentType: string,
    userFullName?: string,
  ): Promise<GroqDocAnalysis> {
    const apiKey = process.env.GROQ_API_KEY;
    // llama-3.2-11b-vision-preview is a deprecated preview model; Llama 4 Scout
    // is Groq's current stable vision model. Override via GROQ_VISION_MODEL.
    const model = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

    const nameInstruction = userFullName
      ? `The registered user's name is: "${userFullName}". Look for this name on the document.`
      : 'No registered name provided — just extract any name you find.';

    const prompt = `You are a document verification AI for a healthcare platform. Analyze this document image.
Expected document type: "${documentName}" (category: "${documentType}").
${nameInstruction}

Return ONLY a JSON object (no markdown, no commentary) with this exact shape:
{
  "documentType": string | null,
  "nameFound": string | null,
  "isAuthentic": boolean,
  "confidence": "low" | "medium" | "high",
  "issues": string[],
  "rawText": string | null
}

Rules:
- documentType: what type of document this appears to be (e.g. "Medical License", "National ID", "Passport").
- nameFound: the full name found on the document (null if not visible or unreadable).
- isAuthentic: true if the document looks like a genuine official document (has stamps, logos, official formatting, consistent fonts). false if it looks like a screenshot, printout, or obviously fake.
- confidence: "high" if image is clear and all fields readable; "medium" if partial; "low" if blurry, not a document, or clearly fake.
- issues: list of specific problems found (e.g. ["Name not visible", "Document appears to be a screenshot", "Type mismatch — expected Medical License but found Passport"]).
- rawText: key visible text from the document (up to 300 characters).
- If the image is NOT a document at all, set isAuthentic=false, confidence="low", and explain in issues.`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          }],
          temperature: 0.1,
          max_tokens: 512,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        this.logger.error(`Groq vision error ${response.status}: ${errBody}`);
        throw new Error(`Groq API error (${response.status})`);
      }

      const data: any = await response.json();
      const raw = data?.choices?.[0]?.message?.content?.trim();
      if (!raw) throw new Error('Empty response from Groq');

      return this.parseGroqResponse(raw);
    } catch (e) {
      this.logger.warn(`AI doc analysis failed for ${imageUrl}: ${(e as Error).message}`);
      return {
        documentType: null,
        nameFound: null,
        isAuthentic: false,
        confidence: 'low',
        issues: [`AI analysis unavailable: ${(e as Error).message}`],
        rawText: null,
      };
    }
  }

  private parseGroqResponse(raw: string): GroqDocAnalysis {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Groq did not return JSON');
    const parsed = JSON.parse(match[0]);
    return {
      documentType: parsed.documentType ?? null,
      nameFound: parsed.nameFound ?? null,
      isAuthentic: Boolean(parsed.isAuthentic),
      confidence: ['high', 'medium'].includes(parsed.confidence) ? parsed.confidence : 'low',
      issues: Array.isArray(parsed.issues) ? parsed.issues.filter((i: any) => typeof i === 'string') : [],
      rawText: parsed.rawText ?? null,
    };
  }

  /** Approximate name similarity — handles reordered names, partial matches */
  private nameSimilarity(registered: string, found: string): number {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const a = normalize(registered);
    const b = normalize(found);
    if (a === b) return 1;

    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;
    return union > 0 ? intersection / union : 0;
  }

  private inferMime(url: string): string {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
      pdf: 'application/pdf',
    };
    return map[ext || ''] || 'application/octet-stream';
  }

  private mimeFitsType(mime: string, type: string): boolean {
    const imageTypes = new Set(['id_proof', 'imaging', 'lab_report']);
    if (imageTypes.has(type)) return mime.startsWith('image/') || mime === 'application/pdf';
    if (type === 'prescription') return mime === 'application/pdf' || mime.startsWith('image/');
    if (type === 'insurance') return mime === 'application/pdf' || mime.startsWith('image/');
    return true;
  }
}
