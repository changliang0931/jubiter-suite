import { arrayDistinct, arrayToDictionary } from '@trezor/utils';
import { deriveAddresses, networks } from '@trezor/utxo-lib';
import { sortTxsFromLatest } from '@trezor/blockchain-link/src/workers/electrum/methods/getAccountInfo';
import { transformTransaction } from '@trezor/blockchain-link/src/workers/blockbook/utils';

import { getAddressScript, getFilter } from './filters';
import { WabiSabiClient } from './client';
import { WabiSabiController } from './controller';
import type {
    BlockbookTransaction,
    VinVout,
    AccountInfo,
    Address,
    Transaction,
    GetAccountInfoParams,
} from './types';

const LOOKOUT = 20;
const NETWORK = networks.regtest;
const PER_PAGE = 25;

type ScriptResult = {
    script: Buffer;
    heights: number[];
};

type AddressResult = ScriptResult & {
    address: string;
};

type AccountAddressResult = AddressResult & {
    path: string;
};

type WithTxs<T extends AddressResult> = Omit<T, 'heights'> & {
    txs: BlockbookTransaction[];
};

// TODO duplicate
const countUnusedFromEnd = (array: ScriptResult[], lookout: number = LOOKOUT): number => {
    const boundary = array.length > lookout ? array.length - lookout : 0;
    for (let i = array.length; i > boundary; --i) {
        if (array[i - 1].heights.length) {
            return array.length - i;
        }
    }
    return array.length;
};

const analyzeAddress =
    (isMatch: (script: Buffer) => boolean, blockHeight: number) =>
    <T extends ScriptResult>(address: T): T => ({
        ...address,
        blocks: isMatch(address.script) ? [...address.heights, blockHeight] : address.heights,
    });

const analyzeAddresses = (
    addresses: AccountAddressResult[],
    analyze: (address: AccountAddressResult) => AccountAddressResult,
    deriveMore: (from: number, count: number) => ReturnType<typeof deriveAddresses>,
): AccountAddressResult[] => {
    let result = addresses.map(analyze);
    let unused = countUnusedFromEnd(result);
    while (unused < LOOKOUT) {
        const missingCount = LOOKOUT - unused;
        const missing: AccountAddressResult[] = deriveMore(result.length, missingCount)
            .map(({ address, path }) => ({
                address,
                path,
                script: getAddressScript(address, NETWORK),
                heights: [],
            }))
            .map(analyze);
        result = result.concat(missing);
        unused = countUnusedFromEnd(result, LOOKOUT);
    }
    return result;
};

const getTransactions = async <T extends AddressResult>(
    client: WabiSabiClient,
    addresses: T[],
): Promise<WithTxs<T>[]> => {
    const heights = addresses.flatMap(({ heights }) => heights).filter(arrayDistinct);
    const blocks = await client
        .fetchBlocks(heights)
        .then(res => arrayToDictionary(res, b => b.height));

    return addresses.map(({ heights, ...rest }) => {
        const txs = heights.flatMap(height => blocks[height].txs);
        return {
            ...rest,
            txs: txs.filter(({ vin, vout }) =>
                vin
                    .concat(vout)
                    .flatMap(({ addresses = [] }) => addresses)
                    .includes(rest.address),
            ),
        };
    });
};

const calculateBalance = (transactions: Transaction[]) =>
    transactions.reduce<[number, number]>(
        ([confirmed, unconfirmed], { type, totalSpent, blockHeight = -1 }) => {
            if (!['recv', 'sent', 'self'].includes(type)) {
                return [confirmed, unconfirmed];
            }
            const value = Number.parseInt(totalSpent, 10);
            const delta = type === 'recv' ? value : -value;
            return blockHeight > 0
                ? [confirmed + delta, unconfirmed]
                : [confirmed, unconfirmed + delta];
        },
        [0, 0],
    );

