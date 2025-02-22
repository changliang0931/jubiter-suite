import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import { Icon, Input, Switch, variables } from '@trezor/components';
import { getInputState, isInteger } from '@suite-common/wallet-utils';
import { MAX_LENGTH } from '@suite-constants/inputs';
import { isEnabled as isFeatureEnabled } from '@suite-common/suite-utils';

const Wrapper = styled.div`
    margin-bottom: 25px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-left: 8px;
`;

const RbfMessage = styled.div`
    display: flex;
    flex: 1;
    margin-top: 10px;
`;

const Left = styled.div`
    margin-right: 8px;
`;

const Center = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    max-width: 40px;
`;

const Title = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const Description = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

interface Props {
    close: () => void;
}

const Locktime = ({ close }: Props) => {
    const {
        network,
        register,
        getDefaultValue,
        setValue,
        toggleOption,
        errors,
        composeTransaction,
    } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const rbfEnabled = options.includes('bitcoinRBF');
    const broadcastEnabled = options.includes('broadcast');
    const inputName = 'bitcoinLockTime';
    const inputValue = getDefaultValue(inputName) || '';
    const error = errors[inputName];

    return (
        <Wrapper>
            <Input
                inputState={getInputState(error, inputValue)}
                isMonospace
                name={inputName}
                defaultValue={inputValue}
                maxLength={MAX_LENGTH.BTC_LOCKTIME}
                innerRef={register({
                    required: 'LOCKTIME_IS_NOT_SET',
                    validate: (value: string) => {
                        const amountBig = new BigNumber(value);
                        if (amountBig.isNaN()) {
                            return 'LOCKTIME_IS_NOT_NUMBER';
                        }
                        if (amountBig.lte(0)) {
                            return 'LOCKTIME_IS_TOO_LOW';
                        }
                        if (!isInteger(value)) {
                            return 'LOCKTIME_IS_NOT_INTEGER';
                        }
                        // max unix timestamp * 2 (2147483647 * 2)
                        if (amountBig.gt(4294967294)) {
                            return 'LOCKTIME_IS_TOO_BIG';
                        }
                    },
                })}
                onChange={() => {
                    if (!error) {
                        if (rbfEnabled) toggleOption('bitcoinRBF');
                        if (broadcastEnabled) toggleOption('broadcast');
                    }
                    composeTransaction(inputName);
                }}
                label={
                    <Label>
                        <Icon size={16} icon="CALENDAR" />
                        <Text>
                            <Translation id="LOCKTIME_SCHEDULE_SEND" />
                        </Text>
                    </Label>
                }
                labelRight={<Icon size={20} icon="CROSS" onClick={close} />}
                bottomText={<InputError error={error} />}
                data-test="locktime-input"
            />
            {isFeatureEnabled('RBF') && network.features?.includes('rbf') && (
                <RbfMessage>
                    <Left>
                        <Icon size={16} icon="RBF" />
                    </Left>
                    <Center>
                        <Title>
                            <Translation id={rbfEnabled ? 'RBF_ON' : 'RBF_OFF'} />
                        </Title>
                        <Description>
                            <Translation id="RBF_DESCRIPTION" />
                        </Description>
                    </Center>
                    <Right>
                        <Switch
                            isChecked={rbfEnabled}
                            onChange={() => {
                                if (inputValue.length > 0) {
                                    setValue(inputName, '');
                                }
                                toggleOption('bitcoinRBF');
                                composeTransaction(inputName);
                            }}
                        />
                    </Right>
                </RbfMessage>
            )}
        </Wrapper>
    );
};

export default Locktime;
