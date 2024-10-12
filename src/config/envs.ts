import 'dotenv/config'
import * as joi from 'joi'

interface EnvVars{
    PORT: number;
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_USER: string;
    SMTP_PASS: string;
    SECRET_KEY: string;
   
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
   
    
})


.unknown(true);

const {error, value} = envsSchema.validate(process.env);

if (error){
    throw new Error(`Config validation error: ${error.message}`);
}

const EnvVars: EnvVars = value;

export const envs = {
    port: EnvVars.PORT,
    smtp_host: EnvVars.SMTP_HOST,
    smtp_port: EnvVars.SMTP_PORT,
    smtp_user: EnvVars.SMTP_USER,
    smtp_pass: EnvVars.SMTP_PASS,
    secret_key:EnvVars.SECRET_KEY
  
   
};
