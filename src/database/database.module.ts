import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {User} from "../users/entity/user.entity";

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get('db.host'),
                port: config.get('db.port'),
                username: config.get('db.user'),
                password: config.get('db.password'),
                database: config.get('db.name'),
                entities: [User],
                synchronize: true,
            }),
        })
    ],
})
export class DatabaseModule {};