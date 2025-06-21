import { actions, afterMount, kea, key, listeners, path, props, reducers } from 'kea'
import { forms } from 'kea-forms'
import { loaders } from 'kea-loaders'
import { router } from 'kea-router'
import api from 'lib/api'
import { lemonToast } from 'lib/lemon-ui/LemonToast'
import { urls } from 'scenes/urls'

import type { campaignLogicType } from './campaignLogicType'
import { campaignSceneLogic } from './campaignSceneLogic'
import type { HogFlow, HogFlowAction } from './hogflows/types'

export interface CampaignLogicProps {
    id?: string
}

const NEW_CAMPAIGN: HogFlow = {
    id: 'new',
    name: '',
    actions: [
        {
            id: 'trigger_node',
            type: 'trigger',
            name: 'Trigger',
            description: '',
            created_at: 0,
            updated_at: 0,
            next_actions: {
                continue: {
                    action_id: 'exit_node',
                },
            },
        },
        {
            id: 'exit_node',
            type: 'exit',
            name: 'Exit',
            config: {
                reason: 'Default exit',
            },
            description: '',
            created_at: 0,
            updated_at: 0,
            next_actions: {},
        },
    ],
    trigger: { type: 'event' },
    trigger_masking: { ttl: 0, hash: '', threshold: 0 },
    conversion: { window_minutes: 0, filters: [] },
    exit_condition: 'exit_only_at_end',
    version: 1,
    status: 'draft',
    team_id: -1,
}

export type OnWorkflowChange = ({ actions }: { actions: HogFlowAction[] }) => void

export const campaignLogic = kea<campaignLogicType>([
    path(['products', 'messaging', 'frontend', 'Campaigns', 'campaignLogic']),
    props({ id: 'new' } as CampaignLogicProps),
    key((props) => props.id || 'new'),
    actions({
        setOriginalCampaign: (campaign: HogFlow) => ({ campaign }),
    }),
    loaders(({ props }) => ({
        campaign: {
            loadCampaign: async () => {
                if (!props.id || props.id === 'new') {
                    return { ...NEW_CAMPAIGN }
                }

                return api.hogFlows.getHogFlow(props.id)
            },
            saveCampaign: async (updates: Partial<HogFlow>) => {
                if (!props.id || props.id === 'new') {
                    return api.hogFlows.createHogFlow(updates)
                }

                return api.hogFlows.updateHogFlow(props.id, updates)
            },
        },
    })),
    forms(({ actions }) => ({
        campaign: {
            defaults: { ...NEW_CAMPAIGN } as HogFlow,
            submit: async (values) => {
                actions.saveCampaign(values)
            },
        },
    })),
    reducers({
        originalCampaign: [
            { ...NEW_CAMPAIGN } as HogFlow,
            {
                setOriginalCampaign: (_, { campaign }) => campaign,
                loadCampaignSuccess: (_, { campaign }) => {
                    return campaign
                },
            },
        ],
    }),
    listeners(({ actions }) => ({
        saveCampaignSuccess: async ({ campaign }) => {
            lemonToast.success('Campaign saved')
            campaign.id &&
                router.actions.replace(
                    urls.messagingCampaign(campaign.id, campaignSceneLogic.findMounted()?.values.currentTab)
                )
            actions.resetCampaign(campaign)
            actions.setOriginalCampaign(campaign)
        },
    })),
    afterMount(({ actions, props }) => {
        if (props.id && props.id !== 'new') {
            actions.loadCampaign()
        }
    }),
])
