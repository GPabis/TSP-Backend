import {Injectable} from "@nestjs/common";
import {PassportStrategy} from "@nestjs/passport";
import {ExtractJwt, Strategy} from "passport-jwt";
import {ConfigService} from "@nestjs/config";
import {UsersService} from "../users/users.service";
import { Request } from "express";
import {TokenPayload} from "./tokenPayload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService, private readonly userService: UsersService) {
        super(
            {
                jwtFromRequest: ExtractJwt.fromExtractors(
                    [(request: Request) => {
                        return request?.cookies?.Authentication;
                    }]
                ),
                secretOrKey: configService.get('jwt'),
            }
        );
    }

    async validate(payload: TokenPayload) {
        return this.userService.findOne(payload.email)
    }
}