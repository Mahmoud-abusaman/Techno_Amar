export type ImageKitUploadAuth = {
  publicKey: string;
  urlEndpoint: string;
  token: string;
  expire: number;
  signature: string;
};

export interface IImageKitAuthPort {
  getUploadAuth(): ImageKitUploadAuth;
}

export const IImageKitAuthPort = Symbol('IImageKitAuthPort');
