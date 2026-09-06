export type RolUsuario =
    'ADMINISTRADOR' |
    'CLIENTE';


export interface Usuario {

    id_usuario: number;

    nombre_completo: string;

    correo: string;

    rol: RolUsuario;

    activo?: boolean;

    fecha_creacion?: string;

    ultimo_login?: string | null;
}


export interface LoginResponse {

    mensaje: string;

    usuario: Usuario;

    accessToken: string;
}


export interface RegistroResponse {

    mensaje: string;

    usuario: Usuario;
}


export interface RefreshResponse {

    accessToken: string;
}


export interface UsuariosResponse {

    usuarios: Usuario[];
}


export interface ActualizarRolResponse {

    mensaje: string;

    usuario: Usuario;
}