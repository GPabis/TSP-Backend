import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entity/user.entity";
import {CreateUserDto} from "./dto/createUser.dto";

@Injectable()
export class UsersService {
    public constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

    public async findOne(email: string): Promise<User | undefined> {
        return await this.userRepository.findOne({where: {email: email}});
    }

    public async create(user: CreateUserDto): Promise<User> {
        const newUser = await this.userRepository.create(user);
        await this.userRepository.save(newUser);
        return newUser;
    }
}
