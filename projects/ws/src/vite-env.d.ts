/// <reference types="svelte" />
/// <reference types="vite/client" />
declare module '*.svelte' {
  import type { ComponentType } from 'svelte';
  const component: ComponentType<any>;
  export default component;
}