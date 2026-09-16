"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, LifeBuoy, PlayCircle, Plus, Search, Send, Sparkles, Wallet, type LucideIcon } from "lucide-react";
import { formatBRL } from "@/lib/currency";
import type { Hue } from "@/lib/dashboard-nav";
import { EDIT_PRICE, SEARCH_PRICE, SITE_PRICE } from "@/lib/site-pricing";
import { leadsStore } from "@/lib/store/leads";
import { salesStore } from "@/lib/store/sales";
import { sitesStore } from "@/lib/store/sites";
import { Badge, CreditAmount, HUE, HueTile, PageHeader, Panel } from "../_components/ui";

// O caminho até a primeira venda, destrinchado. A Início mostra as quatro
// etapas em uma linha, pra saber onde se está; aqui cada etapa abre e ensina
// como fazer. O progresso é o mesmo e vem dos dados reais da conta — não há
// "marcar como lido": a etapa fica feita quando a pessoa fez, de verdade.

type Aula = {
  hue: Hue;
  icon: LucideIcon;
  titulo: string;
  objetivo: string;
  passos: string[];
  /** O que quase ninguém sabe na primeira vez e evita um erro caro. */
  dica: string;
  custo?: { label: string; value: number }[];
  cta: { label: string; href: string };
  /** Feito: o número real da conta, escrito como resultado. */
  feito: boolean;
  resultado: string;
};

