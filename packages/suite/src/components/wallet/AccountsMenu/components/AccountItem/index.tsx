import React, { forwardRef, useCallback, useMemo } from 'react';
import { CoinLogo, variables } from '@trezor/components';
import styled from 'styled-components';
import { getTitleForNetwork } from '@suite-common/wallet-utils';
import { Translation, FiatValue } from '@suite-components';
import { SkeletonCircle, SkeletonRectangle, Stack } from '@suite-components/Skeleton';
import { useLoadingSkeleton, useActions } from '@suite-hooks';
import { CoinBalance } from '@wallet-components';
import { Account } from '@wallet-types';
import * as routerActions from '@suite-actions/routerActions';
import { TokensCount } from './TokensCount';

const activeClassName = 'selected';
interface WrapperProps {
    selected: boolean;
    type: string;
}

// position: inherit - get position from parent (AccountGroup), it will be set after animation ends
// sticky top: 34, sticky header
const Wrapper = styled.div.attrs((props: WrapperProps) => ({
    className: props.selected ? activeClassName : '',
}))<WrapperProps>`
    display: flex;
    flex-direction: column;
    &:first-of-type {
        padding-top: 0;
    }
    &:hover,
    &.${activeClassName} {
        border-radius: 4px;
        background: ${props => props.theme.BG_GREY_ALT};
        position: inherit;
        top: ${props =>
            props.type !== 'normal'
                ? '50px'
                : '0px'}; /* when scrolling keep some space above to fit account group (50px is the height of acc group container)  */
        bottom: 0px;
        padding: 0px;
    }
`;

const Left = styled.div`
    display: flex;
    padding-top: 3px;
`;
const Right = styled.div`
    display: flex;
    flex-direction: column;
    padding-left: 8px;
    overflow: hidden;
    padding-right: 10px;
    margin-right: -10px;
`;

const Row = styled.div`
    display: flex;
    align-items: baseline;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const AccountName = styled.div`
    display: flex;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
    line-height: 1.5;
    font-variant-numeric: tabular-nums;
`;

const Balance = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    line-height: 1.57;
`;

const FiatValueWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    line-height: 1.57;
`;

const AccountHeader = styled.div`
    display: flex;
    padding: 12px 16px;
    border-radius: 4px;
    cursor: pointer;
`;

interface Props {
    account: Account;
    selected: boolean;
    closeMenu: () => void;
}

// Using `React.forwardRef` to be able to pass `ref` (item) TO parent (Menu/index)
const AccountItem = forwardRef((props: Props, ref: React.Ref<HTMLDivElement>) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const { account, selected, closeMenu } = props;

    const accountRouteParams = useMemo(
        () => ({
            symbol: account.symbol,
            accountIndex: account.index,
            accountType: account.accountType,
        }),
        [account],
    );

    const handleClickOnTokens = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
        event => {
            event.stopPropagation();
            closeMenu();
            goto('wallet-tokens', { params: accountRouteParams });
        },
        [accountRouteParams, closeMenu, goto],
    );

    const dataTestKey = `@account-menu/${account.symbol}/${account.accountType}/${account.index}`;

    const DefaultLabel = () => (
        <>
            <Translation id={getTitleForNetwork(account.symbol)} />
            <span>&nbsp;#{account.index + 1}</span>
        </>
    );

    const accountLabel = account.metadata.accountLabel ? (
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {account.metadata.accountLabel}
        </span>
    ) : (
        <DefaultLabel />
    );

    return (
        <Wrapper selected={selected} type={account.accountType} ref={ref}>
            <AccountHeader
                onClick={() => {
                    closeMenu();
                    goto('wallet-index', { params: accountRouteParams });
                }}
                data-test={dataTestKey}
            >
                <Left>
                    <CoinLogo size={16} symbol={account.symbol} />
                </Left>
                <Right>
                    <Row>
                        <AccountName data-test={`${dataTestKey}/label`}>{accountLabel}</AccountName>
                    </Row>
                    <Row>
                        <Balance>
                            <CoinBalance value={account.formattedBalance} symbol={account.symbol} />
                        </Balance>
                        {(account.networkType === 'ethereum' ||
                            account.networkType === 'cardano') &&
                            !!account.tokens?.length && (
                                <TokensCount
                                    count={account.tokens.length}
                                    onClick={handleClickOnTokens}
                                />
                            )}
                    </Row>
                    <Row>
                        <FiatValue
                            amount={account.formattedBalance}
                            symbol={account.symbol}
                            showApproximationIndicator
                        >
                            {({ value }) =>
                                value ? <FiatValueWrapper>{value}</FiatValueWrapper> : null
                            }
                        </FiatValue>
                    </Row>
                </Right>
            </AccountHeader>
        </Wrapper>
    );
});

export const SkeletonAccountItem = (props: { animate?: boolean }) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const animate = props.animate ?? shouldAnimate;
    return (
        <AccountHeader>
            <Left>
                <SkeletonCircle size="18px" />
            </Left>
            <Right>
                <Stack col childMargin="0px 0px 8px 0px">
                    <SkeletonRectangle width="180px" height="20px" animate={animate} />

                    <SkeletonRectangle width="100px" height="16px" animate={animate} />

                    <SkeletonRectangle width="100px" height="16px" animate={animate} />
                </Stack>
            </Right>
        </AccountHeader>
    );
};

export default AccountItem;
