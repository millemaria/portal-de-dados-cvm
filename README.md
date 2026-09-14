# Portal de Dados CVM

Este é um projeto monorepo (utilizando [Turborepo](https://turbo.build/)) contendo uma aplicação frontend (Web) e uma API backend.

## Estrutura do Projeto

- `apps/web`: Aplicação frontend (provavelmente Next.js, rodando na porta 3000).
- `apps/api`: API backend (rodando na porta 3001).
- `packages/*`: Pacotes compartilhados entre as aplicações.

## Pré-requisitos

- Node.js (>= 20.0.0)
- npm (>= 11.17.0)
- Docker (opcional, para rodar via containers)

## Como executar o projeto localmente (Modo Desenvolvimento)

1. **Instale as dependências:**
   Na raiz do projeto, execute:
   ```bash
   npm install
   ```

2. **Inicie os servidores de desenvolvimento:**
   Na raiz do projeto, execute:
   ```bash
   npm run dev
   ```
   Isso iniciará tanto o frontend (Web) quanto a API simultaneamente.

   - **Web**: Acesse [http://localhost:3000](http://localhost:3000)
   - **API**: Acesse [http://localhost:3001](http://localhost:3001)

## Como executar o projeto utilizando Docker (Modo Produção)

Se preferir rodar o projeto em containers, você pode utilizar o Docker Compose. Na raiz do projeto, execute:

```bash
docker compose up -d --build
```

- A aplicação **Web** estará disponível em [http://localhost:3000](http://localhost:3000)
- A **API** estará disponível em [http://localhost:3001](http://localhost:3001)

Para parar os containers, execute:

```bash
docker compose down
```

## Outros Comandos Disponíveis

- `npm run build`: Faz o build de todas as aplicações e pacotes.
- `npm run lint`: Roda o linter no projeto.
- `npm run format`: Formata os arquivos utilizando o Prettier.
- `npm run typecheck`: Verifica os tipos TypeScript em todo o projeto.
- `npm run test`: Executa os testes.
- `npm run clean`: Limpa os diretórios de build (`node_modules`, `.next`, `dist`, etc).
