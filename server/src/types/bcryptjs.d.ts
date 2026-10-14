declare module 'bcryptjs' {
  interface BcryptjsStatic {
    hash(data: string, saltOrRounds: string | number): Promise<string>;
    hashSync(data: string, saltOrRounds: string | number): string;
    compare(data: string, encrypted: string): Promise<boolean>;
    compareSync(data: string, encrypted: string): boolean;
    genSalt(rounds?: number): Promise<string>;
    genSaltSync(rounds?: number): string;
    getRounds(encrypted: string): number;
  }

  const bcrypt: BcryptjsStatic;
  export = bcrypt;
}
