import { Controller, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';


@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('validation')
  async validation(@Payload() loginDto: { document: string; password: string }) {
    
    const { document, password } = loginDto;
    console.log(loginDto);
    const user = await this.authService.findUserByDocument(document);
    console.log(user);

    if (!user) {
      return {
        status:HttpStatus.UNAUTHORIZED,
        message:'Credenciales inválidas'
      };
    }

    if (user.status ==='B') {
      throw new RpcException({
        message:'La cuenta está bloqueada debido a múltiples intentos fallidos.',
        status: HttpStatus.UNAUTHORIZED
      });
    }

    // Valida las credenciales del usuario
    const isValidUser  = await this.authService.validateUser(document, password);
    if (!isValidUser ) {
      await this.authService.incrementFailedAttempts(user.id);

      // Verificar si debe bloquear al usuario
      if (parseInt(user.code_access || '0', 10) + 1 >= 5) {
        throw new RpcException({
          message:'Cuenta bloqueada después de múltiples intentos fallidos.',
          status: HttpStatus.UNAUTHORIZED
        });
        
      }

      throw new RpcException({
        message: 'Credenciales inválidas.',
        status: HttpStatus.UNAUTHORIZED,
      });
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
            width: 25%;
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
          .logo {
            text-align: center;
            margin-bottom: 20px;
          }
          .code-box-container{
            width: 100%;
            display: flex;
            justify-content: center;

          }
        </style>
      </head>
      <body>
       <div class="logo">
        <img src="https://www.cip.org.pe/images/LOGO_CIP.png" alt="Logo Colegio de Ingenieros del Perú" width="120">
      </div>
        <div class="container">
          <h1>Código de Verificación</h1>
          <p>Estimado/a ${user.names},</p>
          <p>Hemos recibido una solicitud para iniciar sesión en tu cuenta. Tu código de verificación es:</p>
          <div class="code-box-container">
              <div class="code-box">${code}</div>
          </div>
          <p>Este código es válido por 1 minuto. Si no has solicitado este código, por favor ignora este correo.</p>
          <p class="footer">Atentamente,<br>Colegio de Ingenieros del Perú</p>
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
  async login(@Payload() loginDto: { document: string; password: string; code_access: string }) {
    
    const { document, password,code_access } = loginDto;
    // Valida las credenciales del usuario
    const user = await this.authService.validateUser(document, password);
    await this.authService.validateCode(code_access);
    if (!user) {
      throw new RpcException({
        message:'Credenciales inválidas.',
        status: HttpStatus.UNAUTHORIZED
      });
    }
    await this.authService.resetFailedAttempts(user.id);

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
     <div style="font-family: Arial, sans-serif; color: #333; text-align: center; background-color: #f9f9f9; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
    
    <!-- Logo -->
    <img src="https://www.cip.org.pe/images/LOGO_CIP.png" alt="Logo Colegio de Ingenieros del Perú" style="width: 100px; margin-bottom: 20px;" />
    
    <!-- Encabezado -->
    <h2 style="color: #f44336; font-size: 24px; margin-bottom: 20px;">Confirmación de su Voto</h2>
    
    <!-- Cuerpo del mensaje -->
    <p style="font-size: 16px; color: #555;">Estimado(a) ${user.names},</p>
    <p style="font-size: 16px; color: #555;">Gracias por participar en las elecciones del Colegio de Ingenieros del Perú. A continuación se presenta un resumen de su voto:</p>
    
    <!-- Línea divisoria -->
    <hr style="border: 1px solid #f44336; margin: 20px 0;" />
    
    <!-- Resumen del voto (tabla) -->
    <div style="padding: 15px; background-color: #f44336; border-radius: 8px; color: #fff;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #fff;">Elección</th>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #fff;">Voto</th>
          </tr>
        </thead>
        <tbody>
          ${message.split('\n').map(line => {
            const [eleccion, voto] = line.split(':');
            return `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #fff;">${eleccion}</td>
                <td style="padding: 8px; border-bottom: 1px solid #fff;">${voto}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Segunda línea divisoria -->
    <hr style="border: 1px solid #f44336; margin: 20px 0;" />
    
    <!-- Información adicional -->
    <p style="font-size: 16px; color: #555;">Si tiene alguna duda o consulta, por favor no dude en contactarnos.</p>
    
    <!-- Firma -->
    <p style="font-size: 16px; color: #555;">Atentamente,</p>
    <p style="font-size: 16px; font-weight: bold; color: #f44336;">Colegio de Ingenieros del Perú - Consejo Departamental de Lambayeque</p>
  
  </div>
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
