"use client";

import { useState, type FormEvent } from "react";
import { Check, Copy, LoaderCircle, Send } from "lucide-react";
import { apiPost } from "@/lib/api";
import type { Hue } from "@/lib/dashboard-nav";
import { OPERADOR } from "@/lib/legal";
import { HUE } from "./ui";

// Suporte e Feedback saem daqui direto, pelo backend (POST /mensagens), que
// manda o e-mail. A conta de quem escreveu vem da sessão, no servidor, e não
// deste formulário.
//
// Se o envio falhar, a tela diz que falhou e oferece copiar a mensagem — nunca
// um "enviado!" sobre algo que não saiu.

export type Assunto = { id: string; label: string };

type Estado = "escrevendo" | "enviando" | "enviado";

export function MessageComposer({
  hue,
  tipo,
  assuntos,
  label,
  placeholder,
  enviarLabel,
  /** O texto curto demais não é o mesmo erro nas duas telas: uma tem um problema, a outra não. */
  erroCurto,
  /** O que aparece no lugar do formulário depois que a mensagem sai. */
  sucesso,
}: {
  hue: Hue;
  tipo: "suporte" | "feedback";
  assuntos: Assunto[];
  label: string;
  placeholder: string;
  enviarLabel: string;
  erroCurto: string;
  sucesso: { titulo: string; texto: string };
}) {
  const [assunto, setAssunto] = useState(assuntos[0]!.id);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("escrevendo");
  const [copiado, setCopiado] = useState(false);

  const escolhido = assuntos.find((item) => item.id === assunto) ?? assuntos[0]!;
  const tone = HUE[hue];
  const enviando = estado === "enviando";

  function validar() {
    if (texto.trim().length < 10) {
      setErro(erroCurto);
      return false;
    }
    setErro(null);
    return true;
  }

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (enviando || !validar()) return;
    setEstado("enviando");
    try {
      const res = await apiPost("/mensagens", { tipo, assunto: escolhido.label, texto: texto.trim() });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setErro(data?.error ?? "Não deu pra enviar agora. Copie a mensagem e mande por e-mail.");
        setEstado("escrevendo");
        return;
      }
      setEstado("enviado");
    } catch {
      setErro("Não deu pra falar com o servidor do Pagefy. Confira a internet e tente de novo.");
      setEstado("escrevendo");
    }
  }

  async function copiarMensagem() {
    await navigator.clipboard?.writeText(`[${escolhido.label}]\n\n${texto.trim()}\n\n(mandar para ${OPERADOR.email})`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (estado === "enviado") {
    return (
      <div className="flex flex-col items-start gap-3 py-2">
        <span className={`grid size-11 place-items-center rounded-[14px] ${tone.solid}`} aria-hidden="true">
          <Check className="size-5" strokeWidth={2.6} />
        </span>
        <p role="status" className="font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">
          {sucesso.titulo}
        </p>
        <p className="max-w-[52ch] text-[0.92rem] leading-relaxed text-muted">{sucesso.texto}</p>
        <button
          type="button"
          onClick={() => {
            setTexto("");
            setEstado("escrevendo");
          }}
          className="mt-1 inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[0.88rem] font-semibold text-ink transition-colors duration-200 hover:border-ink/30 hover:bg-surface-2"
        >
          Escrever outra
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <fieldset disabled={enviando} className="disabled:opacity-60">
        <legend className="text-[0.92rem] font-semibold text-ink">Sobre o quê?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {assuntos.map((item) => {
            const on = item.id === assunto;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAssunto(item.id)}
                aria-pressed={on}
                className={`h-10 rounded-full border px-4 text-[0.88rem] font-medium transition-colors duration-200 ${
                  on ? `${tone.solid} border-transparent font-semibold` : "border-line-strong text-ink-2 hover:border-ink/30 hover:bg-surface-2"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="mensagem" className="text-[0.92rem] font-semibold text-ink">
          {label}
        </label>
        <textarea
          id="mensagem"
          value={texto}
          disabled={enviando}
          onChange={(event) => {
            setTexto(event.target.value);
            if (erro) setErro(null);
          }}
          rows={7}
          placeholder={placeholder}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? "mensagem-erro" : undefined}
          className={`mt-3 block w-full resize-y rounded-[18px] border bg-bg px-4 py-3.5 text-[0.96rem] leading-relaxed text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted focus:border-green focus:shadow-[0_0_0_4px_var(--lime-soft)] disabled:opacity-60 ${
            erro ? "border-danger" : "border-line-strong"
          }`}
        />
        {erro && (
          <p id="mensagem-erro" role="alert" className="mt-2 pl-1 text-[0.86rem] font-medium text-danger">
            {erro}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green px-6 text-[0.96rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {enviando ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          {enviando ? "Enviando…" : enviarLabel}
        </button>
        {/* Só aparece quando o envio falhou: até lá, copiar não serve pra nada. */}
        {erro && (
          <button
            type="button"
            onClick={() => void copiarMensagem()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line-strong px-5 text-[0.92rem] font-semibold text-ink transition-colors duration-200 hover:border-ink/30 hover:bg-surface-2"
          >
            {copiado ? <Check className="size-4 text-green-ink" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copiado ? "Mensagem copiada" : "Copiar mensagem"}
          </button>
        )}
      </div>

      <p className="text-[0.86rem] leading-relaxed text-muted">
        A mensagem chega em <span className="font-mono text-[0.84rem] text-ink-2">{OPERADOR.email}</span>, e a resposta volta pro
        e-mail da sua conta.
      </p>
    </form>
  );
}
