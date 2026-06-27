import { Global, Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ProviderIndexService } from './provider-index.service';

/** Global so any module (search, auth, users) can inject the embedder + indexer. */
@Global()
@Module({
  providers: [EmbeddingService, ProviderIndexService],
  exports: [EmbeddingService, ProviderIndexService],
})
export class EmbeddingModule {}
