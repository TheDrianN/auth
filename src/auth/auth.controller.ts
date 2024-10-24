import { Controller, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';


@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('validation')
  async validation(@Payload() loginDto: { document: string; password: string }) {
    
    const { document, password } = loginDto;

    // Valida las credenciales del usuario
    const user = await this.authService.validateUser(document, password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const code = await this.authService.generateCode();
    const mensaje = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #333333;
            font-size: 24px;
          }
          p {
            font-size: 16px;
            color: #666666;
            line-height: 1.5;
          }
          .code-box {
            margin: 20px 0;
            padding: 15px;
            background-color: #ff4b4b;
            color: #ffffff;
            font-size: 22px;
            text-align: center;
            border-radius: 5px;
            letter-spacing: 2px;
          }
          .footer {
            font-size: 14px;
            color: #999999;
            margin-top: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Código de Verificación</h1>
          <p>Estimado/a ${user.names},</p>
          <p>Hemos recibido una solicitud para iniciar sesión en tu cuenta. Tu código de verificación es:</p>
          <div class="code-box">${code}</div>
          <p>Este código es válido por 1 minuto. Si no has solicitado este código, por favor ignora este correo.</p>
          <p class="footer">Saludos,<br>Equipo de Soporte</p>
        </div>
      </body>
    </html>
    `;
    

    await this.authService.sendEmail(user.email,'Codigo de verificación',mensaje,true);
    // Genera el token JWT y retorna la respuesta
    return {
      status:HttpStatus.ACCEPTED,
      data:code
    };
  }

  @MessagePattern('loginAuth')
  async login(@Payload() loginDto: { document: string; password: string }) {
    
    const { document, password } = loginDto;

    // Valida las credenciales del usuario
    const user = await this.authService.validateUser(document, password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Genera el token JWT y retorna la respuesta
    return this.authService.login(user);
  }

  @MessagePattern('send-email')
  async sendEmail(@Payload() payload: { email: string; subject: string; message: string }) {
    const { email, subject, message } = payload;
  
    try {
      const info = await this.authService.sendEmail(email, subject, message);
      return { message: 'Correo enviado con éxito', info };
    } catch (error) {
      throw new Error('Error al enviar el correo'); // Aseguramos que el error se lance adecuadamente
    }
  }

  @MessagePattern('votingconfirmation')
  async votingconfirmation(@Payload() votingDto: { id: number; message: string }) {
    const { id, message } = votingDto;
  
    // Validar las credenciales del usuario
    const user = await this.authService.getUser(id);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  
    // Crear el mensaje HTML mejorado
    const formattedMessage = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #4CAF50; text-align: center;">Confirmación de su Voto</h2>
        <p>Estimado(a) ${user.names},</p>
        <p>Gracias por participar en las elecciones del Colegio de Ingenieros del Perú. A continuación se presenta un resumen de su voto:</p>
        <hr style="border: 1px solid #4CAF50;" />
        <div style="padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
          ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
        </div>
        <hr style="border: 1px solid #4CAF50;" />
        <p>Si tiene alguna duda o consulta, por favor no dude en contactarnos.</p>
        <p>Atentamente,</p>
        <p><strong>Colegio de Ingenieros del Perú - Consejo Departamental de Lambayeque</strong></p>
      </div>
    `;
  
    // Enviar el correo con el mensaje formateado
    await this.authService.sendEmail(user.email, 'Resumen de voto', formattedMessage, true);  // true indica que el contenido es HTML
  
    // Generar la respuesta con status HTTP
    return {
      status: HttpStatus.ACCEPTED,
      data: 'Envio exitoso',
    };
  }
  
}
