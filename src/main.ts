import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { envs } from './config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Crear servidor HTTP
 const app = await NestFactory.create(AppModule);

 app.useGlobalPipes(
   new ValidationPipe({
     whitelist: true,
     forbidUnknownValues: true,
   }),
 );

 console.log("Port1",process.env.PORT);
 console.log("Port2",envs.port_mc);
 // Configurar puerto HTTP desde variable de entorno
 const port = process.env.PORT || 8080;  // Cambio aquí
 await app.listen(port); 
 // Conectar microservicio TCP
 const microservice = app.connectMicroservice<MicroserviceOptions>({
   transport: Transport.TCP,
   options: {
     port: 3002, // Puerto del microservicio
   },
 });

 await app.startAllMicroservices(); // Inicia microservicio
 
}
bootstrap();
