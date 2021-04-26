# Amazon DynamoDB + DAX CDK Demo Project with table seeding

This is an AWS CDK project that creates a simple Amazon DynamoDB table and DAX cluster. 

The template also includes a custom Lambda function that automatically seeds your table after creation with some sample data from a CSV function. You can edit the table schema or sample data as needed. 

While not yet, my plan is to eventually add some example code to demonstrate performance differences between using DynamoDB directly vs. taking advantage of the in-memory writethrough cache that DAX provides. 