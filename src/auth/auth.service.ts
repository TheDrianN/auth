import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService  {
  private prisma = new PrismaClient();
  constructor(private readonly jwtService: JwtService) {}

  // Método para validar credenciales de usuario
  async validateUser(document: string, password: string): Promise<any> {
    // Busca al usuario en la base de datos usando Prisma
    const user = await this.prisma.user.findFirst({
      where: { document },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verifica si la contraseña proporcionada coincide con el hash almacenado
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Devuelve el usuario sin el campo de la contraseña
  
    return user;
  }

  // Método para iniciar sesión y generar el token JWT
  async login(user: any) {
    const payload = { document: user.document, password: user.password, sub: user.id, role: user.rol };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // Método para crear un hash seguro de la contraseña
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }
}
