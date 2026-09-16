# Pagefy

**Encontra comércios sem site e gera um site pronto pra vender a cada um, com dados reais do Google.**

🌐 No ar em **[pagefy.app](https://pagefy.app)**

---

## Sumário

- [O que é](#o-que-é)
- [Como funciona na prática](#como-funciona-na-prática)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Rotas](#rotas)
- [Decisões técnicas](#decisões-técnicas)
- [Design](#design)
- [Segurança e privacidade](#segurança-e-privacidade)
- [Rodando localmente](#rodando-localmente)
- [Sobre este repositório](#sobre-este-repositório)
- [Licença](#licença)

---

## O que é

O Pagefy é uma ferramenta pra quem quer ganhar dinheiro vendendo sites a comércios locais — inclusive quem nunca programou nem vendeu nada.

A dificuldade de vender site não é fazer o site: é achar quem precisa e convencer o dono. O Pagefy resolve as duas pontas:

1. **Encontra** os comércios de uma cidade, bairro ou ramo que não têm site cadastrado no Google.
2. **Monta** a página de cada um com o nome, endereço, telefone, horário e fotos que o próprio comércio publicou.
3. **Publica** num link público que abre em qualquer celular, pra mostrar ao dono.

Em vez de chegar com um orçamento, o vendedor chega com o site do comércio já pronto: *"olha, esse é o seu"*.

## Como funciona na prática

```
Buscar a cidade  →  Escolher o comércio  →  Gerar o site  →  Mandar o link pro dono  →  Registrar a venda
     (mapa)            (lista + CRM)        (chat com IA)       (WhatsApp pronto)          (financeiro)
```

Cada etapa tem uma cor própria na interface (azul pra encontrar, roxo pra montar, coral pra oferecer, mel pra receber), e o painel inicial mostra o caminho até a primeira venda com os números reais de cada etapa.

## Funcionalidades

### Landing

- **Demo ao vivo sem cadastro:** digita uma cidade e vê os comércios sem site dela, com dados reais.
- Seções de como funciona, recursos, preços com alternância mensal/semestral e perguntas frequentes.
- Tema claro e escuro, animações de entrada respeitando `prefers-reduced-motion`.
- Imagem de compartilhamento (Open Graph) gerada no próprio Next.

### Busca de comércios

- Busca por cidade e ramo, com **mapa** (Leaflet) e **lista** lado a lado.
- Filtros por "sem site", "site antigo", nota e quantidade de avaliações.
- O custo em créditos aparece **antes** de cada busca.
- Ao entrar, a cidade de quem acessa já vem pesquisada.

### CRM de leads

- Kanban com as etapas **Novo → Contatado → Proposta enviada → Fechado / Perdido**.
- O lead avança sozinho de "Novo" pra "Contatado" no clique que abre a conversa no WhatsApp.

### Gerador de sites

- **Chat com IA** que cria o site e aplica ajustes pontuais ("deixa o verde mais escuro", "põe o horário de domingo").
- Geração em **streaming**, com as etapas aparecendo na tela enquanto o site é montado.
- **Pré-visualização** em desktop e celular.
- Envio de imagens no chat pra usar no site.
- **Recriar site:** quando o pedido é refazer tudo, abre uma versão nova separada e mantém a original intacta.
- **Publicar** num link público e **Enviar pro dono**, que escreve a mensagem de WhatsApp com o link pra revisar e mandar.
- **Baixar site** em `.zip` com o HTML, as imagens enviadas e um LEIA-ME de como hospedar.

### Financeiro e planos

- Registro de vendas avulsas ou mensais, com o retorno sobre a assinatura.
- Planos mensais e semestrais e recargas avulsas de créditos.
- **Checkout dentro do app**, numa folha lateral (folha inferior no celular), com **Pix** (QR Code e copia-e-cola) e **cartão de crédito**. Nada redireciona pra outro site.

### Conta e suporte

- Login só com **Google**.
- Dados da conta (leads, sites, rascunhos, vendas) sincronizados com o servidor, disponíveis em qualquer dispositivo.
- Telas de **Suporte**, **Feedback** e **Tutoriais**.
- **Termos de uso**, **Política de Privacidade** e **Central de ajuda** escritos a partir do que o sistema faz de verdade.

### Área administrativa

- **Custos:** quanto cada chamada paga de API está custando, por ação e por dia.
- **Funil:** de quem chegou, quantos criaram conta, buscaram, geraram um site e pagaram, por semana de cadastro e por canal de origem.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) |
| UI | **React 19** + **TypeScript** |
| Estilo | **Tailwind CSS 4**, tokens de design em variáveis CSS |
| Mapas | **Leaflet** com blocos da CARTO |
| Ícones | **lucide-react** e **simple-icons** (marcas) |
| Tipografia | Sora, Manrope e Geist Mono via `next/font` |
| Autenticação | Google Identity Services (pop-up OAuth) |
| Hospedagem | **Vercel** |

Poucas dependências de propósito: não há biblioteca de estado, de componentes, de formulários nem de ZIP.

## Arquitetura

```
┌──────────────────────────┐        ┌──────────────────────────┐
│  pagefy.app  (Vercel)    │ fetch  │  API  (repositório       │
│  Este repositório        │───────▶│  privado)                │
│  Next.js · React · TS    │ cookie │  Express · Prisma        │
└──────────────────────────┘        └────────────┬─────────────┘
                                                 │
                         Postgres · Google Places · IA · Pagamentos
```

- Este repositório é o **frontend**. A API, o banco, os pagamentos e o gerador de sites ficam num repositório separado e privado.
- A sessão é um **cookie HttpOnly** emitido pela API no domínio `.pagefy.app`, então o site e a API são o mesmo site pro navegador e o cookie viaja nas requisições com `credentials: "include"`.
- **Nada que decide dinheiro ou acesso mora no navegador:** saldo, preço cobrado, downloads pagos e quem é admin são conferidos no servidor. A tela só mostra.

## Estrutura de pastas

```
app/
├── page.tsx                 Landing
├── _components/             Peças da landing e compartilhadas (navbar, rodapé, login, tema)
├── app/                     Área logada
│   ├── _components/         Shell, sidebar, checkout, mapa, UI base
│   │   └── editor/          Gerador de sites (chat, preview, publicar, enviar pro dono)
│   ├── buscar/              Busca de comércios
│   ├── leads/               CRM kanban
│   ├── sites/               Lista de sites e o gerador ([slug])
│   ├── financeiro/          Vendas
│   ├── plano/               Planos e recargas
│   └── config/              Configurações, custos e funil
├── p/[slug]/route.ts        Página pública de cada site publicado
├── ajuda/ termos/ privacidade/
└── opengraph-image.tsx      Imagem de compartilhamento

lib/
├── store/                   Estado das listas da conta (leads, sites, rascunhos, vendas, créditos)
├── api.ts                   Cliente da API com cookie
├── analytics.ts             Atribuição e eventos do funil
├── site-safety.ts           Limpeza do HTML gerado
├── site-stream.ts           Leitura da geração em streaming
├── site-export.ts / zip.ts  Download do site em .zip
├── plans.ts / site-pricing.ts
└── legal.ts                 Dados de identificação usados nos documentos
```

## Rotas

| Rota | O que é |
|---|---|
| `/` | Landing com demo ao vivo |
| `/app` | Início: caminho até a primeira venda |
| `/app/buscar` | Busca de comércios sem site |
| `/app/leads` | CRM kanban |
| `/app/sites` · `/app/sites/[slug]` | Sites e o gerador |
| `/app/financeiro` | Vendas registradas |
| `/app/plano` | Planos, recargas e checkout |
| `/app/config` | Configurações da conta |
| `/app/config/custos` · `/app/config/funil` | Área administrativa |
| `/app/suporte` · `/app/feedback` · `/app/tutoriais` | Ajuda dentro do app |
| `/p/[slug]` | Site publicado, aberto a qualquer pessoa |
| `/ajuda` · `/termos` · `/privacidade` | Páginas públicas |

## Decisões técnicas

**Página pública isolada.** O HTML de `/p/[slug]` foi escrito por uma IA e roda no domínio do produto, então é servido com uma **CSP `sandbox`**: origem isolada, nenhum script externo, nenhuma chamada de rede, nenhum formulário. Os scripts da página não alcançam os cookies nem o login do app. Além da CSP, o HTML passa por uma limpeza ao publicar e de novo ao servir.

**Estado sem biblioteca.** As listas da conta usam um store próprio com `useSyncExternalStore`. As gravações são **otimistas**: a tela muda na hora e uma fila por item envia pro servidor em ordem, com novas tentativas. Rascunhos do gerador são gravados com debounce, exceto quando uma geração começa, que é salva na hora pra poder ser retomada em outro dispositivo.

**ZIP escrito à mão.** O download do site monta o arquivo `.zip` no navegador, sem dependência. As fotos do Google não entram (os termos do Google Maps Platform não permitem redistribuir) e são trocadas por imagens numeradas pro dono substituir.

**Custo sempre antes da ação.** Toda ação paga passa por um diálogo que mostra o custo, o saldo atual e o que sobra depois. Sem saldo, não deixa confirmar e leva pra conseguir créditos.

**Funil sem pixel de terceiro.** A origem da primeira visita (UTM e site de origem) fica guardada e vai junto no cadastro. Os passos que não deixam rastro em nenhuma tabela (landing vista, checkout aberto, Pix gerado, cartão recusado) são enviados à própria API. Nada de Google Analytics, pixel de rede social ou gravação de sessão.

**Links com âncora funcionando de verdade.** Abrir `pagefy.app/#precos` direto caía no topo, porque o navegador tenta rolar antes de a página montar as seções. Um componente repete a rolagem por um instante, recorrigindo enquanto imagens e mapa mudam a altura, e para na hora se a pessoa mexer na rolagem.

**Poucas dependências.** Cada biblioteca a menos é uma atualização a menos, uma superfície de ataque a menos e um bundle menor. O que dá pra escrever bem em poucas linhas é escrito.

## Design

O sistema visual está documentado em **[`DESIGN.md`](./DESIGN.md)**: cores, tipografia, espaçamento, sombras, formas e cada componente com as regras por trás dele.

Em resumo:

- **Fundos neutros e superfícies brancas** separados por linhas de 1px, planos por padrão.
- **Um verde que significa "faça isto"**: o verde escuro é a ação no tema claro, e o lima assume no escuro.
- **Paleta da jornada:** cada etapa do caminho até a venda tem uma cor, e essa cor marca a etapa em qualquer lugar em que ela apareça.
- **Sora** pros títulos, **Manrope** pro texto corrido e **Geist Mono** só pra dados (URLs, custos, contagens).
- **Controles em formato de pílula** e contêineres com cantos arredondados numa escala fixa.
- **Tema claro e escuro** de primeira classe; o escuro é grafite, nunca preto puro.

## Segurança e privacidade

- Nenhuma chave, token ou segredo no código. Tudo que é sensível mora na API, fora deste repositório.
- Cabeçalhos de segurança no app (`X-Frame-Options`, `frame-ancestors`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- Dados de cartão não são guardados: vão direto pra processadora na mesma requisição.
- Sem rastreadores de terceiros em nenhuma página.
- A única variável pública relevante é o ID do cliente OAuth do Google, que é público por natureza.

## Rodando localmente

**Pré-requisitos:** Node.js 20.9 ou mais novo (exigência do Next.js 16).

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Abre em `http://localhost:3030`.

As variáveis estão explicadas no `.env.local.example`:

| Variável | Pra quê |
|---|---|
| `NEXT_PUBLIC_API_URL` | Endereço da API |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Login com Google |
| `NEXT_PUBLIC_CARTO_BASEMAPS_KEY` | Blocos do mapa (opcional; sem ela usa OpenStreetMap) |

> **Limitação:** a maior parte do app depende da API, que não está neste repositório. Sem ela, funcionam as páginas estáticas (landing, termos, privacidade, ajuda); a busca, o login e o gerador não.

Outros comandos:

```bash
npm run build   # build de produção
npm run lint    # ESLint
```

## Sobre este repositório

Esta é uma **cópia do frontend publicada como portfólio**. O desenvolvimento acontece num repositório privado, e este aqui é atualizado de tempos em tempos. Informações internas de negócio e dados pessoais foram retirados.

Pra ver funcionando, o melhor caminho é o próprio **[pagefy.app](https://pagefy.app)**.

## Licença

Copyright © 2026 André Pieri. **Todos os direitos reservados.**

Este código está publicado apenas como portfólio. Nenhuma permissão é concedida pra usar, copiar, modificar ou distribuir qualquer parte dele. Veja [`LICENSE`](./LICENSE).
