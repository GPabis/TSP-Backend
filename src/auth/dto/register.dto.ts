import {IsEmail} from "class-validator";

export class RegisterResponseDto {
    name!: string;
    email!: string;
    id!: string;
}

export class RegisterRequestDto {
    name!: string;
    @IsEmail()
    email!: string;
    password!: string;
}