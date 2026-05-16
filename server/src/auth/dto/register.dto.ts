import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()                    // must be a valid email format
  email: string;

  @IsString()
  @MinLength(2)                 // display name must be at least 2 characters
  displayName: string;

  @IsString()
  @MinLength(8)                 // password must be at least 8 characters
  password: string;
}