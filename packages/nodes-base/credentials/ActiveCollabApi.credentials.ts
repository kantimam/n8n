import {
    ICredentialType,
    NodePropertyTypes,
} from 'n8n-workflow';

export class ActiveCollabApi implements ICredentialType {
    name = 'activeCollabApi';
    displayName = 'ActiveCollab API';
    documentationUrl = 'activeCollab';
    properties = [
        {
            displayName: 'Username / Email',
            name: 'username',
            type: 'string' as NodePropertyTypes,
            default: '',
        },
        {
            displayName: 'Password',
            name: 'password',
            type: 'string' as NodePropertyTypes,
            default: '',
        },
        {
            displayName: 'Project Name',
            name: 'client_name',
            type: 'string' as NodePropertyTypes,
            default: '',
        },
        {
            displayName: 'Project Owner (Company)',
            name: 'client_vendor',
            type: 'string' as NodePropertyTypes,
            default: '',
        },

    ];
}