declare module 'react-email' {
  import { ReactNode, CSSProperties } from 'react';

  export const Html: React.FC<{ children: ReactNode; [key: string]: any }>;
  export const Head: React.FC<{ children?: ReactNode; [key: string]: any }>;
  export const Preview: React.FC<{ children: ReactNode; [key: string]: any }>;
  export const Body: React.FC<{ children: ReactNode; style?: CSSProperties; [key: string]: any }>;
  export const Container: React.FC<{ children: ReactNode; style?: CSSProperties; [key: string]: any }>;
  export const Section: React.FC<{ children?: ReactNode; style?: CSSProperties; [key: string]: any }>;
  export const Img: React.FC<{ src: string; alt: string; width?: number | string; style?: CSSProperties; [key: string]: any }>;
  export const Text: React.FC<{ children: ReactNode; style?: CSSProperties; [key: string]: any }>;
  export const Button: React.FC<{ href: string; children: ReactNode; style?: CSSProperties; [key: string]: any }>;
  export const Link: React.FC<{ href: string; children: ReactNode; style?: CSSProperties; [key: string]: any }>;
}
