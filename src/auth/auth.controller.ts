import { Controller, UnauthorizedException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';


@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @MessagePattern('prueba')
  prueba() {
   
    return {
      message:"prueba"
    }
  }
}
