import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {UsersService} from "../users/users.service";
import {LoginResponseDto} from "./dto/login.dto";
import {JwtService} from "@nestjs/jwt";
import { RegisterRequestDto, RegisterResponseDto } from "./dto/register.dto";
import * as bcrypt from 'bcrypt';
import {TokenPayload} from "./tokenPayload.interface";

@Injectable()
export class AuthService {
    constructor(private userService: UsersService, private jwtService: JwtService) {}

    private async verifyPassowrd(pass: string, hashedPassword: string): Promise<void> {
        const isPasswordMatching = await bcrypt.compare(pass, hashedPassword);
        if(!isPasswordMatching) {
            throw new HttpException('Wrong credentials provided', HttpStatus.BAD_REQUEST);
        }
    }

    async login(email: string, pass: string): Promise<LoginResponseDto> {
        const user = await this.userService.findOne(email);
        await this.verifyPassowrd(pass, user.password);
        return {email: user.email, name: user.name};
    }

    public async register(registrationData: RegisterRequestDto): Promise<RegisterResponseDto> {
        const hashedPassword = await bcrypt.hash(registrationData.password, 10);
        try {
            const createdUser = await this.userService.create({
                ...registrationData,
                password: hashedPassword,
            })
            return {email: createdUser.email, id: createdUser.id, name: createdUser.name};
        } catch (e) {
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public getCookieWithJWTToken(email: string): string {
        const payload: TokenPayload = {email};
        const token = this.jwtService.sign(payload);
        return `Authentication=${token}; HttpOnly; Path=/; Max-Age=1d}`;
    }

    public getCookieForLogOut(): string {
        return `Authentication=; HttpOnly; Path=/; Max-Age=0}`;
    }
}
