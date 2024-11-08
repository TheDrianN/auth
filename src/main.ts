import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { envs } from './config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Crear servidor HTTP
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,{
      transport: Transport.TCP,
      options:{
        host: '0.0.0.0', // Acepta conexiones de cualquier red o dispositivo
        port: envs.port
      }
    }
  );
  console.log("Port2",envs.port);
  console.log("SECRET_KEY",envs.secret_key);

  console.log("SMTP_HOST",envs.smtp_host);

  console.log("SMTP_PORT",envs.smtp_port);

  console.log("SMTP_USER",envs.smtp_user);
  console.log("SMTP_PASS",envs.smtp_pass);
  console.log("FIREBASE_CREDENTIALS_PATH",envs.port);



  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:true,
      forbidUnknownValues: true,
    })
  )
  await app.listen();
 
}
bootstrap();
