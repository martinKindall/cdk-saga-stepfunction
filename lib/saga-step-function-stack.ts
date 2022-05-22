import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class SagaStepFunctionStack extends Stack {
  private table: dynamodb.Table;

  private reserveFlightLambda: lambda.Function;
  private confirmFlightLambda: lambda.Function;
  private cancelFlightLambda: lambda.Function;

  private reserveHotelLambda: lambda.Function;
  private confirmHotelLambda: lambda.Function;
  private cancelHotelLambda: lambda.Function;

  private takePaymentLambda: lambda.Function;
  private refundPaymentLambda: lambda.Function;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.dynamoDbSetup();

    this.flightFunctions();
    this.hotelFunctions();
    this.paymentFunctions();
  }

  private dynamoDbSetup() {
    this.table = new dynamodb.Table(this, 'Bookings', {
      partitionKey: {name: 'pk', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'sk', type: dynamodb.AttributeType.STRING},
    });
  }

  private flightFunctions() {
    this.reserveFlightLambda = this.createLambda('reserveFlightLambdaHandler', 'flights/reserveFlight.handler');
    this.confirmFlightLambda = this.createLambda('confirmFlightLambdaHandler', 'flights/confirmFlight.handler');
    this.cancelFlightLambda = this.createLambda('cancelFlightLambdaHandler', 'flights/cancelFlight.handler');
  }

  private hotelFunctions() {
    this.reserveHotelLambda = this.createLambda('reserveHotelLambdaHandler', 'hotel/reserveHotel.handler');
    this.confirmHotelLambda = this.createLambda('confirmHotelLambdaHandler', 'hotel/confirmHotel.handler');
    this.cancelHotelLambda = this.createLambda('cancelHotelLambdaHandler', 'hotel/cancelHotel.handler');
  }

  private paymentFunctions() {
    this.takePaymentLambda = this.createLambda('takePaymentLambdaHandler', 'payment/takePayment.handler');
    this.refundPaymentLambda = this.createLambda('refundPaymentLambdaHandler', 'payment/refundPayment.handler');
  }

  private createLambda(id: string, handler: string) {
    const newLambda = new lambda.Function(this, id, {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda-fns'),
      handler,
      environment: {
        TABLE_NAME: this.table.tableName
      }
    });

    this.table.grantReadWriteData(newLambda);
    return newLambda;
  }
}
