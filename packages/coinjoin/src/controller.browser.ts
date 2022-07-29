import { WabiSabiClient } from './client';
import { BASE_BLOCK_HASH, FILTERS_BATCH_SIZE } from './config';
import type { Controller, GetAccountInfoParams } from './types';

export class WabiSabiController implements Controller {
    private readonly client;

    constructor(client: WabiSabiClient, _params: GetAccountInfoParams) {
        this.client = client;
    }

    init() {
        return Promise.resolve();
    }

    async *getFilterIterator(fromHash = BASE_BLOCK_HASH, batchSize = FILTERS_BATCH_SIZE) {
        let knownBlockHash = fromHash;
        while (knownBlockHash) {
            // eslint-disable-next-line no-await-in-loop
            const batch = await this.client.fetchFilters(knownBlockHash, batchSize);
            for (let i = 0; i < batch.length; ++i) {
                yield batch[i];
            }
            knownBlockHash = batch[batch.length - 1]?.blockHash;
        }
    }
}
