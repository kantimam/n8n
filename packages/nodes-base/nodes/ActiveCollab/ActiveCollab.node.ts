import { update } from 'lodash';
import {
    IExecuteFunctions,
} from 'n8n-core';

import {
    IDataObject,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

// @ts-ignore
import Client from './lib/src/activeCollabLib'

const md = require('markdown-it')();

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

            const descriptionWithRepoUrl=(description: string, url: string)=>`gitlab issue url: ${url} <br /><br /> ${description}`;



            const items = this.getInputData();
            returnData.push({'receivedItems': items});

            const projectId = this.getNodeParameter('projectId', 0) as string;

            const gitlabEvent: any=items[0];
            if(gitlabEvent){
                try {
                    const object_attributes=gitlabEvent.json.body.object_attributes;

                    if(object_attributes) {
                        const {title="", description="", url="", action}=object_attributes;
												const parsedDescription = md.render(description);
												console.log(parsedDescription);
												const extendedDescription=descriptionWithRepoUrl(parsedDescription, url);

                        if(action==='update'){ // handle gitlab issue update
                            const changes=gitlabEvent.json.body.changes;
                            if(changes){
                                let prevTitle=title;
                                if(changes.title && changes.title.previous){
                                    prevTitle=changes.title.previous;
                                }
                                // get projects tasks
                                const res=await client.get(`projects/${projectId}/tasks`);
                                const tasksData=res.data;

                                if(!tasksData) throw Error('could not load tasks data')

                                returnData.push({
                                    tasksData
                                })

                                const tasks: any[]=tasksData.tasks;
                                if(!tasks) throw Error('could not load tasks')

                                const foundTask=tasks.find(task=>{
                                    //console.log("task: "+task.name+" git: "+prevTitle);
                                    return task.name==prevTitle
                                });
                                if(foundTask){ // if task with the same name was found update it
                                    const updatedProps: any={};
                                    if(changes.title) updatedProps.name=title;
                                    if(changes.description) updatedProps.body=extendedDescription

                                    const updateResponse=await client.put(`projects/${projectId}/tasks/${foundTask.id}`, updatedProps);
                                    returnData.push({
                                        updatedTask: updateResponse.data
                                    })
                                }else{ // create a new task
                                    console.log("task does not exist yet, creating new");
                                    const createResponse=await client.post(`projects/${projectId}/tasks`, {
                                        name: title,
                                        body: extendedDescription
                                    })
                                    returnData.push({
                                        createdTask: createResponse.data
                                    })
                                }
                            }
                        }
                        else{
                            const createResponse=await client.post(`projects/${projectId}/tasks`, {
                                name: title,
                                body: extendedDescription
                            })
                            returnData.push({
                                createdTask: createResponse.data
                            })
                        }
                    };
                } catch (error) {
                    console.log(error);
                    throw Error('failed to create task from gitlab issue');
                }

            }

            // Map data to n8n data structure
            return [this.helpers.returnJsonArray(returnData)];
          } catch (error: any) {
            console.log(error);
            throw Error('failed to init Active Collab connection');

          }

    }
}
