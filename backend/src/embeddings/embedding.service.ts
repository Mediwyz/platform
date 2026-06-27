import { Injectable, Logger } from '@nestjs/common';

/**
 * Local, free, CPU-only text embeddings via Transformers.js (ONNX runtime).
 * Model: multilingual-e5-base (768-dim) — matches the pgvector(768) column and
 * covers the platform's languages (FR/EN/Kreol). Loaded lazily on first use and
 * kept resident. Every method degrades to null on failure so search/writes never
 * break — callers fall back to keyword search.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private static readonly MODEL = process.env.EMBEDDING_MODEL || 'Xenova/multilingual-e5-base';
  private extractorPromise: Promise<any> | null = null;
  private failed = false;

  // @huggingface/transformers is ESM-only. A plain `await import()` would be
  // transpiled to require() under CommonJS and crash; the Function wrapper keeps
  // it a real dynamic ESM import at runtime.
  private readonly esmImport = new Function('s', 'return import(s)') as (s: string) => Promise<any>;

  private getExtractor(): Promise<any> | null {
    if (this.failed) return null;
    if (!this.extractorPromise) {
      this.extractorPromise = (async () => {
        const { pipeline, env } = await this.esmImport('@huggingface/transformers');
        if (process.env.TRANSFORMERS_CACHE) (env as any).cacheDir = process.env.TRANSFORMERS_CACHE;
        this.logger.log(`Loading embedding model ${EmbeddingService.MODEL}…`);
        const extractor = await pipeline('feature-extraction', EmbeddingService.MODEL, { dtype: 'q8' });
        this.logger.log('Embedding model ready');
        return extractor;
      })().catch((e: any) => {
        this.failed = true;
        this.logger.error(`Embedding model failed to load — falling back to keyword search: ${e?.message}`);
        return null;
      });
    }
    return this.extractorPromise;
  }

  /** A 768-dim L2-normalized embedding, or null if the model is unavailable.
   *  e5 models expect a "query: " / "passage: " prefix per the model card. */
  async embed(text: string, kind: 'query' | 'passage'): Promise<number[] | null> {
    const extractorP = this.getExtractor();
    if (!extractorP) return null;
    const extractor = await extractorP;
    if (!extractor) return null;
    try {
      const input = `${kind}: ${(text || '').slice(0, 4000)}`;
      const output = await extractor(input, { pooling: 'mean', normalize: true });
      return Array.from(output.data as Float32Array);
    } catch (e: any) {
      this.logger.warn(`Embedding failed: ${e?.message}`);
      return null;
    }
  }

  get available(): boolean {
    return !this.failed;
  }
}
