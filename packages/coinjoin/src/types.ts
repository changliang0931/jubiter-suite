export type { AccountInfo, Address, Transaction } from '@trezor/blockchain-link/src/types';
export type {
    Transaction as BlockbookTransaction,
    VinVout,
} from '@trezor/blockchain-link/src/types/blockbook';

export type BlockFilter = {
    blockHeight: number;
    blockHash: string;
    filter: string;
    prevHash: string;
    blockTime: number;
};

export type GetAccountInfoParams = {
    descriptor: string;
    symbol: string;
    onProgress: (state: any) => void;
    wabisabiUrl?: string;
    blockbookUrl?: string;
    storagePath?: string;
    abortSignal?: AbortSignal;
    lastKnownState?: {
        balance: string;
        blockHash: string;
    };
};

export interface Controller {
    init(): Promise<void>;
    getFilterIterator(
        fromHash?: string,
        batchSize?: number,
    ): Generator<BlockFilter> | AsyncGenerator<BlockFilter>;
}
