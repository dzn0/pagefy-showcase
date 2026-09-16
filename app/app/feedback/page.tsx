"use client";

import Link from "next/link";
import { MessageSquareHeart } from "lucide-react";
import { MessageComposer } from "../_components/message-composer";
import { PageHeader, Panel } from "../_components/ui";

// Feedback não é suporte: aqui não tem nada quebrado, tem opinião. O texto
// evita prometer prazo ou que a ideia vira funcionalidade — o Pagefy é feito
// por uma pessoa e prometer roadmap seria inventar.

const ASSUNTOS = [
  { id: "ideia", label: "Uma ideia" },
  { id: "faltou", label: "Faltou alguma coisa" },
  { id: "atrapalhou", label: "Algo atrapalhou" },
  { id: "venda", label: "Como foi vender" },
  { id: "elogio", label: "Deu certo" },
];

// O que rende mudança de verdade, em vez de virar uma anotação solta.
const O_QUE_AJUDA = [
  {
    titulo: "Conte a cena, não só o pedido",
    texto: "“Perdi a venda porque o dono abriu o link no celular e achou a letra pequena” vale mais do que “aumentem a fonte”.",
  },
  {
    titulo: "Diga onde doeu",
    texto: "A etapa em que você estava — buscar, montar, oferecer, receber — situa o problema mais rápido do que qualquer print.",
  },
  {
    titulo: "Se deu certo, conte também",
    texto: "Saber o que funcionou na sua venda evita que justamente a parte boa seja mexida depois.",
  },
];

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquareHeart}
        hue="neutral"
        title="Feedback"
        description="O que está faltando, o que atrapalhou, o que te fez fechar uma venda. Isto muda o produto de verdade — é o que orienta o que vem antes."
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <Panel className="p-5 sm:p-6">
          <MessageComposer
            hue="grape"
            tipo="feedback"
            assuntos={ASSUNTOS}
            label="O que você quer contar?"
            placeholder="Ex.: mandei o link pra três donos e todos perguntaram se dá pra pôr o cardápio. Hoje eu tenho que explicar que é só link."
            enviarLabel="Enviar meu feedback"
            erroCurto="Escreva um pouco mais: duas linhas já bastam."
            sucesso={{
              titulo: "Feedback enviado",
              texto: "Tudo é lido. Nem toda mensagem tem resposta, e não dá pra prometer prazo — mas é daqui que sai a próxima coisa a ser construída.",
            }}
          />
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5 sm:p-6">
            <h2 className="text-[1.02rem] font-semibold tracking-[-0.02em] text-ink">O que vira mudança</h2>
            <ul className="mt-4 space-y-4">
              {O_QUE_AJUDA.map((item) => (
                <li key={item.titulo}>
                  <p className="text-[0.92rem] font-semibold text-ink">{item.titulo}</p>
                  <p className="mt-1 text-[0.88rem] leading-relaxed text-muted">{item.texto}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <p className="px-1 text-[0.84rem] leading-relaxed text-muted">
            Não dá pra prometer que toda ideia vira funcionalidade, nem prazo pra nenhuma delas. Mas tudo é lido, e é o que
            define a fila. Se for algo quebrado ou cobrança errada, o caminho mais rápido é o{" "}
            <Link
              href="/app/suporte"
              className="font-medium text-green-ink underline decoration-green-ink/35 underline-offset-2 transition-colors hover:decoration-green-ink"
            >
              suporte
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