export const getAddressInfo = async (params: GetAccountInfoParams): Promise<AccountInfo> => {
    const client = new WabiSabiClient(params);
    const controller = new WabiSabiController(client, params);
    await controller.init();

    const address = params.descriptor;

    // const everyBlockFilter = storage.getBlockFilterIterator();
    const script = getAddressScript(address, NETWORK);
    const heights: number[] = [];
    const everyFilter = controller.getFilterIterator();
    // eslint-disable-next-line no-restricted-syntax
    for await (const { filter, blockHash, blockHeight } of everyFilter) {
        const isMatch = getFilter(filter, blockHash);
        if (isMatch(script)) heights.push(blockHeight);
    }

    const [{ txs }] = await getTransactions(client, [{ address, script, heights }]);
    const txCount = txs.length;
    const txCountConfirmed = txs.filter(({ blockHeight }) => blockHeight > 0).length;
    const transactions = txs.map(tx => transformTransaction(address, undefined, tx));
    const [balanceConfirmed, balanceUnconfirmed] = calculateBalance(transactions);

    return {
        descriptor: address,
        balance: balanceConfirmed.toString(),
        availableBalance: (balanceConfirmed + balanceUnconfirmed).toString(),
        empty: !txCount,
        history: {
            total: txCountConfirmed,
            unconfirmed: txCount - txCountConfirmed,
            transactions,
        },
        page: { index: 1, size: PER_PAGE, total: Math.ceil(txs.length / PER_PAGE) },
    };
};

// TODO duplicate
const sumAddressValues = <T>(
    transactions: T[],
    address: string,
    getVinVouts: (tr: T) => VinVout[],
) =>
    transactions
        .flatMap(tx =>
            getVinVouts(tx)
                .filter(({ addresses }) => addresses?.includes(address))
                .map(({ value }) => (value ? Number.parseFloat(value) : 0)),
        )
        .reduce((a, b) => a + b, 0);

const transformAddressInfo = ({ address, path, txs }: WithTxs<AccountAddressResult>): Address => {
    const sent = sumAddressValues(txs, address, tx => tx.vin);
    const received = sumAddressValues(txs, address, tx => tx.vout);
    return {
        address,
        path,
        transfers: txs.length,
        balance: (received - sent).toString(),
        sent: sent.toString(),
        received: received.toString(),
    };
};

export const getAccountInfo = async (params: GetAccountInfoParams): Promise<AccountInfo> => {
    const client = new WabiSabiClient(params);
    const controller = new WabiSabiController(client, params);
    await controller.init();

    const xpub = params.descriptor;

    const deriveMore = (type: 'receive' | 'change') => (from: number, count: number) =>
        deriveAddresses(xpub, type, from, count, NETWORK);

    let receive: AccountAddressResult[] = [];
    let change: AccountAddressResult[] = [];
    const everyFilter = controller.getFilterIterator();
    // eslint-disable-next-line no-restricted-syntax
    for await (const { filter, blockHash, blockHeight } of everyFilter) {
        const isMatch = getFilter(filter, blockHash);
        const analyze = analyzeAddress(isMatch, blockHeight);

        receive = analyzeAddresses(receive, analyze, deriveMore('receive'));
        change = analyzeAddresses(change, analyze, deriveMore('change'));
    }

    const receiveTxs = await getTransactions(client, receive);
    const changeTxs = await getTransactions(client, change);
    const addresses = {
        change: changeTxs.map(transformAddressInfo),
        unused: receiveTxs.filter(({ txs }) => !txs.length).map(transformAddressInfo),
        used: receiveTxs.filter(({ txs }) => txs.length).map(transformAddressInfo),
    };
    const transactions = receiveTxs
        .flatMap(({ txs }) => txs)
        .concat(changeTxs.flatMap(({ txs }) => txs))
        .filter((item, index, self) => self.findIndex(it => it.txid === item.txid) === index)
        .map(tx => transformTransaction(xpub, addresses, tx))
        .sort(sortTxsFromLatest);
    const [balanceConfirmed, balanceUnconfirmed] = calculateBalance(transactions);
    const txCount = transactions.length;
    const txCountConfirmed = transactions.filter(
        ({ blockHeight }) => (blockHeight ?? 0) > 0,
    ).length;

    return {
        descriptor: xpub,
        balance: balanceConfirmed.toString(),
        availableBalance: (balanceConfirmed + balanceUnconfirmed).toString(),
        empty: !txCount,
        history: {
            total: txCountConfirmed,
            unconfirmed: txCount - txCountConfirmed,
            transactions,
        },
        addresses,
        page: { index: 1, size: PER_PAGE, total: Math.ceil(transactions.length / PER_PAGE) },
    };
};
