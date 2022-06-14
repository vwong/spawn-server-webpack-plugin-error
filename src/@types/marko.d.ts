declare module "*.marko" {
  interface Out {
    getOutput: () => string;
    on: (event: string, callback: () => void) => void;
    end: () => void;
  }

  const value: {
    createOut: () => Out;
    render: (params: Record<string, unknown>, out: Out) => void;
  };
  export = value;
}
