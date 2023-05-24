import {IsEmail, IsString, IsUUID} from "class-validator";

export class LoginResponseDto {
    name!: string;
    email: string;
}

export class LoginRequestDto {
    @IsEmail()
    email!: string;
    @IsString()
    password!: string;
}