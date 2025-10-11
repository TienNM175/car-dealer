// src/global.d.ts
declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
