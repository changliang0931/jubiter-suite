/* eslint-disable @typescript-eslint/naming-convention */

import { MiddlewareAPI } from 'redux';
import { ROUTER } from '@suite-actions/constants';

import { AppState, Action, Dispatch } from '@suite-types';

const router = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
    const { router } = api.getState();
    const { initialRun } = api.getState().suite.flags;

    switch (action.type) {
        case ROUTER.LOCATION_CHANGE:
            /**
             * Store back route for navigation when closing the settings.
             * Exclude settings routes – we want to close the settings and not just switch the settigns tab...
             * Exclude foreground apps – to prevent going back to modals and other unexpected states.
             */
            if (router.app !== 'settings' && !router.route?.isForegroundApp) {
                return next({
                    ...action,
                    payload: {
                        ...action.payload,
                        settingsBackRoute: {
                            name:
                                router.route?.name ?? initialRun
                                    ? 'onboarding-index'
                                    : 'suite-index',
                            params: router.params,
                        },
                    },
                });
            }

            break;
        default:
            break;
    }
    return next(action);
};

export default router;
