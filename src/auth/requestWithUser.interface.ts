import {User} from "../users/entity/user.entity";

export interface RequestWithUser extends Request {
    user: User;
}