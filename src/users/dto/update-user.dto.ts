import {IsEmail, IsString, MinLength} from 'class-validator';
export class UpdateUserDto {
    email?: string;
    password?: string;
  }
  
