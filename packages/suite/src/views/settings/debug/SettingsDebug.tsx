import React from 'react';

import { SettingsLayout } from '@settings-components';
import { SettingsSection } from '@suite-components/Settings';
import { isWeb } from '@suite-utils/env';

import { TranslationMode } from './TranslationMode';
import { GithubIssue } from './GithubIssue';
import { WipeData } from './WipeData';
import { ThrowTestingError } from './ThrowTestingError';
import { InvityApi } from './InvityApi';
import { OAuthApi } from './OAuthApi';

export const SettingsDebug = () => (
    <SettingsLayout>
        {isWeb() && (
            <SettingsSection title="Localization">
                <TranslationMode />
            </SettingsSection>
        )}
        <SettingsSection title="Debug">
            <GithubIssue />
            {!isWeb() && <WipeData />}
            <ThrowTestingError />
        </SettingsSection>
        <SettingsSection title="Invity">
            <InvityApi />
        </SettingsSection>
        <SettingsSection title="OAuth">
            <OAuthApi />
        </SettingsSection>
    </SettingsLayout>
);
