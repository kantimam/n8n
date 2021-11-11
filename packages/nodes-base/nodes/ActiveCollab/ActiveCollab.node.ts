import {
    IExecuteFunctions,
} from 'n8n-core';

import {
    IDataObject,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

import {
    OptionsWithUri,
} from 'request';

export class ActiveCollab implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'ActiveCollab',
        name: 'activeCollab',
        icon: 'file:activeCollab.svg',
        group: ['transform'],
        version: 1,
        description: 'Consume ActiveCollab API',
        defaults: {
            name: 'ActiveCollab',
            color: '#1A82e2',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'activeCollabApi',
                required: true
            }
        ],
        properties: [
            // Node properties which the user gets displayed and
            // can change on the node.
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                options: [
                    {
                        name: 'Contact',
                        value: 'contact',
                    },
                ],
                default: 'contact',
                required: true,
                description: 'Resource to consume',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: [
                            'contact',
                        ],
                    },
                },
                options: [
                    {
                        name: 'Create',
                        value: 'create',
                        description: 'Create a contact',
                    },
                ],
                default: 'create',
                description: 'The operation to perform.',
            },
            {
                displayName: 'Email',
                name: 'email',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        operation: [
                            'create',
                        ],
                        resource: [
                            'contact',
                        ],
                    },
                },
                default:'',
                description:'Primary email for the contact',
            },
             
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        let responseData;
        const returnData = [];
        const resource = this.getNodeParameter('resource', 0) as string;
        const operation = this.getNodeParameter('operation', 0) as string;
        //Get credentials the user provided for this node
        const credentials = await this.getCredentials('activeCollabApi') as IDataObject;
    
        for (let i = 0; i < items.length; i++) {
            if (resource === 'contact') {
                if (operation === 'create') {
                    // get email input
                    const email = this.getNodeParameter('email', i) as string;
    
                    // i = 1 returns ricardo@n8n.io
                    // i = 2 returns hello@n8n.io
    
                    // get additional fields input
                    const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
                    const data: IDataObject = {
                        email,
                    };
    
                    Object.assign(data, additionalFields);
    
                    //Make http request according to <https://sendgrid.com/docs/api-reference/>
                    const options: OptionsWithUri = {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${credentials.apiKey}`,
                        },
                        method: 'PUT',
                        body: {
                            contacts: [
                                data,
                            ],
                        },
                        uri: `https://api.sendgrid.com/v3/marketing/contacts`,
                        json: true,
                    };
    
                    responseData = await this.helpers.request(options);
                    returnData.push(responseData);
                }
            }
        }
        // Map data to n8n data structure
        return [this.helpers.returnJsonArray(returnData)];
    }
}
 