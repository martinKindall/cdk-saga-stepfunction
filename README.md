# CDK Patterns - Saga Step Function

The original proyect: https://github.com/cdk-patterns/serverless/blob/main/the-saga-stepfunction/README.md
This is just a rewrite using CDK 2.X.

## Deploy

```bash
npm run build
cdk deploy
```

## Usage

```
Successful Execution - https://{api gateway url}
Reserve Hotel Fail - https://{api gateway url}?runType=failHotelReservation
Confirm Hotel Fail - https://{api gateway url}?runType=failHotelConfirmation
Reserve Flight Fail - https://{api gateway url}?runType=failFlightsReservation
Confirm Flight Fail - https://{api gateway url}?runType=failFlightsConfirmation
Take Payment Fail - https://{api gateway url}?runType=failPayment

Inserting Muliple trips into DynamoDB, by default it will use the same ID on every execution
https://{api gateway url}?tripID={whatever you want}
```

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
