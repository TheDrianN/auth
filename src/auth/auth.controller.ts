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
    Estimado/a ${user.names}, 
    
    Hemos recibido una solicitud para iniciar sesión en tu cuenta.
    Tu código de verificación es: ${code}
    
    Este código es válido por 1 minuto. Si no has solicitado este código, por favor ignora este correo.
    
    Saludos,
    Equipo de Soporte
  `;

    await this.authService.sendEmail(user.email,'Codigo de verificación',mensaje);
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
  async votingconfirmation(@Payload() votingDto: { id: number; message:string}) {
    
    const { id,message } = votingDto;

    // Valida las credenciales del usuario
    const user = await this.authService.getUser(id);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.authService.sendEmail(user.email,'Resumen de voto',message);


    // Genera el token JWT y retorna la respuesta
    return this.authService.login(user);
  }
}
