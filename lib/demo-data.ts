// Dados simulados para a demo da landing. Nada aqui vem de uma busca real:
// a contagem e os comércios são gerados a partir do nome da cidade digitada.

export type DemoCategory = {
  id: string;
  /** Nome do ramo no filtro de busca (agrupa vários tipos de comércio). */
  label: string;
  /** Nome curto pra selos e linhas quando o Google não diz o tipo exato. */
  short: string;
  segment: string;
  color: string;
  tagline: string;
  hours: string;
  services: string[];
};

export type DemoBusiness = {
  id: string;
  name: string;
  slug: string;
  category: DemoCategory;
  neighborhood: string;
  rating: number;
  reviews: number;
  phoneEnd: string;
  hasOldSite: boolean;
};

export type DemoResult = {
  city: string;
  total: number;
  businesses: DemoBusiness[];
};

export type DemoSegment = { id: string; label: string };

// Segmentos do filtro de ramo, na ordem em que aparecem. Mesmos ids do
// backend (backend/src/lib/categories.ts).
export const SEGMENTS: DemoSegment[] = [
  { id: "alimentacao", label: "Alimentação" },
  { id: "beleza", label: "Beleza e estética" },
  { id: "saude", label: "Saúde" },
  { id: "automotivo", label: "Automotivo" },
  { id: "corpo", label: "Corpo e movimento" },
  { id: "casa", label: "Casa e construção" },
  { id: "comercio", label: "Comércio" },
  { id: "servicos", label: "Serviços profissionais" },
  { id: "educacao", label: "Educação e eventos" },
  { id: "outros", label: "Outros serviços" },
];

