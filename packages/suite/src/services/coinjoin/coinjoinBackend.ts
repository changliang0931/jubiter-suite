import TrezorConnect from '@trezor/connect';
import { CoinjoinBackend as CJ, GetAccountInfoParams } from '@trezor/coinjoin';

// @ts-ignore
const getCoinjoinAccountInfo = async (
    { descriptor, symbol, onProgress, lastKnownState }: GetAccountInfoParams,
    abortSignal: AbortSignal,
) => {
    const accountInfo = await TrezorConnect.getAccountInfo({
        descriptor,
        coin: symbol,
        details: 'txs',
    });

    if (!accountInfo.success) {
        console.log('No accountInfo');
        return;
    }

    if (lastKnownState?.blockHash === '11') {
        return accountInfo.payload;
    }

    return new Promise<typeof accountInfo.payload>(resolve => {
        // Temporary simulate account discovery by block filters
        let i = !lastKnownState?.blockHash ? 0 : 70;
        let timeout: ReturnType<typeof setTimeout>;
        const tick = () => {
            i += 10;
            if (i < 100) {
                onProgress({
                    blockHash: `0${i}`,
                    progress: i,
                    progressMessage:
                        i > 60 ? 'Checking transaction history' : 'Loading block filters',
                });
                timeout = setTimeout(tick, 1000);
            } else {
                // Finish loading
                onProgress({
                    blockHash: '11',
                });
                resolve(accountInfo.payload);
            }
        };
        tick();

        abortSignal.addEventListener('abort', () => {
            console.warn('ABORTED!');
            clearTimeout(timeout);
        });
    });
};

export class CoinjoinBackend {
    private static instances: Record<string, CoinjoinBackend> = {};
    settings: Readonly<{
        network: string;
    }>;
    private abortController: AbortController | undefined;

    constructor(network: string) {
        this.settings = Object.freeze({
            network,
        });
    }

    getAccountInfo(params: GetAccountInfoParams) {
        this.abortController = new AbortController();
        return CJ.getAccountInfo({ ...params, abortSignal: this.abortController.signal });
    }

    cancel() {
        this.abortController?.abort();
        this.abortController = undefined;
    }

    static getInstance(network: string) {
        if (!this.instances[network]) {
            this.instances[network] = new CoinjoinBackend(network);
        }
        return this.instances[network];
    }

    static getInstances() {
        return Object.keys(this.instances).map(key => this.instances[key]);
    }
}
