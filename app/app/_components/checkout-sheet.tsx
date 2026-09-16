"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { registrar, type Props } from "@/lib/analytics";
import { ArrowRight, Check, Copy, CreditCard, FlaskConical, LoaderCircle, Lock, QrCode, RotateCcw, ShieldCheck, X } from "lucide-react";
import { apiFetch, apiPost } from "@/lib/api";
import { BRAND_NAME, cardBrand, formatCardNumber, formatExpiry, formatPhone, formatPostalCode, onlyDigits, parseExpiry, validCardNumber } from "@/lib/card";
import { formatDocument, isValidDocument } from "@/lib/cpf-cnpj";
import { creditYield, formatPrice, PACK_VALIDITY_MONTHS, SEMIANNUAL_DISCOUNT, yieldLabel, type Plan } from "@/lib/plans";
import { CREDIT_COSTS, refreshCredits, setCredits, type Billing } from "@/lib/store/credits";

// Checkout inteiro dentro da Pagefy. A pessoa revisa o que está comprando,
// escolhe Pix ou cartão e paga sem sair da tela:
// - Pix: o QR Code e o copia-e-cola aparecem aqui, e a folha fica olhando o
//   pagamento até os créditos entrarem.
// - Cartão: digitado aqui e enviado ao backend, que repassa ao Asaas na mesma
//   hora. Nada do cartão é guardado (nem no navegador, nem no servidor): os
//   campos vivem só nesta folha e somem quando ela fecha.
// Preço e créditos são do servidor; daqui só sai o que foi escolhido.

export type CheckoutItem =
  | { kind: "plano"; plan: Plan; cycle: "mensal" | "semestral" }
  | { kind: "recarga"; credits: number; price: number };

type Method = "pix" | "cartao";
type Pix = { qrCode: string; payload: string; expiresAt: string };
type CardFields = { number: string; name: string; expiry: string; cvv: string; postalCode: string; addressNumber: string; phone: string };
type Phase =
  | { at: "revisar" }
  | { at: "pix"; paymentId: string; pix: Pix }
  /** Cartão enviado, mas o Asaas ainda está analisando (acontece em alguns cartões). */
  | { at: "analise"; paymentId: string }
  | { at: "pago"; before: number | null; after: number | null }
  | { at: "expirado" };

const POLL_MS = 3_000;
// Sem resposta nesse tempo, a tela avisa em vez de ficar girando pra sempre.
const REQUEST_TIMEOUT_MS = 45_000;

/** Como o item aparece no funil: o que a pessoa olhou, e por quanto. */
function itemProps(item: CheckoutItem): Props {
  return item.kind === "recarga"
    ? { recarga: item.credits, valor: item.price }
    : { plano: item.plan.id, ciclo: item.cycle, valor: itemTotal(item) };
}

function itemTotal(item: CheckoutItem) {
  if (item.kind === "recarga") return item.price;
  return item.cycle === "semestral" ? item.plan.price.semiannual * 6 : item.plan.price.monthly;
}

async function readError(res: Response, fallback: string) {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? fallback;
}

export function CheckoutSheet({
  item,
  billing,
  balance,
  onClose,
  onWaiting,
}: {
  item: CheckoutItem | null;
  billing: Billing | null;
  balance: number | null;
  onClose: () => void;
  /** Fechou a folha com um pagamento em aberto: a página segue conferindo. */
  onWaiting: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<() => void>(onClose);
  const open = item !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Abriu a folha com um plano ou recarga na frente. Junto com o que acontece
  // depois, é o que separa "ninguém chega no preço" de "o preço espanta" —
  // duas causas com soluções opostas que, sem isto, parecem a mesma coisa.
  useEffect(() => {
    if (item) registrar("checkout_aberto", itemProps(item));
  }, [item]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        // Esc fecha pelo mesmo caminho do X, pra lembrar do pagamento em aberto.
        event.preventDefault();
        closeRef.current();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeRef.current();
      }}
      aria-labelledby="checkout-titulo"
      className="pf-sheet border-0 bg-surface p-0 text-ink shadow-frame"
    >
      {/* Remonta a cada compra: estado limpo, sem resto da anterior. */}
      {item && (
        <Checkout
          key={item.kind === "plano" ? `plano-${item.plan.id}-${item.cycle}` : `recarga-${item.credits}`}
          item={item}
          billing={billing}
          balance={balance}
          closeRef={closeRef}
          onClose={onClose}
          onWaiting={onWaiting}
        />
      )}
    </dialog>
  );
}

