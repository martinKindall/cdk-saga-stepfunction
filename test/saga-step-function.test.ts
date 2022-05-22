import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as SagaStepFunction from '../lib/saga-step-function-stack';

describe('Structural testing', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new SagaStepFunction.SagaStepFunctionStack(app, 'MyTestStack');
    template = Template.fromStack(stack);
  });

  test('API Gateway proxy created', () => {
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: "{proxy+}"
    });
    template.resourceCountIs('AWS::ApiGateway::Resource', 1);
  });

  test('Saga lambda created', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: "sagaLambda.handler",
      Runtime: "nodejs12.x"
    });
  });

  test('Saga Lambda Permissions To Execute StepFunction', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [{
          "Action": "states:StartExecution",
          "Effect": "Allow"
        }]
      }
    });
  });

  test('Saga State Machine Created', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      "DefinitionString": {
        "Fn::Join": [
          "",
          [
            "{\"StartAt\":\"ReserveHotel\",\"States\":{\"ReserveHotel\":{\"Next\":\"ReserveFlight\",\"Retry\":[{\"ErrorEquals\":[\"Lambda.ServiceException\",\"Lambda.AWSLambdaException\",\"Lambda.SdkClientException\"],\"IntervalSeconds\":2,\"MaxAttempts\":6,\"BackoffRate\":2}],\"Catch\":[{\"ErrorEquals\":[\"States.ALL\"],\"ResultPath\":\"$.ReserveHotelError\",\"Next\":\"CancelHotelReservation\"}],\"Type\":\"Task\",\"ResultPath\":\"$.ReserveHotelResult\",\"Resource\":\"arn:",
            {
              "Ref": "AWS::Partition"
            },
            ":states:::lambda:invoke\",\"Parameters\":{\"FunctionName\":\"",
            {
              "Fn::GetAtt": [
                "reserveHotelLambdaHandler020AE24A",
                "Arn"
              ]
            },
            "\",\"Payload.$\":\"$\"}},\"ReserveFlight\":{\"Next\":\"TakePayment\",\"Retry\":[{\"ErrorEquals\":[\"Lambda.ServiceException\",\"Lambda.AWSLambdaException\",\"Lambda.SdkClientException\"],\"IntervalSeconds\":2,\"MaxAttempts\":6,\"BackoffRate\":2}],\"Catch\":[{\"ErrorEquals\":[\"States.ALL\"],\"ResultPath\":\"$.ReserveFlightError\",\"Next\":\"CancelFlightReservation\"}],\"Type\":\"Task\",\"ResultPath\":\"$.ReserveFlightResult\",\"Resource\":\"arn:",
            {
              "Ref": "AWS::Partition"
            },
            ":states:::lambda:invoke\",\"Parameters\":{\"FunctionName\":\"",
            {
              "Fn::GetAtt": [
                "reserveHotelLambdaHandler020AE24A",
                "Arn"
              ]
            },
            "\",\"Payload.$\":\"$\"}},\"TakePayment\":{\"Next\":\"ConfirmHotelBooking\",\"Retry\":[{\"ErrorEquals\":[\"Lambda.ServiceException\",\"Lambda.AWSLambdaException\",\"Lambda.SdkClientException\"],\"IntervalSeconds\":2,\"MaxAttempts\":6,\"BackoffRate\":2}],\"Catch\":[{\"ErrorEquals\":[\"States.ALL\"],\"ResultPath\":\"$.TakePaymentError\",\"Next\":\"RefundPayment\"}],\"Type\":\"Task\",\"ResultPath\":\"$.TakePaymentResult\",\"Resource\":\"arn:",
            {
              "Ref": "AWS::Partition"
            },
            ":states:::lambda:invoke\",\"Parameters\":{\"FunctionName\":\"",
            {
              "Fn::GetAtt": [
                "takePaymentLambdaHandlerB96529D4",
                "Arn"
              ]
            },
            "\",\"Payload.$\":\"$\"}},\"ConfirmHotelBooking\":{\"Next\":\"ConfirmFlight\",\"Retry\":[{\"ErrorEquals\":[\"Lambda.ServiceException\",\"Lambda.AWSLambdaException\",\"Lambda.SdkClientException\"],\"IntervalSeconds\":2,\"MaxAttempts\":6,\"BackoffRate\":2}],\"Catch\":[{\"ErrorEquals\":[\"States.ALL\"],\"ResultPath\":\"$.ConfirmHotelBookingError\",\"Next\":\"RefundPayment\"}],\"Type\":\"Task\",\"ResultPath\":\"$.ConfirmHotelBookingResult\",\"Resource\":\"arn:",
            {
              "Ref": "AWS::Partition"
            },
            ":states:::lambda:invoke\",\"Parameters\":{\"FunctionName\":\"",
            {
              "Fn::GetAtt": [
                "confirmHotelLambdaHandler882ACF2D",
                "Arn"
              ]
            },
            "\",\"Payload.$\":\"$\"}},\"ConfirmFlight\":{\"Next\":\"We have made your booking\",\"Retry\":[{\"ErrorEquals\":[\"Lambda.ServiceException\",\"Lambda.AWSLambdaException\",\"Lambda.SdkClientException\"],\"IntervalSeconds\":2,\"MaxAttempts\":6,\"BackoffRate\":2}],\"Catch\":[{\"ErrorEquals\":[\"States.ALL\"],\"ResultPath\":\"$.ConfirmFlightError\",\"Next\":\"RefundPayment\"}],\"Type\":\"Task\",\"ResultPath\":\"$.ConfirmFlightResult\",\"Resource\":\"arn:",
            {
              "Ref": "AWS::Partition"
            },
            ":states:::lambda:invoke\",\"Parameters\":{\"FunctionName\":\"",
            {
              "Fn::GetAtt": [
                "confirmFlightLambdaHandler96C3663F",
                "Arn"
              ]
            },
            "\",\"Payload.$\":\"$\"}},\"We have made your booking\":{\"Type\":\"Succeed\"},\"RefundPayment\":{\"Next\":\"CancelFlightReservation\",\"Retry\":[{\"ErrorEquals\":[\"Lambda.ServiceException\",\"Lambda.AWSLambdaException\",\"Lambda.SdkClientException\"],\"IntervalSeconds\":2,\"MaxAttempts\":6,\"BackoffRate\":2},{\"ErrorEquals\":[\"States.ALL\"],\"MaxAttempts\":3}],\"Type\":\"Task\",\"ResultPath\":\"$.RefundPaymentResult\",\"Resource\":\"arn:",
            {
              "Ref": "AWS::Partition"
            },
            ":states:::lambda:invoke\",\"Parameters\":{\"FunctionName\":\"",
            {
              "Fn::GetAtt": [
                "refundPaymentLambdaHandler932D11D5",
                "Arn"
              ]
            },
            "\",\"Payload.$\":\"$\"}},\"CancelFlightReservation\":{\"Next\":\"CancelHotelReservation\",\"Retry\":[{\"ErrorEquals\":[\"Lambda.ServiceException\",\"Lambda.AWSLambdaException\",\"Lambda.SdkClientException\"],\"IntervalSeconds\":2,\"MaxAttempts\":6,\"BackoffRate\":2},{\"ErrorEquals\":[\"States.ALL\"],\"MaxAttempts\":3}],\"Type\":\"Task\",\"ResultPath\":\"$.CancelFlightReservationResult\",\"Resource\":\"arn:",
            {
              "Ref": "AWS::Partition"
            },
            ":states:::lambda:invoke\",\"Parameters\":{\"FunctionName\":\"",
            {
              "Fn::GetAtt": [
                "cancelFlightLambdaHandler437EEC76",
                "Arn"
              ]
            },
            "\",\"Payload.$\":\"$\"}},\"CancelHotelReservation\":{\"Next\":\"Sorry, we couldn't make the booking.\",\"Retry\":[{\"ErrorEquals\":[\"Lambda.ServiceException\",\"Lambda.AWSLambdaException\",\"Lambda.SdkClientException\"],\"IntervalSeconds\":2,\"MaxAttempts\":6,\"BackoffRate\":2},{\"ErrorEquals\":[\"States.ALL\"],\"MaxAttempts\":3}],\"Type\":\"Task\",\"ResultPath\":\"$.CancelHotelReservationResult\",\"Resource\":\"arn:",
            {
              "Ref": "AWS::Partition"
            },
            ":states:::lambda:invoke\",\"Parameters\":{\"FunctionName\":\"",
            {
              "Fn::GetAtt": [
                "cancelHotelLambdaHandler09F13EF6",
                "Arn"
              ]
            },
            "\",\"Payload.$\":\"$\"}},\"Sorry, we couldn't make the booking.\":{\"Type\":\"Fail\"}},\"TimeoutSeconds\":300}"
          ]
        ]
      }
    });
  });

  test('8 Separate DynamoDB Read/Write IAM Policies Created', () => {
    const policies = template.findResources('AWS::IAM::Policy', {
      Properties: Match.objectLike({
        PolicyDocument:  Match.objectLike({
          Statement: [{
            "Action": [
              "dynamodb:BatchGetItem",
              "dynamodb:GetRecords",
              "dynamodb:GetShardIterator",
              "dynamodb:Query",
              "dynamodb:GetItem",
              "dynamodb:Scan",
              "dynamodb:ConditionCheckItem",
              "dynamodb:BatchWriteItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "dynamodb:DescribeTable"
            ],
            "Effect": "Allow"
          }]
        })
      })
    });

    expect(Object.keys(policies)).toHaveLength(8);
  });

  test('1 DynamoDB Table Created', () => {
    const tables = template.findResources('AWS::DynamoDB::Table', {
      Properties: Match.objectLike({
        KeySchema: [
          {AttributeName: "pk", KeyType: 'HASH'},
          {AttributeName: "sk", KeyType: 'RANGE'}
        ]
      })
    });

    expect(Object.keys(tables)).toHaveLength(1);
  });

  test('Hotel Reservation Lambda Created', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: "hotel/reserveHotel.handler",
      Runtime: "nodejs12.x"
    });
  });
});
