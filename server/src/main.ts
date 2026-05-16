import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ValidationPipe automatically validates every incoming request
  // using the rules we define in DTO classes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,             // strips out any fields not in the DTO
    forbidNonWhitelisted: true,  // throws error if unknown fields are sent
    transform: true,             // converts raw JSON to typed DTO objects
  }));

  // CORS: allow the React app to call this server
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(3001);
  console.log('Server running on http://localhost:3001');
}
bootstrap();