export const CATEGORIES: Record<string, DemoCategory> = {
  restaurantes: { id: "restaurantes", label: "Restaurantes, padarias e lanchonetes", short: "Restaurante", segment: "alimentacao", color: "#9a5a1c", tagline: "Comida caseira feita na hora", hours: "Seg a sáb · 7h às 22h", services: ["Almoço", "Lanches", "Encomendas"] },
  bares: { id: "bares", label: "Bares e casas noturnas", short: "Bar", segment: "alimentacao", color: "#6d2e46", tagline: "Petisco, chope gelado e música", hours: "Qua a dom · 18h à 1h", services: ["Petiscos", "Drinks", "Música ao vivo"] },
  saloes: { id: "saloes", label: "Salões de beleza e manicure", short: "Salão de beleza", segment: "beleza", color: "#8a3563", tagline: "Cabelo, unhas e sobrancelha", hours: "Ter a sáb · 9h às 19h", services: ["Escova", "Coloração", "Manicure"] },
  barbearia: { id: "barbearia", label: "Barbearias", short: "Barbearia", segment: "beleza", color: "#1f3a5f", tagline: "Corte e barba sem hora marcada", hours: "Ter a sáb · 9h às 20h", services: ["Corte", "Barba", "Sobrancelha"] },
  estetica: { id: "estetica", label: "Clínicas de estética e massagem", short: "Estética", segment: "beleza", color: "#7a3f6e", tagline: "Cuidado com a pele e o corpo", hours: "Seg a sáb · 9h às 19h", services: ["Limpeza de pele", "Massagem", "Depilação"] },
  tatuagem: { id: "tatuagem", label: "Tatuagem e piercing", short: "Tatuagem", segment: "beleza", color: "#2e2a3a", tagline: "Arte na pele com segurança", hours: "Ter a sáb · 10h às 20h", services: ["Tatuagem", "Piercing", "Orçamento"] },
  clinicas: { id: "clinicas", label: "Clínicas e consultórios", short: "Clínica", segment: "saude", color: "#1d5c7a", tagline: "Atendimento com hora marcada", hours: "Seg a sex · 8h às 18h", services: ["Consultas", "Exames", "Retornos"] },
  pet: { id: "pet", label: "Pet shops e veterinárias", short: "Pet shop", segment: "saude", color: "#1f6e69", tagline: "Banho, tosa e ração", hours: "Seg a sáb · 8h às 19h", services: ["Banho e tosa", "Ração", "Veterinário"] },
  farmacias: { id: "farmacias", label: "Farmácias e óticas", short: "Farmácia", segment: "saude", color: "#2a6b3f", tagline: "Remédio e cuidado perto de casa", hours: "Seg a dom · 7h às 22h", services: ["Medicamentos", "Perfumaria", "Entrega"] },
  oficina: { id: "oficina", label: "Oficinas e serviços automotivos", short: "Oficina", segment: "automotivo", color: "#8c2f23", tagline: "Revisão, freio e suspensão", hours: "Seg a sex · 8h às 18h", services: ["Revisão", "Freios", "Suspensão"] },
  motos: { id: "motos", label: "Motos e bicicletas", short: "Motos e bikes", segment: "automotivo", color: "#6b3a1f", tagline: "Peças, manutenção e acessórios", hours: "Seg a sáb · 8h às 18h", services: ["Manutenção", "Peças", "Acessórios"] },
  academias: { id: "academias", label: "Academias e estúdios", short: "Academia", segment: "corpo", color: "#8a4b0f", tagline: "Treino com acompanhamento", hours: "Seg a sex · 6h às 22h", services: ["Musculação", "Aulas", "Avaliação física"] },
  material: { id: "material", label: "Material de construção e acabamento", short: "Material de construção", segment: "casa", color: "#5f4b2a", tagline: "Tudo pra obra, do cimento ao piso", hours: "Seg a sáb · 7h às 18h", services: ["Materiais", "Acabamento", "Entrega"] },
  reformas: { id: "reformas", label: "Reformas e serviços residenciais", short: "Reformas", segment: "casa", color: "#4a5a2a", tagline: "Reforma e conserto sem dor de cabeça", hours: "Seg a sáb · 8h às 18h", services: ["Elétrica", "Hidráulica", "Pintura"] },
  moveis: { id: "moveis", label: "Móveis e decoração", short: "Móveis", segment: "casa", color: "#6e4a2e", tagline: "Móveis e decoração pra sua casa", hours: "Seg a sáb · 9h às 18h", services: ["Móveis", "Decoração", "Planejados"] },
  roupas: { id: "roupas", label: "Roupas, calçados e acessórios", short: "Moda", segment: "comercio", color: "#7d2f55", tagline: "Moda pra todo dia e ocasião", hours: "Seg a sáb · 9h às 19h", services: ["Roupas", "Calçados", "Acessórios"] },
  mercados: { id: "mercados", label: "Mercados, açougues e hortifrútis", short: "Mercado", segment: "comercio", color: "#7d1f24", tagline: "Tudo fresquinho, perto de casa", hours: "Seg a dom · 7h às 21h", services: ["Hortifrúti", "Açougue", "Entrega"] },
  eletronicos: { id: "eletronicos", label: "Eletrônicos e assistência técnica", short: "Eletrônicos", segment: "comercio", color: "#2d3f6e", tagline: "Conserto e acessórios na hora", hours: "Seg a sáb · 9h às 18h", services: ["Assistência técnica", "Acessórios", "Películas"] },
  presentes: { id: "presentes", label: "Papelarias, presentes e floriculturas", short: "Presentes", segment: "comercio", color: "#3e6b2a", tagline: "Presentes e flores pra toda ocasião", hours: "Seg a sáb · 8h às 18h", services: ["Presentes", "Flores", "Papelaria"] },
  advocacia: { id: "advocacia", label: "Advocacia e contabilidade", short: "Escritório", segment: "servicos", color: "#2f3e52", tagline: "Orientação clara pro seu caso", hours: "Seg a sex · 9h às 18h", services: ["Consultoria", "Contratos", "Impostos"] },
  imobiliarias: { id: "imobiliarias", label: "Imobiliárias e corretores", short: "Imobiliária", segment: "servicos", color: "#3b4f63", tagline: "Imóveis pra comprar e alugar", hours: "Seg a sáb · 9h às 18h", services: ["Venda", "Aluguel", "Avaliação"] },
  seguros: { id: "seguros", label: "Seguros e finanças", short: "Seguros", segment: "servicos", color: "#23506b", tagline: "Proteção pro que importa", hours: "Seg a sex · 9h às 18h", services: ["Seguro auto", "Seguro de vida", "Consórcio"] },
  graficas: { id: "graficas", label: "Gráficas e agências", short: "Gráfica", segment: "servicos", color: "#5a2f6e", tagline: "Impressão e divulgação rápida", hours: "Seg a sex · 8h às 18h", services: ["Cartões", "Banners", "Adesivos"] },
  escolas: { id: "escolas", label: "Escolas e cursos", short: "Escola", segment: "educacao", color: "#2c5a8a", tagline: "Aprender com quem ensina de perto", hours: "Seg a sex · 7h às 21h", services: ["Cursos", "Aulas particulares", "Matrículas"] },
  festas: { id: "festas", label: "Festas, buffets e fotografia", short: "Festas", segment: "educacao", color: "#8a3a2a", tagline: "Sua festa do jeito que você sonhou", hours: "Ter a dom · 9h às 18h", services: ["Buffet", "Decoração", "Fotografia"] },
  lavanderias: { id: "lavanderias", label: "Lavanderias e costura", short: "Lavanderia", segment: "outros", color: "#2a5f6e", tagline: "Roupa limpa e ajustada", hours: "Seg a sáb · 8h às 18h", services: ["Lavagem", "Passadoria", "Ajustes"] },
  transporte: { id: "transporte", label: "Transporte e mudanças", short: "Transporte", segment: "outros", color: "#4a4f2a", tagline: "Mudança e frete com cuidado", hours: "Seg a sáb · 7h às 18h", services: ["Mudanças", "Fretes", "Montagem"] },
};

