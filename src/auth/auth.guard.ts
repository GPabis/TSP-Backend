import {CanActivate, ExecutionContext, UnauthorizedException} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import {AuthGuard} from "@nestjs/passport";

export default class JwtAuthGuard extends AuthGuard('jwt') {}
