import { HttpStatus, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import * as speakeasy from 'speakeasy';
import { envs } from '../config';
import { RpcException } from '@nestjs/microservices';


@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit  {
 
  private transporter;

  constructor(private readonly jwtService: JwtService) {
    super(); // Llamada al constructor de PrismaClient
    this.transporter = nodemailer.createTransport({
      host: envs.smtp_host , // Usa variables de entorno para mayor seguridad
      port: Number(envs.smtp_port),
      secure: false, // true para puerto 465, false para otros puertos
      auth: {
        user: envs.smtp_user,
        pass: envs.smtp_pass,
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Database connected');
  }

  // Método para validar credenciales de usuario
  async validateUser(document: string, password: string): Promise<any> {
    console.log(document);
    // Busca al usuario en la base de datos usando Prisma
    const user = await this.user.findFirst({
      where: { document },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verifica si la contraseña proporcionada coincide con el hash almacenado
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return false;
    }

    // Devuelve el usuario sin el campo de la contraseña
  
    return user;
  }

  async getUser(id: number): Promise<any> {
    // Busca al usuario en la base de datos usando Prisma
    const user = await this.user.findFirst({
      where: { id },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
  
    return user;
  }

  async findUserByDocument(document: string) {
    const user = await this.user.findFirst({
      where: { document: document },
    });
  
    if (!user) {
      throw new RpcException({
        message: `El usuario con el documento ${document} no existe`,
        status: HttpStatus.BAD_REQUEST,
      });
    }
  
    return user;
  }

  async incrementFailedAttempts(userId: number): Promise<void> {
    const user = await this.user.findUnique({
      where: { id: userId },
      select: { code_access: true }, // Solo obtienes el campo necesario
    });
    const failedAttempts = parseInt(user?.code_access || '0', 10); // Convierte a número, o inicia en 0
    const newAttempts = failedAttempts + 1; // Incrementa
  
    await this.user.update({
      where: { id: userId },
      data: {
        code_access: newAttempts.toString(), // Guarda el valor incrementado como string
      },
    });
  
    // Opcional: Bloquea al usuario si llega a 5 intentos
    if (newAttempts >= 5) {
      await this.blockUser(userId);
    }
  }

  async resetFailedAttempts(userId: number): Promise<void> {
    await this.user.update({
      where: { id: userId },
      data: { code_access: '0' }, // Restablece como string
    });
  }

  
  
  async blockUser(userId: number): Promise<void> {
    await this.user.update({
      where: { id: userId },
      data: { status: 'B' },
    });
  }


  // Método para iniciar sesión y generar el token JWT
  async login(user: any) {
    const payload = { username: user.names +' '+ user.surnames,chapter: user.chapter_id, sub: user.id, role: user.rol };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // Método para crear un hash seguro de la contraseña
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async generateCode() {
    const secret =  envs.secret_key; // Un "secreto" seguro almacenado en una variable de entorno
    const code = speakeasy.totp({
      secret,
      encoding: 'ascii', // Asegúrate de que el encoding coincida (cambia según formato del secreto)
      digits: 6, // Número de dígitos del código
      step: 60,  // Validez del código (30 segundos por defecto)
    });
  
    // Enviar el código al correo del usuario
    return code
  }

  async validateCode(userCode: string) {
    const secret = envs.secret_key; // El mismo secreto usado para generar el código
  
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'ascii',  // Codificación del secreto
      token: userCode, 
      step: 60,  // El código enviado por el usuario
      window: 1,           // Permitir un margen de tiempo (ejemplo: 1 ventana de 30 segundos antes/después)
    });
  
    if (!verified) {
      throw new RpcException({
        message:'Código de validación incorrecto o expirado.',
        status: HttpStatus.UNAUTHORIZED
      });
    }
  
  }
  

  async sendEmail(to: string, subject: string, content: string, isHtml: boolean = false) {
    try {
      const mailOptions = {
        from: envs.smtp_user, // Remitente
        to, // Receptor(es)
        subject, // Asunto del correo
        [isHtml ? 'html' : 'text']: content, // Usar 'html' si es HTML, 'text' si es texto plano
      };
  
      // Enviar el correo
      const info = await this.transporter.sendMail(mailOptions);
  
      return info;
    } catch (error) {
      throw new Error('No se pudo enviar el correo');
    }
  }
  
}
