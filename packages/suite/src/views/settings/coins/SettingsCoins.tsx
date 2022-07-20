import React from 'react';
import styled from 'styled-components';

import { SettingsLayout } from '@settings-components';
import { CoinsGroup, Translation } from '@suite-components';
import { SettingsSection, SectionItem } from '@suite-components/Settings';
import { useEnabledNetworks } from '@settings-hooks/useEnabledNetworks';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';
import { FirmwareTypeSuggestion } from './FirmwareTypeSuggestion';

const StyledSettingsLayout = styled(SettingsLayout)`
    & > * + * {
        margin-top: 16px;
    }
`;

export const SettingsCoins = () => {
    const { mainnets, testnets, enabledNetworks, setEnabled } = useEnabledNetworks();

    const { anchorRef: anchorRefCrypto, shouldHighlight: shouldHighlightCrypto } = useAnchor(
        SettingsAnchor.Crypto,
    );
    const { anchorRef: anchorRefTestnetCrypto, shouldHighlight: shouldHighlightTestnetCrypto } =
        useAnchor(SettingsAnchor.TestnetCrypto);

    return (
        <StyledSettingsLayout>
            <FirmwareTypeSuggestion />
            <SettingsSection title={<Translation id="TR_COINS" />} icon="COIN">
                <SectionItem ref={anchorRefCrypto} shouldHighlight={shouldHighlightCrypto}>
                    <CoinsGroup
                        networks={mainnets}
                        onToggle={setEnabled}
                        selectedNetworks={enabledNetworks}
                    />
                </SectionItem>
            </SettingsSection>

            <SettingsSection title={<Translation id="TR_TESTNET_COINS" />} icon="COIN">
                <SectionItem
                    ref={anchorRefTestnetCrypto}
                    shouldHighlight={shouldHighlightTestnetCrypto}
                >
                    <CoinsGroup
                        networks={testnets}
                        onToggle={setEnabled}
                        selectedNetworks={enabledNetworks}
                        testnet
                    />
                </SectionItem>
            </SettingsSection>
        </StyledSettingsLayout>
    );
};
