import {
    IExecuteFunctions,
} from 'n8n-core';

import {
    IDataObject,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';



//import { Client } from "activecollab_node_sdk";


// @ts-ignore
//const {Client} =require('./lib/Client/Client.js')
import Client from './lib/src/activeCollabLib'

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
            /*
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
             */
            {
                displayName: 'Project ID',
                name: 'projectId',
                type: 'string',
                required: true,
                default:'',
                description:'id of the connected project',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        try {
            const credentials = await this.getCredentials('activeCollabApi') as IDataObject;
            // Init Self-Hosted
            let client = new Client(
                credentials.username as string,
                credentials.password as string,
                credentials.client_name as string,
                credentials.client_vendor as string,
                undefined,
                credentials.url as string,
              );
            await client.issueToken();
            const returnData: IDataObject[] = [];

            //const projects: AxiosResponse = await client.get("projects");
            //if(!projects || !projects.data) return [this.helpers.returnJsonArray([])];

            //const projectsDataObj: IDataObject={projects: projects.data}
            
            //returnData.push(projectsDataObj)

            const items = this.getInputData();
            returnData.push({'receivedItems': items});
            
            const projectId = this.getNodeParameter('projectId', 0) as string;


            items.forEach(async(item: any)=>{
                const title=item.json.body.object_attributes.title;
                if(title){
                    const createdTask=await client.post(`projects/${projectId}/tasks`, {
                        name: title
                    })
                    returnData.push({
                        createdTask: createdTask.data
                    })
                }else{
                    const createdTask=await client.post(`projects/${projectId}/tasks`, {
                        name: `Task created at ${Date.now().toLocaleString()}`
                    })
                    returnData.push({
                        createdTask: createdTask.data
                    })
                }
            })

            

            

            //const operation = this.getNodeParameter('operation', 0) as string;
            const resource = 'contact';
            const operation = 'create';
            //Get credentials the user provided for this node
        

            // Map data to n8n data structure
            return [this.helpers.returnJsonArray(returnData)];
                //const projects = await client.get("projects");
          } catch (error) {
            console.log(error);
            return [this.helpers.returnJsonArray([])];

          }
        
    }
}
 