export interface User {
    id: string;
    lastName: string;
    firstName: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
}

export interface NewUser {
    id: string;
    lastName: string;
    firstName: string;
    email: string;
    passwordHash: string;
}
 
export interface RegisterUserRequest {
    lastName: string;
    firstName: string;
    email: string;
    password: string;
}
 
export interface LoginUserRequest {
    email: string;
    password: string;
}
   
export interface UpdateUserRequest {
    email?: string;
    password?: string;
}
 
export interface UserResponse {
    id: string; 
    lastName: string;
    firstName: string;
    email: string;
    createdAt: Date;
}

export interface UserLoginResponse {
    id: string;
    lastName: string;
    firstName: string;

    token: string;
}