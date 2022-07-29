import React from 'react';
import styled from 'styled-components';
import { variables, PassphraseTypeCard } from '@trezor/components';

import { postMessage } from '../../common';
import { UI, createUiResponse } from '@trezor/connect';

const Wrapper = styled.div<{ authConfirmation?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 100%;
    }
`;

const WalletsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

const Divider = styled.div`
    margin: 16px 16px;
    height: 1px;
    background: ${props => props.theme.STROKE_GREY};
`;

// todo:
const Translation = (props: any) => <span>{props.id}</span>;

// todo:
export const Passphrase = (props: any) => {
    console.log('Passphrase.props', props);
    const { device } = props;
    const { features } = device;

    const offerPassphraseOnDevice =
        features &&
        features.capabilities &&
        features.capabilities.includes('Capability_PassphraseEntry');

    const onSubmit = (value: string, passphraseOnDevice = false) => {
        console.log('onSubmit', value, passphraseOnDevice);
        postMessage(
            createUiResponse(UI.RECEIVE_PASSPHRASE, {
                value,
                passphraseOnDevice,
                // todo: what is this param?
                save: true,
            }),
        );
    };

    return (
        <>
            <h3>Passphrase</h3>

            {/* todo: this part could be shared with suite? */}
            <Wrapper>
                <WalletsWrapper>
                    <PassphraseTypeCard
                        title={<Translation id="TR_NO_PASSPHRASE_WALLET" />}
                        description={<Translation id="TR_STANDARD_WALLET_DESCRIPTION" />}
                        submitLabel={<Translation id="TR_ACCESS_STANDARD_WALLET" />}
                        type="standard"
                        onSubmit={onSubmit}
                    />
                    <Divider />
                    <PassphraseTypeCard
                        title={<Translation id="TR_WALLET_SELECTION_HIDDEN_WALLET" />}
                        description={<Translation id="TR_HIDDEN_WALLET_DESCRIPTION" />}
                        submitLabel={<Translation id="TR_WALLET_SELECTION_ACCESS_HIDDEN_WALLET" />}
                        type="hidden"
                        offerPassphraseOnDevice={offerPassphraseOnDevice}
                        onSubmit={onSubmit}
                    />
                </WalletsWrapper>
            </Wrapper>
        </>
    );
};
