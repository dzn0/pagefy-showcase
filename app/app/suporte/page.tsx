"use client";

import Link from "next/link";
import { ArrowUpRight, LifeBuoy } from "lucide-react";
import { MessageComposer } from "../_components/message-composer";
import { PageHeader, Panel } from "../_components/ui";

// Suporte é pra quando algo não funcionou. A Central de ajuda vem antes, e é
// dito na cara: a maioria das dúvidas já está respondida lá, e ler é mais
// rápido do que esperar resposta.

const ASSUNTOS = [
  { id: "cobranca", label: "Cobrança ou plano" },
  { id: "creditos", label: "Créditos" },
  { id: "busca", label: "Busca de comércios" },
  { id: "gerador", label: "Gerador de site" },
  { id: "link", label: "Link publicado" },
  { id: "conta", label: "Conta e login" },
  { id: "outro", label: "Outro assunto" },
];

// O que, faltando, faz a resposta virar uma pergunta de volta e perder um dia.
const AJUDA_A_RESOLVER = [
  "O que você estava fazendo quando deu errado, e o que apareceu na tela.",
  "O nome do comércio ou a cidade da busca, quando for sobre lead ou site.",
  "Se já tentou de novo e se aconteceu mais de uma vez.",
];

export default function SuportePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={LifeBuoy}
        hue="neutral"
        title="Suporte"
        description="Algo não funcionou, cobrou errado ou travou no meio? Escreva pro suporte. Toda mensagem é lida e respondida — nada de robô."
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <Panel className="p-5 sm:p-6">
          <MessageComposer
            hue="azure"
            tipo="suporte"
            assuntos={ASSUNTOS}
            label="O que aconteceu?"
            placeholder="Ex.: gerei o site da Padaria do Seu Nilton, os créditos saíram do saldo e o site não apareceu na lista."
            enviarLabel="Enviar pro suporte"
            erroCurto="Escreva um pouco mais: com essa descrição não dá pra identificar o problema."
            sucesso={{
              titulo: "Mensagem enviada",
              texto: "A resposta vai pro e-mail da sua conta. Se for algo que trava seu trabalho agora, pode mandar de novo com mais detalhes — não atrapalha.",
            }}
          />
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5 sm:p-6">
            <h2 className="text-[1.02rem] font-semibold tracking-[-0.02em] text-ink">Talvez já esteja respondido</h2>
            <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted">
              A Central de ajuda cobre busca, créditos, planos, hospedagem do site publicado e o que acontece se a assinatura
              parar. É leitura de dois minutos, e não espera ninguém responder.
            </p>
            <Link
              href="/ajuda"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[0.86rem] font-semibold text-bg transition-[background-color,transform] duration-200 hover:bg-ink-2 active:scale-[0.97]"
            >
              Abrir a Central de ajuda
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <h2 className="text-[1.02rem] font-semibold tracking-[-0.02em] text-ink">O que faz a resposta vir rápido</h2>
            {/* Só as bolinhas: aqui não há sequência pra ligar, e a linha vertical
                virava um risco atrás dos marcadores. */}
            <ul className="mt-3 space-y-2.5">
              {AJUDA_A_RESOLVER.map((item) => (
                <li key={item} className="flex gap-2.5 text-[0.9rem] leading-relaxed text-ink-2">
                  <span className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-azure" aria-hidden="true" />
                  <span className="min-w-0 flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <p className="px-1 text-[0.84rem] leading-relaxed text-muted">
            Pedidos sobre os seus dados pessoais (cópia, correção ou exclusão) chegam no mesmo endereço e estão descritos na{" "}
            <Link
              href="/privacidade"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-green-ink underline decoration-green-ink/35 underline-offset-2 transition-colors hover:decoration-green-ink"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
