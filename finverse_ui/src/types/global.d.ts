interface Window {
  Buffer: typeof Buffer;
  process: NodeJS.Process;
  global: Window;
  util: any;
  events: any;
  stream: any;
  StringDecoder: any;
}

declare module 'process' {
  global {
    // This contains the type of global process
    namespace NodeJS {
      interface ProcessEnv {
        [key: string]: string | undefined;
        NODE_ENV: 'development' | 'production';
      }
      
      interface Process {
        env: ProcessEnv;
        version: string;
        // Add other process properties as needed
      }
    }
  }
  
  const process: NodeJS.Process;
  export default process;
}
