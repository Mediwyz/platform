// Pre-downloads (and warms up) the embedding model into the image cache during
// the Docker build, so there is no multi-hundred-MB cold-start download on the
// first request in production. Non-fatal in the Dockerfile: if this fails, the
// model downloads at runtime on first use instead, and search keeps working.
import { pipeline, env } from '@huggingface/transformers';

if (process.env.TRANSFORMERS_CACHE) env.cacheDir = process.env.TRANSFORMERS_CACHE;
const model = process.env.EMBEDDING_MODEL || 'Xenova/multilingual-e5-base';

console.log(`[bake] downloading embedding model ${model} → ${env.cacheDir || 'default cache'}`);
const extractor = await pipeline('feature-extraction', model, { dtype: 'q8' });
const out = await extractor('passage: warmup', { pooling: 'mean', normalize: true });
console.log(`[bake] model ready (dim=${out.data.length})`);