function Checkout({
  item,
  billing,
  balance,
  closeRef,
  onClose,
  onWaiting,
}: {
  item: CheckoutItem;
  billing: Billing | null;
  balance: number | null;
  closeRef: React.RefObject<() => void>;
  onClose: () => void;
  onWaiting: () => void;
}) {
  const mode = billing?.mode ?? null;
  const [phase, setPhase] = useState<Phase>({ at: "revisar" });
  const [method, setMethod] = useState<Method>("pix");
  const [documentValue, setDocumentValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balanceAtStart] = useState(balance);
  const [card, setCard] = useState<CardFields>({ number: "", name: "", expiry: "", cvv: "", postalCode: "", addressNumber: "", phone: "" });
  const paysWithCard = mode === "asaas" && method === "cartao";
  // No Pix, o CPF/CNPJ só é pedido na primeira compra; no cartão, é do titular e vai sempre.
  const needsDocument = mode === "asaas" && (paysWithCard || !billing?.hasProfile);
  const expiry = parseExpiry(card.expiry);
  const brand = cardBrand(card.number);
  const cardErrors = {
    number: !validCardNumber(card.number) ? "Número de cartão inválido." : null,
    name: card.name.trim().length < 3 ? "Escreva o nome como está no cartão." : null,
    expiry: !expiry ? "Validade inválida ou vencida." : null,
    cvv: !/^\d{3,4}$/.test(card.cvv) || (brand === "amex" ? card.cvv.length !== 4 : card.cvv.length !== 3) ? "Código inválido." : null,
    postalCode: onlyDigits(card.postalCode).length !== 8 ? "CEP com 8 números." : null,
    addressNumber: !card.addressNumber.trim() ? "Informe o número." : null,
    phone: onlyDigits(card.phone).length < 10 ? "Celular com DDD." : null,
  };
  const cardOk = !paysWithCard || Object.values(cardErrors).every((value) => value === null);
  const documentOk = !needsDocument || isValidDocument(documentValue);
  const total = itemTotal(item);
  const updateCard = (patch: Partial<CardFields>) => setCard((current) => ({ ...current, ...patch }));

  // Fechar: com Pix em aberto, a página continua esperando por ele.
  useEffect(() => {
    closeRef.current = () => {
      if (busy) return;
      if (phase.at === "pix" || phase.at === "analise") onWaiting();
      // Fechou sem pagar. É o sinal mais direto que existe sobre o preço:
      // quem chegou até aqui já sabia quanto custava.
      if (phase.at === "revisar" || phase.at === "expirado") {
        registrar("checkout_abandonado", { ...itemProps(item), motivo: phase.at });
      }
      onClose();
    };
  }, [busy, phase.at, closeRef, onClose, onWaiting, item]);

  // Esperando: pergunta ao servidor se entrou (ele confere no Asaas).
  const waitingId = phase.at === "pix" || phase.at === "analise" ? phase.paymentId : null;
  useEffect(() => {
    if (!waitingId) return;
    let stopped = false;
    const check = async () => {
      try {
        const res = await apiFetch(`/pagamentos/${waitingId}`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as { state: string; balance: number };
        if (stopped) return;
        if (data.state === "pago") {
          setCredits(data.balance);
          void refreshCredits();
          setPhase({ at: "pago", before: balanceAtStart, after: data.balance });
        } else if (data.state === "expirado") {
          setPhase({ at: "expirado" });
        }
      } catch {
        // Sem rede por um instante: tenta de novo no próximo ciclo.
      }
    };
    const id = setInterval(() => void check(), POLL_MS);
    // Voltou pra aba (pagou no app do banco ou na aba do Asaas): confere na hora.
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      stopped = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [waitingId, balanceAtStart]);

  const body =
    item.kind === "plano" ? { kind: "plano" as const, plan: item.plan.id, cycle: item.cycle } : { kind: "recarga" as const, credits: item.credits };

  const formRef = useRef<HTMLDivElement>(null);
  // Tentou pagar com campo errado: depois que os avisos aparecem na tela, leva até o primeiro.
  const [jumpToError, setJumpToError] = useState(0);
  useEffect(() => {
    if (!jumpToError) return;
    const field = formRef.current?.querySelector<HTMLInputElement>("input[aria-invalid='true']");
    field?.scrollIntoView({ block: "center", behavior: "smooth" });
    field?.focus({ preventScroll: true });
  }, [jumpToError]);

  async function pay() {
    setTouched(true);
    if (busy) return;
    if (!documentOk || !cardOk) {
      setJumpToError((n) => n + 1);
      return;
    }
    setBusy(true);
    setError(null);

    if (mode === "teste") {
      try {
        const res = await apiPost("/credits/teste", body);
        if (!res.ok) throw new Error(await readError(res, "Não deu pra concluir a compra de teste."));
        const data = (await res.json()) as { credits?: number };
        setCredits(data.credits);
        await refreshCredits();
        setPhase({ at: "pago", before: balanceAtStart, after: data.credits ?? null });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não deu pra concluir a compra de teste.");
      } finally {
        setBusy(false);
      }
      return;
    }

    try {
      if (paysWithCard && expiry) {
        const res = await apiPost("/pagamentos/cartao", {
          order: body,
          card: { holderName: card.name.trim(), number: onlyDigits(card.number), expiryMonth: expiry.month, expiryYear: expiry.year, ccv: card.cvv },
          holder: { cpfCnpj: documentValue, postalCode: card.postalCode, addressNumber: card.addressNumber.trim(), phone: card.phone },
        }, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        if (!res.ok) {
          const motivo = await readError(res, "O pagamento não foi aprovado. Confira os dados ou tente outro cartão.");
          // Recusa alta é problema de meio de pagamento, não de preço: sem
          // separar os dois, baixar o plano não resolveria nada.
          registrar("checkout_cartao_recusado", { ...itemProps(item), motivo });
          throw new Error(motivo);
        }
        const result = (await res.json()) as { id: string; state: string; balance: number };
        // O cartão não fica em lugar nenhum depois daqui.
        setCard((current) => ({ ...current, number: "", cvv: "", expiry: "" }));
        if (result.state === "pago") {
          setCredits(result.balance);
          void refreshCredits();
          setPhase({ at: "pago", before: balanceAtStart, after: result.balance });
        } else {
          setPhase({ at: "analise", paymentId: result.id });
        }
        return;
      }

      const res = await apiPost("/pagamentos/checkout", { ...body, ...(needsDocument ? { document: documentValue } : {}) }, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!res.ok) throw new Error(await readError(res, "Não deu pra criar a cobrança agora. Tente de novo."));
      const created = (await res.json()) as { paymentId: string | null };
      if (!created.paymentId) throw new Error("A cobrança foi criada, mas não voltou completa. Tente de novo em instantes.");
      const pixRes = await apiFetch(`/pagamentos/${created.paymentId}/pix`, { cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!pixRes.ok) throw new Error("Não deu pra gerar o QR Code do Pix agora. Tente de novo em instantes ou pague com cartão.");
      setPhase({ at: "pix", paymentId: created.paymentId, pix: (await pixRes.json()) as Pix });
      // O QR Code está na tela. Daqui pra frente, quem não paga desistiu com
      // o preço na frente — não por não ter chegado até ele.
      registrar("checkout_pix_gerado", itemProps(item));
    } catch (err) {
      const timedOut = err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError");
      setError(
        timedOut
          ? "O servidor demorou demais pra responder. Nada foi cobrado; tente de novo em instantes."
          : err instanceof Error
            ? err.message
            : "Não deu pra concluir o pagamento agora.",
      );
    } finally {
      setBusy(false);
    }
  }

  const title =
    phase.at === "pago"
      ? "Pagamento confirmado"
      : phase.at === "pix"
        ? "Pague com Pix"
        : phase.at === "analise"
          ? "Pagamento em análise"
          : phase.at === "expirado"
            ? "Este Pix venceu"
            : "Finalizar compra";

  return (
    <div className="flex h-full max-h-[inherit] flex-col">
      <header className="flex items-center gap-3 border-b border-line px-6 py-4">
        <h2 id="checkout-titulo" className="flex-1 text-[1.05rem] font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => closeRef.current()}
          disabled={busy}
          aria-label="Fechar"
          className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>

      <div ref={formRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-5">
        {phase.at === "revisar" && (
          <div className="pf-step space-y-6">
            <OrderCard item={item} total={total} />

            {mode === "asaas" && (
              <div role="radiogroup" aria-labelledby="checkout-metodo">
                <p id="checkout-metodo" className="text-[0.86rem] font-semibold text-ink-2">
                  Como você quer pagar
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  <MethodOption active={method === "pix"} onSelect={() => setMethod("pix")} icon={QrCode} label="Pix" hint="QR Code ou copia e cola" />
                  <MethodOption
                    active={method === "cartao"}
                    onSelect={() => setMethod("cartao")}
                    icon={CreditCard}
                    label="Cartão de crédito"
                    hint={item.kind === "plano" ? "Renova sozinho no mesmo cartão" : "Aprovação na hora"}
                  />
                </div>
              </div>
            )}

            {paysWithCard && (
              <div className="pf-step space-y-3.5">
                <Field label="Número do cartão" error={touched ? cardErrors.number : null} aside={brand ? BRAND_NAME[brand] : null}>
                  {(props) => (
                    <input
                      {...props}
                      value={card.number}
                      onChange={(event) => updateCard({ number: formatCardNumber(event.target.value) })}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="0000 0000 0000 0000"
                      maxLength={23}
                    />
                  )}
                </Field>
                <Field label="Nome impresso no cartão" error={touched ? cardErrors.name : null}>
                  {(props) => (
                    <input
                      {...props}
                      value={card.name}
                      onChange={(event) => updateCard({ name: event.target.value.toUpperCase() })}
                      autoComplete="cc-name"
                      autoCapitalize="characters"
                      placeholder="COMO ESTÁ NO CARTÃO"
                      maxLength={80}
                    />
                  )}
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Validade" error={touched ? cardErrors.expiry : null}>
                    {(props) => (
                      <input
                        {...props}
                        value={card.expiry}
                        onChange={(event) => updateCard({ expiry: formatExpiry(event.target.value) })}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                    )}
                  </Field>
                  <Field label="Código de segurança" error={touched ? cardErrors.cvv : null}>
                    {(props) => (
                      <input
                        {...props}
                        value={card.cvv}
                        onChange={(event) => updateCard({ cvv: onlyDigits(event.target.value).slice(0, 4) })}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder={brand === "amex" ? "4 dígitos" : "3 dígitos"}
                        maxLength={4}
                      />
                    )}
                  </Field>
                </div>
              </div>
            )}

            {needsDocument && (
              <label className="block">
                <span className="text-[0.86rem] font-semibold text-ink-2">{paysWithCard ? "CPF ou CNPJ do titular do cartão" : "CPF ou CNPJ de quem paga"}</span>
                <input
                  value={documentValue}
                  onChange={(event) => setDocumentValue(formatDocument(event.target.value))}
                  onBlur={() => setTouched(true)}
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={18}
                  placeholder="000.000.000-00"
                  aria-invalid={touched && !documentOk}
                  aria-describedby="checkout-documento-ajuda"
                  className={`mt-1.5 h-12 w-full rounded-[14px] border bg-surface px-4 text-[1rem] text-ink tabular outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted focus:shadow-[0_0_0_4px_var(--lime-soft)] ${
                    touched && !documentOk ? "border-danger focus:border-danger" : "border-line-strong focus:border-green"
                  }`}
                />
                <span
                  id="checkout-documento-ajuda"
                  className={`mt-1.5 block text-[0.8rem] leading-snug ${touched && !documentOk ? "text-danger" : "text-muted"}`}
                >
                  {touched && !documentOk
                    ? documentValue
                      ? "Esse número não confere. Revise os dígitos."
                      : "Precisamos do CPF ou CNPJ pra emitir a cobrança."
                    : paysWithCard
                      ? "O banco confere com os dados do cartão. Fica com o Asaas."
                      : "Pedido só na primeira compra, pra emitir a cobrança e a nota. Fica com o Asaas."}
                </span>
              </label>
            )}

            {paysWithCard && (
              <div className="grid grid-cols-[1fr_6.5rem] gap-3">
                <Field label="CEP do titular" error={touched ? cardErrors.postalCode : null}>
                  {(props) => (
                    <input
                      {...props}
                      value={card.postalCode}
                      onChange={(event) => updateCard({ postalCode: formatPostalCode(event.target.value) })}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  )}
                </Field>
                <Field label="Número" error={touched ? cardErrors.addressNumber : null}>
                  {(props) => (
                    <input
                      {...props}
                      value={card.addressNumber}
                      onChange={(event) => updateCard({ addressNumber: event.target.value.slice(0, 10) })}
                      autoComplete="off"
                      placeholder="123"
                    />
                  )}
                </Field>
                <div className="col-span-2">
                  <Field label="Celular" error={touched ? cardErrors.phone : null}>
                    {(props) => (
                      <input
                        {...props}
                        value={card.phone}
                        onChange={(event) => updateCard({ phone: formatPhone(event.target.value) })}
                        inputMode="tel"
                        autoComplete="tel-national"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    )}
                  </Field>
                </div>
              </div>
            )}

            {mode === "teste" && (
              <p className="flex items-start gap-2.5 rounded-[14px] bg-azure-soft px-3.5 py-3 text-[0.86rem] leading-snug text-azure-ink">
                <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Modo de teste: nada é cobrado e os créditos entram na hora.
              </p>
            )}

            {mode === null && (
              <p className="rounded-[14px] bg-honey-soft px-3.5 py-3 text-[0.86rem] leading-snug text-honey-ink">
                Os pagamentos ainda não estão disponíveis neste ambiente.
              </p>
            )}
          </div>
        )}

        {phase.at === "pix" && (
          <PixStep
            pix={phase.pix}
            total={total}
            onUseCard={() => {
              setMethod("cartao");
              setTouched(false);
              setPhase({ at: "revisar" });
            }}
          />
        )}
        {phase.at === "analise" && <ReviewStep total={total} />}
        {phase.at === "pago" && <PaidStep item={item} before={phase.before} after={phase.after} />}
        {phase.at === "expirado" && (
          <p className="pf-step text-[0.95rem] leading-relaxed text-ink-2">
            O prazo deste Pix acabou e nada foi cobrado. Gere um código novo pra continuar, com o mesmo valor.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-[14px] bg-coral-soft px-3.5 py-3 text-[0.86rem] leading-snug text-coral-ink">
            {error}
          </p>
        )}
      </div>

      <footer className="border-t border-line px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        {phase.at === "revisar" && (
          <>
            <button
              type="button"
              onClick={() => void pay()}
              disabled={busy || mode === null}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green px-5 text-[0.98rem] font-semibold text-on-green transition-[background-color,transform,opacity] duration-200 hover:bg-green-hover active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
            >
              {busy ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  {mode === "teste" ? "Confirmando…" : paysWithCard ? "Processando o pagamento…" : "Gerando o Pix…"}
                </>
              ) : mode === "teste" ? (
                "Confirmar compra de teste"
              ) : paysWithCard ? (
                <>
                  <Lock className="size-4" aria-hidden="true" />
                  Pagar {formatPrice(total)}
                </>
              ) : (
                <>
                  Gerar Pix de {formatPrice(total)}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>
            {mode === "asaas" && (
              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[0.78rem] text-muted">
                <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
                {paysWithCard ? "Conexão criptografada. O cartão não fica salvo na Pagefy." : "Pagamento processado pelo Asaas."}
              </p>
            )}
            {/* Os documentos abrem em outra aba: sair daqui perderia o pedido
                (e, no cartão, o que já foi digitado). */}
            <p className="mt-2 text-center text-[0.76rem] leading-snug text-muted">
              Ao continuar, você concorda com os{" "}
              <Link
                href="/termos"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-green-ink underline decoration-green-ink/35 underline-offset-2 transition-colors hover:decoration-green-ink"
              >
                Termos de uso
              </Link>{" "}
              e a{" "}
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
          </>
        )}
        {(phase.at === "pix" || phase.at === "analise") && <WaitingStatus />}
        {phase.at === "pago" && (
          <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
            <Link
              href="/app/buscar"
              onClick={onClose}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-green px-5 text-[0.95rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.98]"
            >
              Buscar comércios
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 items-center justify-center rounded-full border border-line-strong px-5 text-[0.95rem] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-surface-2"
            >
              Fechar
            </button>
          </div>
        )}
        {phase.at === "expirado" && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setPhase({ at: "revisar" });
            }}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green px-5 text-[0.95rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.98]"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Gerar outro Pix
          </button>
        )}
      </footer>
    </div>
  );
}

// O pedido, no verde da marca: o que entra, quanto custa, como renova.
function OrderCard({ item, total }: { item: CheckoutItem; total: number }) {
  let name: string;
  let credits: number;
  let priceNote: string;
  let lines: string[];

  if (item.kind === "plano") {
    const planYield = creditYield(item.plan.credits);
    name = `Plano ${item.plan.name}`;
    credits = item.plan.credits;
    priceNote = item.cycle === "semestral" ? `a cada 6 meses (${formatPrice(item.plan.price.semiannual)}/mês)` : "por mês";
    lines = [
      `${yieldLabel(planYield.newSites, planYield.newSitesMore, "site novo", "sites novos", true)} ou ${yieldLabel(planYield.searches, planYield.searchesMore, "busca", "buscas")} por mês`,
      item.cycle === "semestral" ? `${SEMIANNUAL_DISCOUNT}% mais barato que o mensal; créditos renovam todo mês` : "Renova todo mês, no mesmo dia",
      "Cancele quando quiser: vale até o fim do período pago",
    ];
  } else {
    const sites = Math.floor(item.credits / CREDIT_COSTS.site);
    const searches = Math.floor(item.credits / CREDIT_COSTS.search);
    name = "Recarga de créditos";
    credits = item.credits;
    priceNote = "pagamento único";
    lines = [
      `Rende ${sites > 0 ? `${sites} ${sites === 1 ? "site" : "sites"} ou ` : ""}${searches} buscas`,
      `Soma ao seu saldo e vale por ${PACK_VALIDITY_MONTHS} meses`,
      "Sem mensalidade",
    ];
  }

  return (
    <section aria-label="Resumo do pedido" className="overflow-hidden rounded-[22px] bg-forest text-white shadow-frame">
      <div className="px-5 pb-5 pt-5">
        <p className="text-[0.86rem] font-medium text-white/75">{name}</p>
        <p className="mt-1.5 font-display text-[2.4rem] font-semibold leading-none tracking-[-0.04em] tabular">
          {credits.toLocaleString("pt-BR")}
          <span className="ml-2 text-[1rem] font-medium tracking-normal text-lime">créditos</span>
        </p>
        <ul className="mt-4 space-y-2">
          {lines.map((line) => (
            <li key={line} className="flex gap-2 text-[0.86rem] leading-snug text-white/90">
              <Check className="mt-0.5 size-3.5 shrink-0 text-lime" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-white/12 bg-black/15 px-5 py-3.5">
        <span className="text-[0.86rem] text-white/75">Total</span>
        <span className="text-right">
          <span className="font-display text-[1.35rem] font-semibold tracking-[-0.02em] tabular">{formatPrice(total)}</span>
          <span className="ml-1.5 text-[0.8rem] text-white/70">{priceNote}</span>
        </span>
      </div>
    </section>
  );
}

function MethodOption({
  active,
  onSelect,
  icon: Icon,
  label,
  hint,
}: {
  active: boolean;
  onSelect: () => void;
  icon: typeof QrCode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={`relative flex flex-col items-start rounded-[16px] border p-3.5 text-left transition-[border-color,background-color,box-shadow] duration-200 ${
        active ? "border-green bg-lime-soft/60 shadow-[0_0_0_3px_var(--lime-soft)]" : "border-line-strong bg-surface hover:border-ink/25"
      }`}
    >
      <Icon className={`size-5 ${active ? "text-green-ink" : "text-muted"}`} aria-hidden="true" />
      <span className="mt-2.5 text-[0.95rem] font-semibold text-ink">{label}</span>
      <span className="mt-0.5 pr-1 text-[0.78rem] leading-snug text-muted">{hint}</span>
      <span
        className={`absolute right-3 top-3 grid size-5 place-items-center rounded-full border transition-colors ${active ? "border-green bg-green text-on-green" : "border-line-strong"}`}
        aria-hidden="true"
      >
        {active && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}

/** Campo com rótulo, erro e um detalhe à direita (a bandeira do cartão). */
function Field({
  label,
  error,
  aside,
  children,
}: {
  label: string;
  error: string | null;
  aside?: string | null;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string; className: string; spellCheck: false }) => React.ReactNode;
}) {
  const id = `campo-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[0.86rem] font-semibold text-ink-2">
          {label}
        </label>
        {aside && <span className="text-[0.78rem] font-semibold text-green-ink">{aside}</span>}
      </div>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${id}-erro` : undefined,
        spellCheck: false,
        className: `mt-1.5 h-12 w-full rounded-[14px] border bg-surface px-4 text-[1rem] text-ink tabular outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted focus:shadow-[0_0_0_4px_var(--lime-soft)] ${
          error ? "border-danger focus:border-danger" : "border-line-strong focus:border-green"
        }`,
      })}
      {error && (
        <p id={`${id}-erro`} className="mt-1 text-[0.78rem] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function PixStep({ pix, total, onUseCard }: { pix: Pix; total: number; onUseCard: () => void }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(pix.payload);
    } catch {
      // Sem permissão pra área de transferência: seleciona pra copiar na mão.
      codeRef.current?.focus();
      codeRef.current?.select();
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="pf-step">
      <p className="font-display text-[2rem] font-semibold leading-none tracking-[-0.035em] tabular">{formatPrice(total)}</p>
      

      {/* No celular, copiar vem primeiro: ninguém lê o QR Code com o próprio telefone. */}
      <div className="mt-5 flex flex-col gap-5 max-sm:flex-col-reverse">
        <figure className="mx-auto w-full max-w-[15rem] rounded-[22px] bg-white p-3 shadow-card ring-1 ring-black/5 max-sm:max-w-[11rem]">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR Code em data: URL, vem pronto do Asaas */}
          <img src={pix.qrCode} alt="QR Code do Pix" width={240} height={240} className="aspect-square w-full [image-rendering:pixelated]" />
        </figure>

        <div>
          <button
            type="button"
            onClick={() => void copy()}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[0.95rem] font-semibold transition-[background-color,color,transform] duration-200 active:scale-[0.98] ${
              copied ? "bg-lime-soft text-green-ink" : "bg-ink text-bg hover:bg-ink-2"
            }`}
          >
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? "Código copiado" : "Copiar código Pix"}
          </button>
          <label className="sr-only" htmlFor="pix-copia-e-cola">
            Código Pix copia e cola
          </label>
          <textarea
            id="pix-copia-e-cola"
            ref={codeRef}
            readOnly
            value={pix.payload}
            rows={2}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2.5 block w-full resize-none break-all rounded-[14px] border border-line bg-surface-2 px-3.5 py-2.5 font-mono text-[0.72rem] leading-relaxed text-muted outline-none focus:border-line-strong"
          />
        </div>
      </div>

      <ol className="mt-6 space-y-3 border-t border-line pt-5">
        {["Abra o app do seu banco e vá em Pix.", "Leia o QR Code ou cole o código copiado.", "Confirme: os créditos entram aqui em segundos."].map((step, i) => (
          <li key={step} className="flex gap-3 text-[0.88rem] leading-snug text-ink-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-[0.76rem] font-semibold text-ink tabular">{i + 1}</span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-5 text-[0.84rem] text-muted">
        Prefere cartão?{" "}
        <button
          type="button"
          onClick={onUseCard}
          className="font-semibold text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
        >
          Pagar com cartão de crédito
        </button>
      </p>
    </div>
  );
}

function ReviewStep({ total }: { total: number }) {
  return (
    <div className="pf-step">
      <p className="font-display text-[2rem] font-semibold leading-none tracking-[-0.035em] tabular">{formatPrice(total)}</p>
      <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-2">
        O cartão foi enviado e o banco está confirmando o pagamento. Costuma levar poucos segundos; esta tela avança sozinha.
      </p>
      <p className="mt-4 text-[0.84rem] leading-snug text-muted">
        Pode fechar: os créditos entram assim que for aprovado. Se o banco recusar, nada é cobrado.
      </p>
    </div>
  );
}

function WaitingStatus() {
  return (
    <p role="status" className="flex items-center justify-center gap-2.5 py-3 text-[0.9rem] font-medium text-ink-2">
      <span className="pf-waiting-dot size-2.5 rounded-full bg-green" aria-hidden="true" />
      Esperando o pagamento…
    </p>
  );
}

/** Número que sobe até `to` uma vez, ao aparecer. */
function useCountUp(to: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = reduced ? 1 : Math.min(1, (now - start) / duration);
      setValue(Math.round(to * (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);
  return value;
}

function PaidStep({ item, before, after }: { item: CheckoutItem; before: number | null; after: number | null }) {
  const gained = before !== null && after !== null ? Math.max(0, after - before) : 0;
  const shown = useCountUp(gained);

  return (
    <div className="pf-step flex flex-col items-center pt-6 text-center">
      <span className="pf-paid-ring grid size-20 place-items-center rounded-full bg-lime text-on-lime">
        <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path className="pf-paid-check" d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>

      {gained > 0 && (
        <p className="mt-6 font-display text-[3rem] font-semibold leading-none tracking-[-0.04em] text-green-ink tabular">
          <span aria-hidden="true">+{shown.toLocaleString("pt-BR")}</span>
          <span className="sr-only">{gained.toLocaleString("pt-BR")} créditos adicionados</span>
        </p>
      )}
      <p className={`${gained > 0 ? "mt-2" : "mt-6"} text-[1.1rem] font-semibold text-ink`}>
        {item.kind === "plano" ? `Plano ${item.plan.name} ativo` : "Créditos na sua conta"}
      </p>
      <p className="mt-1.5 max-w-[22rem] text-[0.9rem] leading-relaxed text-muted">
        {item.kind === "plano"
          ? "Os créditos do plano somam ao que você já tinha. Todo mês entram mais, e o que sobrar continua com você."
          : `Eles valem por ${PACK_VALIDITY_MONTHS} meses e somam ao que você já tinha.`}
      </p>
      {after !== null && (
        <p className="mt-6 rounded-full bg-surface-2 px-4 py-2 text-[0.88rem] text-ink-2">
          Saldo agora: <span className="font-semibold text-ink tabular">{after.toLocaleString("pt-BR")} créditos</span>
        </p>
      )}
    </div>
  );
}
