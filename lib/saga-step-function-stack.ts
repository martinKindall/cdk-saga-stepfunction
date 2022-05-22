import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfn_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
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
    this.sagaStepFunction();
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

  private sagaStepFunction() {
    const bookingFailed = new sfn.Fail(this, "Sorry, we couldn't make the booking.", {});
    const bookingSucceeded = new sfn.Succeed(this, "We have made your booking");

    const cancelHotelReservation = new sfn_tasks.LambdaInvoke(this, 'CancelHotelReservation', {
      lambdaFunction: this.cancelHotelLambda,
      resultPath: '$.CancelHotelReservationResult'
    }).addRetry({maxAttempts: 3})
    .next(bookingFailed);

    const reserveHotel = new sfn_tasks.LambdaInvoke(this, 'ReserveHotel', {
      lambdaFunction: this.reserveHotelLambda,
      resultPath: '$.ReserveHotelResult'
    }).addCatch(cancelHotelReservation, {
      resultPath: '$.ReserveHotelError'
    });

    const cancelFlightReservation = new sfn_tasks.LambdaInvoke(this, 'CancelFlightReservation', {
      lambdaFunction: this.cancelFlightLambda,
      resultPath: '$.CancelFlightReservationResult'
    }).addRetry({maxAttempts: 3})
    .next(cancelHotelReservation);

    const reserveFlight = new sfn_tasks.LambdaInvoke(this, 'ReserveFlight', {
      lambdaFunction: this.reserveHotelLambda,
      resultPath: '$.ReserveFlightResult'
    }).addCatch(cancelFlightReservation, {
      resultPath: '$.ReserveFlightError'
    });

    // Payment

    const refundPayment = new sfn_tasks.LambdaInvoke(this, 'RefundPayment', {
      lambdaFunction: this.refundPaymentLambda,
      resultPath: '$.RefundPaymentResult'
    }).addRetry({maxAttempts: 3})
    .next(cancelFlightReservation);

    const takePayment = new sfn_tasks.LambdaInvoke(this, 'TakePayment', {
      lambdaFunction: this.takePaymentLambda,
      resultPath: '$.TakePaymentResult'
    }).addCatch(refundPayment, {
      resultPath: '$.TakePaymentError'
    });

    // Confirm

    const confirmHotelBooking = new sfn_tasks.LambdaInvoke(this, 'ConfirmHotelBooking', {
      lambdaFunction: this.confirmHotelLambda,
      resultPath: '$.ConfirmHotelBookingResult'
    }).addCatch(refundPayment, {
      resultPath: '$.ConfirmHotelBookingError'
    });

    const confirmFlight = new sfn_tasks.LambdaInvoke(this, 'ConfirmFlight', {
      lambdaFunction: this.confirmFlightLambda,
      resultPath: '$.ConfirmFlightResult'
    }).addCatch(refundPayment, {
      resultPath: '$.ConfirmFlightError'
    });

    // Step Function

    const definition = sfn.Chain
    .start(reserveHotel)
    .next(reserveFlight)
    .next(takePayment)
    .next(confirmHotelBooking)
    .next(confirmFlight)
    .next(bookingSucceeded);

    const saga = new sfn.StateMachine(this, 'BookingSaga', {
      definition,
      timeout: Duration.minutes(5)
    });

    const sagaLambda = new lambda.Function(this, 'sagaLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda-fns'),
      handler: 'sagaLambda.handler',
      environment: {
        statemachine_arn: saga.stateMachineArn
      }
    });

    saga.grantStartExecution(sagaLambda);

    new apigw.LambdaRestApi(this, 'SagaPatternsSingleTable', {
      handler: sagaLambda
    });
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
