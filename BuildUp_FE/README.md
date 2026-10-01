# React + Vite

## 로컬 백엔드 연결

`npm run dev`와 `npm run preview`의 `/api` 요청은 기본적으로
`http://localhost:8080/BuildUp_BE/api`로 전달됩니다. 저장소의 Eclipse/Tomcat
설정에 있는 `/BuildUp_BE` 컨텍스트 경로와 일치해야 합니다.

백엔드를 다른 경로로 실행한다면 `.env.local`에 `API_PROXY_TARGET`을 지정하세요.
예를 들어 루트(`/`)에 배포한 서버는 `API_PROXY_TARGET=http://localhost:8080`을 사용합니다.
설정을 변경한 뒤 Vite를 다시 실행하세요.

운영 배포에서는 웹 서버의 `/api` 프록시도 실제 백엔드 컨텍스트 경로로 연결해야 합니다.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
