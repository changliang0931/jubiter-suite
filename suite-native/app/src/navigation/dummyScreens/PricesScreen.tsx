import React from 'react';
import { View } from 'react-native';

import { Text } from '@suite-native/atoms';
import { TabProps } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { RootTabsParamList, RouteTabs } from '../routes';

const pricesScreenStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const PricesScreen: React.FC<TabProps<RootTabsParamList, RouteTabs.Prices>> = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(pricesScreenStyle)]}>
            <Text>Prices content</Text>
        </View>
    );
};