// Ramos antigos (antes dos segmentos) que ainda podem estar em buscas e
// caches guardados: viram o ramo novo, e o nome antigo segue como o tipo.
const LEGACY_RAMOS: Record<string, { id: string; kind: string }> = {
  padaria: { id: "restaurantes", kind: "Padaria" },
  marmitaria: { id: "restaurantes", kind: "Marmitaria" },
  salao: { id: "saloes", kind: "Salão de beleza" },
  floricultura: { id: "presentes", kind: "Floricultura" },
  acougue: { id: "mercados", kind: "Açougue" },
};

export function resolveCategory(id: string): { category: DemoCategory; legacyKind: string | null } {
  const legacy = LEGACY_RAMOS[id];
  if (legacy) return { category: CATEGORIES[legacy.id], legacyKind: legacy.kind };
  return { category: CATEGORIES[id] ?? CATEGORIES.restaurantes, legacyKind: null };
}

/** Filtro de ramo: "" (todos), id de um ramo ou um segmento inteiro ("seg:beleza"). */
export const SEGMENT_PREFIX = "seg:";

export function segmentOf(ramo: string): DemoSegment | undefined {
  return ramo.startsWith(SEGMENT_PREFIX) ? SEGMENTS.find((s) => s.id === ramo.slice(SEGMENT_PREFIX.length)) : undefined;
}

/** Normaliza um ramo guardado (inclusive os antigos); desconhecido vira "todos". */
export function normalizeRamo(ramo: string | null | undefined): string {
  if (!ramo) return "";
  if (segmentOf(ramo) || ramo in CATEGORIES) return ramo;
  return LEGACY_RAMOS[ramo]?.id ?? "";
}

export function ramoLabel(ramo: string): string {
  const segment = segmentOf(ramo);
  if (segment) return segment.label;
  return CATEGORIES[ramo]?.label ?? "todos os ramos";
}

/** O comércio entra no filtro? Ramo exato ou qualquer ramo do segmento. */
export function inRamo(category: DemoCategory, ramo: string): boolean {
  if (ramo === "") return true;
  const segment = segmentOf(ramo);
  return segment ? category.segment === segment.id : category.id === ramo;
}

const POOL: Array<[string, keyof typeof CATEGORIES]> = [
  ["Padaria Pão de Mel", "restaurantes"],
  ["Barbearia Navalha de Ouro", "barbearia"],
  ["Auto Mecânica Irmãos Souza", "oficina"],
  ["Studio Bella Cachos", "saloes"],
  ["Pet Shop Amigo Fiel", "pet"],
  ["Marmitaria Sabor de Casa", "restaurantes"],
  ["Floricultura Jardim da Praça", "presentes"],
  ["Açougue Boi Nobre", "mercados"],
  ["Padaria Trigo Dourado", "restaurantes"],
  ["Barbearia do Seu Zé", "barbearia"],
  ["Oficina do Carlão", "oficina"],
  ["Espaço Unha & Arte", "saloes"],
  ["Marmitaria Dona Cida", "restaurantes"],
  ["Pet Center Patinhas", "pet"],
];

