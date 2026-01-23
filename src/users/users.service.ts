import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
    findAll() {
        return [{ id: 1, email: 'JohnDoe@gmail.com', role: 'USER' }, { id: 2, email: 'JaneSmith@gmail.com', role: 'ADMIN' }];
    }
}
