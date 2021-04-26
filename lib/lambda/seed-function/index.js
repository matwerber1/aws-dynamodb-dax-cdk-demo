const AWS = require('aws-sdk');
const csv = require('csvtojson');
//const cfnResponse = require('./cfn-response.js');
const dynamo = new AWS.DynamoDB.DocumentClient({});

const PARAMETERS = {
    TableName: process.env.TABLE_NAME
};

const DATA_FILE = 'table-data.csv';

exports.handler = async (event, context) => {
    
    console.log('Received event:\n' + JSON.stringify(event, null, 2));
    console.log('Received context:\n' + JSON.stringify(context, null, 2));

    var physicalResourceId; 

    if (event.RequestType === 'Create' || event.RequestType === 'Update') {
        await seedDynamo(DATA_FILE, PARAMETERS.TableName);
        physicalResourceId = event.LogicalResourceId; // we aren't creating any new resources, so can just use logical ID as physical ID
        return { 'PhysicalResourceId': physicalResourceId };
    }
    else if (event.RequestType === 'Delete') {
        // Nothing to do
        return;
    }
    else {
        throw new Error(`Unsupported request type: ${event.RequestType}`)
    }
};

const seedDynamo = async(csvFilePath, tableName) => {

    const jsonArray = await csv({
        delimiter: ',',
        nullObject: true
    }).fromFile(csvFilePath);

    const newItems = removeEmptyStringsFromJsonArray(jsonArray);

    let first = 0;
    const totalItems = newItems.length;
    console.log(`Items to write ${totalItems} to ${tableName}`);
    while (true){
        if (first > totalItems){
            break;
        }
        const itemsToWrite = newItems.slice(first, first+25);
        console.log(`Writing items ${first} through ${first+25}`)
        const results = await dynamo.batchWrite({
            RequestItems: {
                [tableName]: itemsToWrite.map(n=>{ return {
                    PutRequest: {
                        Item: n
                    }
                }})
            }
        }).promise();
        first = first + 25;
    }

};

// If our CSV contains an empty cell value, we interpret that to mean that the attribute itself
// is not present on the item, rather than the attribute being present with a blank "" string value.
// So, we must remove such elements from our item array before writing to DynamoDB:
function removeEmptyStringsFromJsonArray(jsonArray) {
    var response = [];
    for (const arrayItem of jsonArray) {
        response.push(Object.fromEntries(Object.entries(arrayItem).filter(([_, v]) => v != "")))
    }
    return response;

}