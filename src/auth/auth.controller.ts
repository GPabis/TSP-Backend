import {Get, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards, Body} from '@nestjs/common';
import {AuthService} from "./auth.service";
import {LocalAuthGuard} from "./localAuth.guard";
import {RegisterRequestDto} from "./dto/register.dto";
import {RequestWithUser} from "./requestWithUser.interface";
import { Response } from "express";
import JwtAuthGuard from "./auth.guard";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post('login')
    login(@Req() request: RequestWithUser, @Res() response: Response) {
        const {user} = request;
        const cookie = this.authService.getCookieWithJWTToken(user.email);
        response.setHeader('Set-Cookie', cookie);
        return response.send(user)
    }

    @Post('register')
    register(@Body() registerDto: RegisterRequestDto) {
        return this.authService.register(registerDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logOut(@Req() request: RequestWithUser, @Res() response: Response) {
        response.setHeader('Set-Cookie', this.authService.getCookieForLogOut());
        return response.sendStatus(HttpStatus.OK);
    }

    @UseGuards(JwtAuthGuard)
    @Get('whoami')
    async checkUser(@Req() request: RequestWithUser) {
        const {user} = request;
        return {email: user.email, name: user.name};
    }
}