export default function TutoriaisPage() {
  const leads = leadsStore.useAll();
  const sites = sitesStore.useAll();
  const sales = salesStore.useAll();

  const pitched = leads.filter((lead) => lead.stage !== "novo").length;
  const revenue = sales.reduce((sum, sale) => sum + sale.value, 0);

  const aulas: Aula[] = [
    {
      hue: "azure",
      icon: Search,
      titulo: "Encontrar quem precisa",
      objetivo: "Sair com uma lista de comércios da sua região que ainda não têm site, com telefone e endereço.",
      passos: [
        "Em Buscar leads, escreva a cidade ou o bairro. O custo aparece antes, e você confirma.",
        "A lista vem do Google: nome, telefone, endereço, nota, fotos e horário de quem não tem site cadastrado.",
        "Salve os que fizerem sentido. Cada um vira um cartão no seu quadro de Leads, na coluna Novo.",
      ],
      dica: "Comece pelo bairro onde você já circula. Vender pro comércio da esquina, onde você pode aparecer, é mais fácil do que pro outro lado da cidade.",
      custo: [{ label: "Uma busca", value: SEARCH_PRICE }],
      cta: { label: "Buscar comércios", href: "/app/buscar" },
      feito: leads.length > 0 || sites.length > 0,
      resultado: `${leads.length} ${leads.length === 1 ? "lead salvo" : "leads salvos"}`,
    },
    {
      hue: "grape",
      icon: Sparkles,
      titulo: "Montar o site dele",
      objetivo: "Ter a página do comércio pronta e no ar, num link que abre em qualquer celular.",
      passos: [
        "No comércio escolhido, clique em Gerar site. O gerador abre sem cobrar nada.",
        "Escreva o que você quer em português, do seu jeito. O primeiro pedido monta o site inteiro.",
        "Ajuste pedindo no chat: “deixa o verde mais escuro”, “põe o horário de domingo”. Ajuste é mudança pontual; refazer tudo é o botão Recriar site.",
        "Publicar e copiar o link não custa crédito.",
      ],
      dica: "Antes do primeiro site, o Pagefy confere sozinho se aquele comércio já tem site próprio fora do Google. Se achar, ele pergunta antes de cobrar qualquer coisa.",
      custo: [
        { label: "Montar o site", value: SITE_PRICE },
        { label: "Cada ajuste", value: EDIT_PRICE },
      ],
      cta: sites.length > 0 ? { label: "Ver meus sites", href: "/app/sites" } : { label: "Escolher um comércio", href: "/app/buscar" },
      feito: sites.length > 0,
      resultado: `${sites.length} ${sites.length === 1 ? "site gerado" : "sites gerados"}`,
    },
    {
      hue: "coral",
      icon: Send,
      titulo: "Mostrar pro dono",
      objetivo: "O dono do comércio abrir o link no celular dele e ver o próprio negócio na tela.",
      passos: [
        "Em Sites, use Enviar pro dono: o Pagefy escreve a mensagem de WhatsApp com o link dentro.",
        "Revise, mude o que quiser e abra a conversa já preenchida. Ligar funciona igual — o telefone veio do Google.",
        "Ao copiar a mensagem ou abrir o WhatsApp, o lead sai de Novo e vai pra Contatado sozinho.",
      ],
      dica: "Não comece por preço. Comece por “fiz a página do seu negócio, dá uma olhada” e mande o link. Quem vê a própria loja pronta pergunta o preço sozinho.",
      cta: { label: "Abrir o quadro de leads", href: "/app/leads" },
      feito: pitched > 0,
      resultado: `${pitched} ${pitched === 1 ? "abordagem" : "abordagens"}`,
    },
    {
      hue: "honey",
      icon: Wallet,
      titulo: "Combinar e receber",
      objetivo: "Fechar o valor, receber do dono e ver quanto a sua assinatura já se pagou.",
      passos: [
        "Combine direto com ele: o Pagefy não entra nesse pagamento e não cobra comissão nenhuma.",
        "Registre a venda em Financeiro, à vista ou mensal, pra acompanhar o retorno.",
        "Marque o site como Vendido em Sites, pra ele não se misturar com os que ainda estão em oferta.",
      ],
      dica: "Uma venda de R$ 400 paga mais de três meses do plano Pro. É essa conta que decide se o mês valeu, não o número de sites gerados.",
      cta: { label: "Registrar uma venda", href: "/app/financeiro" },
      feito: sales.length > 0,
      resultado: revenue > 0 ? `${formatBRL(revenue)} registrados` : "nenhuma venda ainda",
    },
  ];

  const feitas = aulas.filter((aula) => aula.feito).length;
  const atual = aulas.findIndex((aula) => !aula.feito);
  const completo = atual === -1;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={PlayCircle}
        hue="green"
        title="Tutoriais"
        description={
          completo
            ? "Você já percorreu o caminho inteiro. Isto aqui fica de consulta, pra quando quiser rever uma etapa."
            : "O caminho até a primeira venda, uma etapa por vez. As etapas se marcam sozinhas conforme você faz."
        }
        action={
          <div className="flex w-full items-center gap-4 sm:w-auto">
            <p className="shrink-0 text-[0.88rem] text-muted">
              <span className="font-display text-[1.2rem] font-semibold text-ink tabular">{feitas}</span> de {aulas.length} etapas
            </p>
            <div className="flex flex-1 gap-1.5 sm:w-40" aria-hidden="true">
              {aulas.map((aula) => (
                <span key={aula.titulo} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className={`block h-full rounded-full transition-[width] duration-700 ease-(--ease-out-expo) ${HUE[aula.hue].fill}`}
                    style={{ width: aula.feito ? "100%" : "0%" }}
                  />
                </span>
              ))}
            </div>
          </div>
        }
      />

      <ol className="space-y-3">
        {aulas.map((aula, i) => (
          <Aula key={aula.titulo} aula={aula} numero={i + 1} atual={i === atual} ultima={i === aulas.length - 1} />
        ))}
      </ol>

      <Panel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3.5">
          <HueTile icon={LifeBuoy} hue="neutral" />
          <div>
            <p className="text-[1.02rem] font-semibold text-ink">Travou em alguma etapa?</p>
            <p className="mt-0.5 max-w-[54ch] text-[0.88rem] leading-relaxed text-muted">
              A Central de ajuda responde as dúvidas mais comuns sobre busca, créditos e sites. Se a sua não estiver lá, o
              suporte responde no e-mail da sua conta.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/ajuda"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong px-4 text-[0.86rem] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-surface-2"
          >
            Central de ajuda
          </Link>
          <Link
            href="/app/suporte"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[0.86rem] font-semibold text-bg transition-[background-color,transform] duration-200 hover:bg-ink-2 active:scale-[0.97]"
          >
            Falar com o suporte
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Panel>
    </div>
  );
}

