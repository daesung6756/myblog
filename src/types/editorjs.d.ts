// Declarations for Editor.js community tools that don't ship TypeScript types
// This prevents TS from complaining about implicit 'any' imports from node_modules

declare module '@editorjs/checklist';
declare module '@editorjs/header';
declare module '@editorjs/list';
declare module '@editorjs/code';
declare module '@editorjs/image';
declare module '@editorjs/quote';
declare module '@editorjs/delimiter';
declare module '@editorjs/table';
declare module '@editorjs/embed';
declare module '@editorjs/link';

// Allow importing of the ESM files directly if packages expose .mjs
declare module '@editorjs/*';
