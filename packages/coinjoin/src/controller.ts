import { WabiSabiClient } from './client';
import { WabiSabiStorage } from './storage';
import { BASE_BLOCK_HASH, BASE_BLOCK_HEIGHT, FILTERS_BATCH_SIZE } from './config';
import type { Controller, GetAccountInfoParams } from './types';

export class WabiSabiController implements Controller {
    private readonly client;
    private readonly storage;

    constructor(client: WabiSabiClient, params: GetAccountInfoParams) {
        this.client = client;
        this.storage = new WabiSabiStorage(params.storagePath);
    }

    async init() {
        // Check whether DB data are consistent
        if (!this.storage.isConsistent(BASE_BLOCK_HEIGHT, BASE_BLOCK_HASH)) {
            throw new Error('Storage inconsistent');
        }

        // Fetch and store all missing block filters
        // TODO handle reorgs
        let knownBlockHash = this.storage.peekBlockFilter()?.blockHash ?? BASE_BLOCK_HASH;
        while (knownBlockHash) {
            // eslint-disable-next-line no-await-in-loop
            const batch = await this.client.fetchFilters(knownBlockHash, FILTERS_BATCH_SIZE);
            this.storage.loadBlockFilters(batch);
            knownBlockHash = batch[batch.length - 1]?.blockHash;
        }

        // TODO other check, probably excessive
        if (!this.storage.isConsistent(BASE_BLOCK_HEIGHT, BASE_BLOCK_HASH)) {
            throw new Error('Storage inconsistent');
        }
    }

    *getFilterIterator(_fromHash = BASE_BLOCK_HASH, _batchSize = FILTERS_BATCH_SIZE) {
        const iterator = this.storage.getBlockFilterIterator();
        // eslint-disable-next-line no-restricted-syntax
        for (const filter of iterator()) yield filter;
    }
}
