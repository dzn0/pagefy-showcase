// Preços do Pagefy: modelo híbrido de créditos.
// - Planos mensais: o crédito sai mais barato, pra quem usa bastante.
// - Recargas: valores fixos e simples, mas o crédito sai mais caro.
// Regra: a maior recarga sempre custa mais por crédito que o plano
// mais barato, pra assinatura compensar pra quem usa com frequência.
// Nada é ilimitado: toda ação custa crédito (ver CREDIT_COSTS).
// Marca "Feito com Pagefy" nos sites: só no plano Grátis.
//
// Vantagens em números concretos, como o cliente pensa: quantos sites e
// quantas buscas o plano rende. Tudo calculado dos preços reais das ações
// (lib/site-pricing.ts), então mudar um preço atualiza os cartões sozinho.
// "Site novo" é só a primeira versão, sem ajuste. Trechos entre
// **asteriscos** aparecem em destaque (FeatureText).
import { SEARCH_PRICE, SITE_PRICE } from "./site-pricing";

export type Plan = {
  /** Ids internos (não mudam com o nome comercial). */
  id: "gratis" | "inicio" | "escala" | "agencia";
  name: string;
  summary: string;
  /** Preço por mês, em R$. No semestral, o valor mensal já com desconto. */
  price: { monthly: number; semiannual: number };
  /** Créditos por mês (no Grátis, créditos de boas-vindas, uma vez). */
  credits: number;
  highlight?: boolean;
  cta: string;
  features: string[];
};

export const SEMIANNUAL_DISCOUNT = 17;

const n = (value: number) => value.toLocaleString("pt-BR");

/**
 * Número redondo pra baixo: "43 buscas" e "316 buscas" parecem conta de
 * calculadora e tiram a confiança do cartão. Sempre arredonda pra baixo, então
 * a promessa continua verdadeira.
 */
function roundDown(value: number) {
  if (value < 10) return value;
  const step = value < 100 ? 5 : value < 300 ? 10 : 50;
  return Math.floor(value / step) * step;
}

/**
 * O que uma franquia de créditos rende, em ações. O número vem redondo pra
 * baixo, e `more` diz que sobrou resto — quem lê vê "mais de 40 buscas", não "43".
 */
export function creditYield(credits: number) {
  const sites = Math.floor(credits / SITE_PRICE);
  const searches = Math.floor(credits / SEARCH_PRICE);
  return {
    newSites: roundDown(sites),
    newSitesMore: roundDown(sites) < sites,
    searches: roundDown(searches),
    searchesMore: roundDown(searches) < searches,
  };
}

/**
 * "8 sites novos" ou "Mais de 20 sites novos", conforme o arredondamento.
 * `capitalize` na primeira da linha, onde o "Mais" abre a frase.
 */
export function yieldLabel(value: number, more: boolean, one: string, many: string, capitalize = false) {
  const prefix = more ? (capitalize ? "Mais de " : "mais de ") : "";
  return `${prefix}${value} ${value === 1 ? one : many}`;
}

const BASE = { monthly: 59, credits: 1300 };

/** Quanto o crédito do plano sai mais barato que o do Essencial (mensal). */
function cheaperThanBase(monthly: number, credits: number) {
  return Math.round((1 - monthly / credits / (BASE.monthly / BASE.credits)) * 100);
}

function paidFeatures(credits: number, monthly: number, extras: string[]) {
  const y = creditYield(credits);
  const lines = [
    `**${n(credits)} créditos** por mês`,
    // Sem "Até": os números já são o piso (arredondados pra baixo, com "mais de").
    `**${yieldLabel(y.newSites, y.newSitesMore, "site novo", "sites novos", true)}** ou **${yieldLabel(y.searches, y.searchesMore, "busca", "buscas")}** de comércios`,
  ];
  if (credits > BASE.credits) {
    lines.push(`**${n(Math.floor((credits / BASE.credits) * 10) / 10)}×** os créditos do Essencial, com crédito **${cheaperThanBase(monthly, credits)}% mais barato**`);
  }
  return [...lines, ...extras];
}

export const PLANS: Plan[] = [
  {
    id: "gratis",
    name: "Grátis",
    summary: "Para achar seus primeiros clientes.",
    price: { monthly: 0, semiannual: 0 },
    credits: 120,
    cta: "Começar grátis",
    // O site custa 150 créditos: os 120 do Grátis são pra buscar, não pra gerar.
    features: [
      `**${Math.floor(120 / SEARCH_PRICE)} buscas** de comércios, fora a sua cidade, que já vem pesquisada`,
      "Comércios sem site com **telefone e endereço**",
      "CRM pra organizar os contatos",
      "Sem cartão de crédito",
    ],
  },
  {
    id: "inicio",
    name: "Essencial",
    summary: "Para quem está fazendo as primeiras vendas.",
    price: { monthly: 59, semiannual: 49 },
    credits: 1300,
    cta: "Assinar o Essencial",
    features: paidFeatures(1300, 59, [
      "Sites com as **fotos reais** e os dados do Google",
      "Link público pra **mandar ao dono**",
      "Ajustar o site **conversando com a IA**",
      "Site entregue **sem a marca Pagefy**",
      "CRM de leads e financeiro",
    ]),
  },
  {
    id: "escala",
    name: "Pro",
    summary: "Para vender toda semana, sem contar crédito.",
    price: { monthly: 119, semiannual: 99 },
    credits: 3200,
    highlight: true,
    cta: "Assinar o Pro",
    // "Seu nome e logo no rodapé (em breve)" saiu em 2026-09-16, junto com a
    // linha em Configurações: era promessa sem código, e ainda por cima numa
    // lista pela qual a pessoa paga. O mesmo critério que tirou o domínio
    // personalizado do Studio em 15/09. O Pro passa a se diferenciar por
    // volume; o que entra no lugar continua em aberto.
    features: paidFeatures(3200, 119, ["Tudo do Essencial"]),
  },
  {
    id: "agencia",
    name: "Studio",
    summary: "Para quem atende muitos clientes.",
    price: { monthly: 299, semiannual: 249 },
    credits: 9500,
    cta: "Assinar o Studio",
    // Domínio personalizado saiu daqui em 2026-09-15: era uma promessa sem
    // código por trás, e construir custa caro pelo que entrega (DNS de cliente
    // pra um usuário que não sabe codar, e o site do comércio caindo quando o
    // assinante para de pagar). Os Termos dizem agora, com todas as letras, que
    // o site mora em pagefy.app/p/<slug>. Falta decidir o que diferencia o
    // Studio além de volume — a candidata é lead exclusivo, já que o cache de
    // busca é compartilhado entre contas.
    features: paidFeatures(9500, 299, ["Volume pra atender **vários clientes por semana**", "Tudo do Pro"]),
  },
];

export const PLAN_BY_ID = Object.fromEntries(PLANS.map((plan) => [plan.id, plan])) as Record<Plan["id"], Plan>;

/** Recargas de créditos: compra única, sem assinatura. Valem por 12 meses. */
export type CreditPack = { credits: number; price: number };

// Recargas: o crédito sai mais caro que em qualquer plano, pra assinar
// compensar a quem usa todo mês, sem a recarga parecer castigo.
// Mesmos números em backend/src/lib/plans.ts, que é quem cobra.
export const CREDIT_PACKS: CreditPack[] = [
  { credits: 450, price: 29 },
  { credits: 1200, price: 69 },
  { credits: 3000, price: 159 },
];

export const PACK_VALIDITY_MONTHS = 12;

export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
