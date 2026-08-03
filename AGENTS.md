# Repository Agent Instructions

## Frontend

- Functions in `Moviqo.Front/src/**/*.{ts,tsx}` and frontend tests/build scripts should be declared as arrow function constants, for example `export const HomePage = () => { ... };` or `const normalizeValue = (value: string) => { ... };`.
- Avoid `function` declarations for new frontend implementation code unless TypeScript/framework constraints require them, such as overload signatures or intentionally hoisted declarations.
