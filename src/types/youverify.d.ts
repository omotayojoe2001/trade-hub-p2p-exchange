declare module "youverify-passive-liveness-web" {
  interface YouverifyTask {
    id: "passive";
  }

  interface YouverifyUser {
    firstName: string;
    lastName?: string;
    email?: string;
  }

  interface YouverifyBranding {
    color?: string;
    logo?: string;
  }

  interface YouverifyCallbackData {
    faceImage: string;
    livenessClip: string;
    passed: boolean;
    metadata?: any;
  }

  interface YouverifyOptions {
    tasks?: YouverifyTask[];
    publicKey: string;
    sandboxEnvironment?: boolean;
    presentation?: "modal" | "page";
    user?: YouverifyUser;
    branding?: YouverifyBranding;
    allowAudio?: boolean;
    onSuccess?: (data: YouverifyCallbackData) => void;
    onFailure?: (data: YouverifyCallbackData) => void;
    onClose?: () => void;
  }

  class YouverifyPassiveLiveness {
    constructor(options: YouverifyOptions);
    start(tasks?: YouverifyTask[]): void;
  }

  export default YouverifyPassiveLiveness;
}