// Uma etapa: cabeçalho sempre visível (número, título, estado) e o conteúdo
// que abre. Começa aberta na etapa em que a pessoa está — é a única que ela
// precisa ler agora; as feitas ficam fechadas, com o resultado à mostra.
function Aula({ aula, numero, atual, ultima }: { aula: Aula; numero: number; atual: boolean; ultima: boolean }) {
  const [open, setOpen] = useState(atual);
  const id = `aula-${numero}`;
  const hue = HUE[aula.hue];

  return (
    <li className="relative">
      {/* Trilho que liga uma etapa na outra: cheio até onde a pessoa chegou.
          Ele passa por cima do card (elemento posicionado pinta acima do fundo)
          e é a única linha vertical da tela — os passos penduram as bolinhas
          nele. Daí os valores exatos: 1px da borda do card + 20 do p-5 + 20 de
          meio quadradinho = 41, menos meio pixel da linha. No sm o padding vira
          24. Mexeu no p-5/p-6 ou no size-10 do número? Refaz a conta. */}
      {/* Na última etapa o trilho também existe — senão as bolinhas dos passos
          dela ficariam soltas, sem a linha que carregam nas outras. Só muda
          onde termina: nas de cima ele atravessa o vão até o card seguinte; na
          última ele encosta na borda de baixo do card, que é onde o caminho
          acaba. Fechada, a última não mostra trilho: seria um toco de 1 cm sem
          nada pra ligar. */}
      {(!ultima || open) && (
        <span
          className={`absolute left-[40.5px] top-[61px] w-px sm:left-[44.5px] sm:top-[65px] ${
            ultima ? "bottom-0" : "bottom-[-0.75rem]"
          } ${aula.feito ? hue.fill : "bg-line"}`}
          aria-hidden="true"
        />
      )}
      <Panel className={atual && !open ? `overflow-hidden ${hue.soft}` : "overflow-hidden"}>
        <h2>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={id}
            className="flex w-full items-start gap-4 p-5 text-left transition-colors duration-200 hover:bg-surface-2/60 sm:p-6"
          >
            <span
              className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-[12px] font-display text-[0.95rem] font-semibold ${
                aula.feito || atual ? hue.solid : `${hue.soft} ${hue.ink}`
              }`}
            >
              {aula.feito ? <Check className="size-[18px]" strokeWidth={2.6} aria-hidden="true" /> : numero}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">{aula.titulo}</span>
                {aula.feito ? (
                  <Badge hue={aula.hue} dot>
                    {aula.resultado}
                  </Badge>
                ) : atual ? (
                  <span className={`text-[0.78rem] font-semibold ${hue.ink}`}>Você está aqui</span>
                ) : null}
              </span>
              <span className="mt-1 block max-w-[62ch] text-[0.88rem] leading-snug text-muted">{aula.objetivo}</span>
            </span>

            <Plus
              className={`mt-2.5 size-5 shrink-0 text-muted transition-transform duration-300 ease-(--ease-out-expo) ${open ? "rotate-45" : ""}`}
              aria-hidden="true"
            />
          </button>
        </h2>

        {open && (
          /* Tudo aqui dentro repete a coluna de 40px do cabeçalho (size-10 +
             gap-4), pra cada bolinha cair em cima do trilho e o texto alinhar
             com o título. Sem linha própria: a linha é o trilho. */
          <div id={id} className="rise-in border-t border-line px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
            <ol className="space-y-3.5">
              {aula.passos.map((passo) => (
                <li key={passo} className="flex gap-4">
                  <span className="flex w-10 shrink-0 justify-center pt-[0.55rem]" aria-hidden="true">
                    <span className={`size-1.5 rounded-full ${hue.fill}`} />
                  </span>
                  <span className="min-w-0 max-w-[68ch] flex-1 text-[0.94rem] leading-relaxed text-ink-2">{passo}</span>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex gap-4">
              <span className="w-10 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className={`max-w-[66ch] rounded-[16px] p-4 text-[0.9rem] leading-relaxed ${hue.soft} ${hue.ink}`}>
                  <strong className="font-semibold">Na prática:</strong> {aula.dica}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <Link
                    href={aula.cta.href}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-green px-5 text-[0.92rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97]"
                  >
                    {aula.cta.label}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                  {aula.custo?.map((linha) => (
                    <span key={linha.label} className="text-[0.84rem] text-muted">
                      {linha.label}: <CreditAmount value={linha.value} className="font-semibold text-ink-2" />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </li>
  );
}
