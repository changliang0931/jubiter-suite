import React from 'react';
import styled from 'styled-components';

import * as routerActions from '@suite-actions/routerActions';
import { Translation } from '@suite-components';
import { TextColumn } from '@suite-components/Settings';
import { SettingsAnchor } from '@suite-constants/anchors';
import { useActions, useDevice } from '@suite-hooks';
import { useEnabledNetworks } from '@settings-hooks/useEnabledNetworks';
import { isBitcoinOnly } from '@suite-utils/device';
import { Button, Card } from '@trezor/components';

const StyledButton = styled(Button)`
    display: inline;
`;

export const FirmwareTypeSuggestion = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const { enabledNetworks } = useEnabledNetworks();
    const { device } = useDevice();

    const bitcoinOnlyFirmware = device && isBitcoinOnly(device);
    const onlyBitcoinEnabled = enabledNetworks.every(coin =>
        ['btc', 'regtest', 'test'].includes(coin),
    );
    const shouldDisplay =
        device && (bitcoinOnlyFirmware || (!bitcoinOnlyFirmware && onlyBitcoinEnabled));

    if (!shouldDisplay) {
        return null;
    }

    return (
        <Card>
            <TextColumn
                description={
                    <Translation
                        id={
                            bitcoinOnlyFirmware
                                ? 'TR_SETTINGS_COINS_UNIVERSAL_FIRMWARE_SUGGESTION'
                                : 'TR_SETTINGS_COINS_BITCOIN_FIRMWARE_SUGGESTION'
                        }
                        values={{
                            button: chunks => (
                                <StyledButton
                                    variant="tertiary"
                                    onClick={() =>
                                        goto('settings-device', {
                                            anchor: SettingsAnchor.FirmwareType,
                                        })
                                    }
                                >
                                    {chunks}
                                </StyledButton>
                            ),
                        }}
                    />
                }
            />
        </Card>
    );
};
