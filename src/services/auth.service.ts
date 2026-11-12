import { UserRepository } from '../repositories/user.repository';
import { NewUser, User, UserLoginResponse } from '../types/user.types';
import { v4 as uuidv4 } from 'uuid';
import {RegisterUserRequest, LoginUserRequest, UserResponse} from '../types/user.types';
import bcrypt from 'bcrypt';

const userRepository = new UserRepository();

export class AuthService {

  async register(data : RegisterUserRequest): Promise<UserResponse> {

    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Dans le service, on crée un bel objet tout propre à partir des données reçues.
    // On génère un ID unique pour le user.
    const id = uuidv4();
    // Hash the password before storing it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    
    // quand on crée un user, qu'est-ce qui est requis ?
    const newUser: NewUser = {
      id: id,
      lastName: data.lastName.trim(),
      firstName: data.firstName.trim(),
      email: data.email.trim(),
      passwordHash: hashedPassword
    };

    // On appelle le repository pour créer le user dans la base de données.
    const createdUser = await userRepository.create(newUser);
    // On retourne un objet UserResponse pour ne pas exposer le passwordHash.
    return {
      id: createdUser.id,
      lastName: createdUser.lastName,
      firstName: createdUser.firstName,
      email: createdUser.email,
      createdAt: createdUser.createdAt
    };
  }

  async login(data: LoginUserRequest): Promise<UserLoginResponse> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    return {
      id: user.id,
      lastName: user.lastName,
      firstName: user.firstName,
      token: '' // Token generation will be handled in the controller
    };
  }

  
}