import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';

import { desktopApi, BootstrapTorEvent } from '@trezor/suite-desktop-api';
import { LoadingScreen } from '@suite-support/screens/LoadingScreen';
import { P, Button, Progress, variables } from '@trezor/components';
import { Image } from '@suite-components';
import { ThemeProvider } from '@suite-support/ThemeProvider';
import { TorStatus } from '@suite-types';

const Wrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
`;

const Text = styled(P)`
    height: 0;
    font-size: ${variables.FONT_SIZE.H2};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const ModalWindow = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: 16px;
    text-align: center;
    transition: all 0.3s;
    max-width: 95%;
    min-width: 305px;
    width: 720px;
    padding: 42px;

    ${({ theme }) =>
        css`
            background: ${theme.BG_WHITE};
            box-shadow: 0 10px 80px 0 ${theme.BOX_SHADOW_MODAL};
        `}
`;

const Percentage = styled.div`
    display: flex;
    font-variant-numeric: tabular-nums;
    height: 24px;
`;

const StyledProgress = styled(Progress)`
    display: flex;
    margin-right: 20px;
    margin-left: 20px;
    border-radius: 5px;
    background: ${({ theme }) => theme.STROKE_GREY_ALT};
    flex: 1;

    ${Progress.Value} {
        height: 3px;
        position: relative;
        border-radius: 5px;
    }
`;

const ProgressWrapper = styled.div`
    display: flex;
    align-items: center;
    background: #e8e8e8;
    border-radius: 8px;
    width: 470px;
`;

const ProgressMessage = styled.div`
    margin-left: 10px;
    margin-right: 10px;
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const InfoWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const MessageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-bottom: 50px;
`;

const Separator = styled.hr`
    height: 1px;
    width: 100%;
    background: none;
    border: 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    margin: 20px;
`;

const TryAgainWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const DisableButton = styled(Button)`
    padding-right: 30px;
    padding-left: 30px;
    border: 1px solid #f4f4f4;
    margin-left: 10px;
`;

interface TorLoadingScreenProps {
    callback?: (value?: unknown) => void | null;
    torSettings: { running: boolean; address: string };
}

export const TorLoadingScreen = ({ callback, torSettings }: TorLoadingScreenProps) => {
    const [torStatus, setTorStatus] = useState<TorStatus>(TorStatus.Enabling);
    const [progress, setProgress] = useState<number>(0);

    const setError = () => {
        setTorStatus(TorStatus.Error);
    };

    useEffect(() => {
        if (callback) {
            setError();
        }
    }, [callback]);

    // We unsubscribe and subscribe again, to avoid memory leaks.
    desktopApi.removeAllListeners('tor/bootstrap');
    desktopApi.on('tor/bootstrap', (bootstrapEvent: BootstrapTorEvent) => {
        if (torStatus === TorStatus.Disabling) return;
        if (bootstrapEvent.type !== 'error') {
            setError();
        }
        if (bootstrapEvent.type !== 'progress') return;
        if (
            bootstrapEvent &&
            bootstrapEvent.type === 'progress' &&
            bootstrapEvent.progress &&
            bootstrapEvent.progress.current
        ) {
            setProgress(bootstrapEvent.progress.current);
            if (bootstrapEvent.progress.current === bootstrapEvent.progress.total) {
                desktopApi.removeAllListeners('tor/bootstrap');
                setTorStatus(TorStatus.Enabled);
                if (callback) {
                    callback();
                }
            } else {
                setTorStatus(TorStatus.Enabling);
            }
        }
    });

    let message = 'Enabling TOR';
    if (torStatus === TorStatus.Error) {
        message = 'Enabling TOR Failed';
    } else if (torStatus === TorStatus.Disabling) {
        message = 'Disabling Tor';
    }

    const tryAgain = async () => {
        setTorStatus(TorStatus.Enabling);
        const torLoaded = await desktopApi.toggleTor(true);
        if (!torLoaded.success) {
            setError();
        }
    };

    const disableTor = async () => {
        let fakeProgress = 0;
        desktopApi.removeAllListeners('tor/bootstrap');

        setTorStatus(TorStatus.Disabling);
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (fakeProgress === 100) {
                    clearInterval(interval);
                    return resolve(null);
                }
                fakeProgress += 10;
                setProgress(fakeProgress);
            }, 300);
        });
        desktopApi.toggleTor(false);
        if (callback) {
            callback();
        }
    };

    // Before the actual loading starts we want to display generic loading,
    // to avoid displaying TOR related screen when TOR is disable.
    if (!torSettings.running) {
        // If the user does not want to run Tor we donot need this listener.
        desktopApi.removeAllListeners('tor/bootstrap');
        return <LoadingScreen />;
    }

    return (
        <ThemeProvider>
            <Wrapper>
                <ModalWindow>
                    <MessageWrapper>
                        <Image width={130} height={130} image="TOR_ENABELING" />
                        <Text>{message}</Text>
                    </MessageWrapper>

                    <InfoWrapper>
                        <ProgressWrapper>
                            <StyledProgress
                                isRed={torStatus === TorStatus.Error}
                                value={torStatus === TorStatus.Error ? 100 : progress}
                            />
                            <ProgressMessage>
                                {torStatus === TorStatus.Error ? (
                                    <P>Failed</P>
                                ) : (
                                    <Percentage>{progress} %</Percentage>
                                )}
                            </ProgressMessage>
                        </ProgressWrapper>
                        {torStatus !== TorStatus.Disabling && (
                            <DisableButton
                                variant="secondary"
                                isWhite
                                onClick={e => {
                                    e.stopPropagation();
                                    disableTor();
                                }}
                            >
                                Disable TOR
                            </DisableButton>
                        )}
                    </InfoWrapper>

                    {torStatus === TorStatus.Error && (
                        <TryAgainWrapper>
                            <Separator />
                            <Button
                                onClick={e => {
                                    e.stopPropagation();
                                    tryAgain();
                                }}
                            >
                                Try Again
                            </Button>
                        </TryAgainWrapper>
                    )}
                </ModalWindow>
            </Wrapper>
        </ThemeProvider>
    );
};
