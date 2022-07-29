import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { CryptoIcon, Icon } from '@trezor/icons';
import TrezorConnect, { AccountInfo } from '@trezor/connect';
import { Screen, StackProps } from '@suite-native/navigation';
import { Box, Button, Text, Card, InputWrapper, Input, Select } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { OnboardingStackParamList, OnboardingStackRoutes } from '../navigation/routes';
import { AssetsLoader } from '../components/AssetsLoader';

const assetsStyle = prepareNativeStyle(utils => ({
    flex: 1,
    padding: utils.spacings.medium,
    justifyContent: 'space-around',
}));

export const OnboardingAssets = ({
    route,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.OnboardingAssets>) => {
    const [inputText, setInputText] = useState<string>('');
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const { applyStyle } = useNativeStyles();

    const { xpubAddress, coin } = route.params;

    const getAccountInfo = useCallback(() => {
        TrezorConnect.getAccountInfo({
            coin,
            descriptor: xpubAddress,
        })
            .then(accountInfo => {
                if (accountInfo?.success) {
                    setAccountInfo(accountInfo.payload);
                }
                // TODO error?
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.log('getAccountInfo failed: ', JSON.stringify(error));
            });
    }, [xpubAddress, coin]);

    useEffect(() => {
        const fetchingTimerId = setTimeout(() => {
            getAccountInfo();
        }, 800);

        return () => clearTimeout(fetchingTimerId);
    }, [getAccountInfo]);

    return (
        <Screen>
            {!accountInfo ? (
                <AssetsLoader />
            ) : (
                <View style={[applyStyle(assetsStyle)]}>
                    <View>
                        <Box flexDirection="row" justifyContent="space-between">
                            <Text variant="titleMedium" color="black">
                                Import assets
                            </Text>
                            <Icon name="close" />
                        </Box>
                        <Card>
                            <Box marginTop="large" marginBottom="medium">
                                <Box
                                    alignItems="center"
                                    justifyContent="center"
                                    marginBottom="medium"
                                >
                                    <CryptoIcon name="btc" size="large" />
                                    <Box marginTop="large" marginBottom="small">
                                        <Text variant="titleSmall" color="black">
                                            123 321,22 Kč
                                        </Text>
                                    </Box>
                                    <Text variant="label" color="black">
                                        ≈ 0.0003333 BTC
                                    </Text>
                                </Box>
                                <Box marginBottom="large">
                                    <InputWrapper>
                                        <Input
                                            value={inputText}
                                            onChange={setInputText}
                                            label="bitcoines #1"
                                            colorScheme="gray"
                                        />
                                    </InputWrapper>
                                </Box>
                                <InputWrapper label="device">
                                    <Select
                                        items={[]}
                                        selectLabel="Language"
                                        value={null}
                                        onSelectItem={() => {}}
                                    />
                                </InputWrapper>
                            </Box>
                        </Card>
                    </View>
                    <Button
                        onPress={() => {
                            console.log('JOOO');
                        }}
                        size="large"
                    >
                        Confirm
                    </Button>
                </View>
            )}
        </Screen>
    );
};