export const CATEGORY_LIST: DemoCategory[] = Object.values(CATEGORIES);

const NEIGHBORHOODS =["Centro", "Jardim América", "Vila Nova", "São José", "Santa Cruz", "Bela Vista", "Santo Antônio", "Industrial"];

export const EXAMPLE_CITIES = ["Aracaju", "Belo Horizonte", "Botucatu", "Americana"];

/**
 * Sorteio do dado em Buscar leads: cidades médias de todas as regiões, com
 * comércio de rua suficiente pra busca achar negócios sem site. O estado vai
 * junto pra o Google não confundir homônimas.
 */
export const RANDOM_CITIES = [
  "Botucatu, SP", "Americana, SP", "Bauru, SP", "Presidente Prudente, SP", "Araraquara, SP", "Marília, SP",
  "Londrina, PR", "Maringá, PR", "Cascavel, PR", "Ponta Grossa, PR", "Guarapuava, PR",
  "Blumenau, SC", "Chapecó, SC", "Criciúma, SC", "Lages, SC",
  "Passo Fundo, RS", "Santa Maria, RS", "Pelotas, RS", "Caxias do Sul, RS",
  "Juiz de Fora, MG", "Uberlândia, MG", "Montes Claros, MG", "Governador Valadares, MG", "Divinópolis, MG",
  "Petrópolis, RJ", "Volta Redonda, RJ", "Campos dos Goytacazes, RJ",
  "Cachoeiro de Itapemirim, ES", "Linhares, ES",
  "Dourados, MS", "Três Lagoas, MS", "Rondonópolis, MT", "Sinop, MT",
  "Anápolis, GO", "Rio Verde, GO", "Palmas, TO",
  "Feira de Santana, BA", "Vitória da Conquista, BA", "Ilhéus, BA",
  "Aracaju, SE", "Arapiraca, AL", "Caruaru, PE", "Petrolina, PE", "Campina Grande, PB",
  "Mossoró, RN", "Juazeiro do Norte, CE", "Sobral, CE", "Parnaíba, PI", "Imperatriz, MA",
  "Santarém, PA", "Marabá, PA", "Macapá, AP", "Boa Vista, RR", "Porto Velho, RO", "Rio Branco, AC",
];

/** Uma cidade sorteada, diferente da atual. */
export function randomCity(current = "") {
  const options = RANDOM_CITIES.filter((city) => city !== current.trim());
  return options[Math.floor(Math.random() * options.length)]!;
}

export function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCity(raw: string) {
  const keepLower = new Set(["de", "da", "do", "das", "dos", "e"]);
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word, i) => (i > 0 && keepLower.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

export function buildDemoResult(rawCity: string, count = 6): DemoResult {
  const city = formatCity(rawCity);
  const seed = hash(slugify(city));
  const random = rng(seed);
  const total = 60 + Math.floor(random() * 420);

  // Fisher-Yates: `sort` com comparador aleatório muda entre engines e quebra a hidratação.
  const pool = [...POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const shuffled = pool.slice(0, count);
  const businesses = shuffled.map(([name, categoryId], i) => {
    const suffix = seed.toString(36).slice(0, 4);
    return {
      id: `${slugify(name)}-${i}`,
      name,
      slug: `${slugify(name)}-${suffix}`,
      category: CATEGORIES[categoryId],
      neighborhood: NEIGHBORHOODS[Math.floor(random() * NEIGHBORHOODS.length)],
      rating: Math.round((4.2 + random() * 0.8) * 10) / 10,
      reviews: 12 + Math.floor(random() * 240),
      phoneEnd: String(1000 + Math.floor(random() * 9000)),
      hasOldSite: random() < 0.2,
    };
  });

  return { city, total, businesses };
}
