// 仓库未提交 next-env.d.ts（.gitignore 排除），独立 `tsc --noEmit` 需要 CSS Module 声明。
// 形状与 next/types/global.d.ts 保持一致，避免 next build 生成 next-env.d.ts 后冲突。
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
