import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Footer } from "../_components/footer";
import { LegalIndex } from "../_components/legal-index";
import { Navbar } from "../_components/navbar";
import { OPERADOR, SITE } from "@/lib/legal";
import { EDIT_PRICE, EXPORT_PRICE, SEARCH_PRICE, SITE_PRICE, WELCOME_CREDITS } from "@/lib/site-pricing";

export const metadata: Metadata = {
  title: "Central de ajuda | Pagefy",
  description:
    "Respostas sobre a busca de comércios, os sites gerados, hospedagem, domínio próprio, créditos, planos e o que acontece se a assinatura parar.",
  alternates: { canonical: "/ajuda" },
};

type Pergunta = { q: string; a: string };
type Categoria = { id: string; titulo: string; resumo: string; perguntas: Pergunta[] };

// Toda resposta aqui sai do que o código faz hoje. Se uma delas depender de
// algo que ainda não existe, ela não entra — é o mesmo critério dos Termos.
const CATEGORIAS: Categoria[] = [
  {
    id: "como-funciona",
    titulo: "Como funciona",
    resumo: "O que a ferramenta faz, o que você precisa saber e quanto tempo leva.",
    perguntas: [
      {
        q: "O que o Pagefy faz, em uma frase?",
        a: "Encontra os comércios da sua cidade que ainda não têm site, monta a página de cada um com os dados reais do negócio e te dá um link público pra mostrar ao dono.",
      },
      {
        q: "Preciso saber programar?",
        a: "Não, e nem desenhar. A página sai pronta com nome, endereço, telefone, horário e fotos que o próprio comércio publicou no Google. O que você quiser mudar, muda pedindo no chat, em português: “deixa o verde mais escuro”, “põe o horário de domingo”.",
      },
      {
        q: "Quanto tempo leva até eu ter um site pra mostrar?",
        a: "Minutos, não dias. Você confirma o pedido, acompanha as etapas na tela e o site aparece pronto na própria conversa, na mesma sessão. Publicar e copiar o link é um clique depois disso.",
      },
      {
        q: "Preciso ter CNPJ ou empresa aberta?",
        a: "Não pra usar o Pagefy. Pra emitir nota fiscal ao seu cliente, aí vale a regra do seu caso — isso é entre você e ele, e o Pagefy não participa dessa venda.",
      },
      {
        q: "O Pagefy fala com o dono do comércio por mim?",
        a: "Não. Nada é enviado automaticamente. O link só chega até onde você levar. O que existe é o “Enviar pro dono”, que escreve uma mensagem de WhatsApp com o link dentro pra você revisar, copiar ou abrir a conversa já preenchida.",
      },
    ],
  },
  {
    id: "busca",
    titulo: "Busca de comércios",
    resumo: "De onde vêm os comércios, quantos aparecem e quando a busca custa crédito.",
    perguntas: [
      {
        q: "De onde vêm os dados dos comércios?",
        a: "Do Google Places. É o que o próprio estabelecimento publicou no Google: nome, endereço, telefone, nota, fotos e horário de funcionamento.",
      },
      {
        q: "Esses comércios estão mesmo sem site?",
        a: "“Sem site” quer dizer que não há site cadastrado no perfil do Google. Um site que existe e nunca foi cadastrado lá não aparece pra gente, e um site cadastrado e já fora do ar continua contando como se existisse. Por isso, antes do primeiro site, o Pagefy faz uma conferência automática na internet e te avisa se achar um site do comércio — aí você decide se cria mesmo assim, sem gastar crédito na decisão.",
      },
      {
        q: "Quantos comércios vêm em cada busca?",
        a: "Depende da cidade e do ramo. Uma busca analisa até cerca de 60 estabelecimentos por vez e devolve os que não têm site, tirando os fechados e os que estão longe demais do centro do resultado. Em cidade média, costuma dar algumas dezenas de leads.",
      },
      {
        q: "Refazer uma busca que eu já fiz cobra de novo?",
        a: "Não, se for a mesma cidade e o mesmo ramo em até 6 horas: o resultado fica guardado e a repetição sai de graça. Passado esse tempo, a busca é nova e custa de novo.",
      },
      {
        q: "Os comércios que eu encontro ficam só pra mim?",
        a: "A lista não é exclusiva: ela vem do Google, e outra pessoa que buscar a mesma cidade e o mesmo ramo vai ver os mesmos comércios. O que é só seu são as suas anotações — os leads que você salvou, o estágio de cada um, os sites que você gerou e as vendas do Financeiro. Nada disso aparece pra outra conta.",
      },
    ],
  },
  {
    id: "sites",
    titulo: "Sites, hospedagem e domínio",
    resumo: "Onde o site fica, de quem ele é e como usar um domínio próprio.",
    perguntas: [
      {
        q: "Onde o site fica hospedado?",
        a: `No próprio ${SITE.nome}. Ao publicar, o site ganha na hora um link público no formato ${SITE.dominio}/p/nome-do-comercio, que abre em qualquer celular sem login. Você não contrata hospedagem, não configura servidor e não instala nada.`,
      },
      {
        q: "A hospedagem tem custo extra?",
        a: "Não. Publicar o site e mandar o link não custam crédito nenhum, e não existe mensalidade separada de hospedagem.",
      },
      {
        q: "Dá pra usar um domínio próprio, tipo padariadoze.com.br?",
        a: `Dá, e sai bem mais barato que contratar hospedagem. Não é possível conectar o domínio por dentro do ${SITE.nome}, mas o dono do comércio registra o domínio e liga um redirecionamento pro link do site, no painel do próprio registrador. Quem digitar o domínio cai na página certa. Depois que ela abre, o endereço na barra volta a ser o do ${SITE.nome}: o domínio funciona como porta de entrada, o que já resolve pra cartão de visita, fachada e bio do Instagram. O domínio é contratado e pago direto com o registrador.`,
      },
      {
        q: "O código é meu? Posso entregar os arquivos ao cliente?",
        a: `Pode. O HTML gerado é seu e do cliente pra quem você vender, e o botão “Baixar site” entrega um .zip com o arquivo e um LEIA-ME de como hospedar em qualquer lugar. Uma ressalva importante: as fotos do Google não vão no .zip. Os termos do Google Maps Platform não deixam redistribuir essas imagens, então no lugar delas vão espaços numerados pro dono pôr as fotos dele. Baixar custa ${EXPORT_PRICE} créditos por versão do site; baixar a mesma versão de novo é grátis.`,
      },
      {
        q: "Dá pra editar o site depois de pronto?",
        a: "Dá, quantas vezes quiser, conversando com a IA no chat do gerador. Cada pedido mostra o custo antes de você confirmar. Mudanças pontuais (cor, texto, horário, seção) são o que o ajuste cobre; refazer o site inteiro é outra coisa, e nesse caso o próprio chat oferece o “Recriar site”, que abre a próxima versão como um site separado e deixa o original intacto com o link dele.",
      },
      {
        q: "O dono do comércio consegue mexer no site sozinho?",
        a: "Não. Ele não tem conta nem acesso ao editor: quem edita é você, pela sua conta. Se ele quiser autonomia total, o caminho é baixar os arquivos e hospedar por conta dele.",
      },
      {
        q: "O site publicado aparece no Google?",
        a: "Não. A página publicada pede aos buscadores para não indexá-la. Ela é feita pra ser mostrada por link — no WhatsApp, numa ligação, pessoalmente — e não pra ganhar posição na busca. Se o dono quiser um site que apareça no Google, o caminho hoje é baixar os arquivos e hospedar por conta.",
      },
    ],
  },
  {
    id: "planos",
    titulo: "Planos, créditos e cobrança",
    resumo: "Quanto custa cada ação, como o saldo funciona e como cancelar.",
    perguntas: [
      {
        q: "Como funcionam os créditos?",
        a: `Crédito é a moeda de cada ação, e o preço é o mesmo em todos os planos: ${SEARCH_PRICE} por busca, ${SITE_PRICE} por site novo, ${EDIT_PRICE} por ajuste com IA (conversa longa custa um múltiplo disso, e o valor aparece antes) e ${EXPORT_PRICE} por baixar uma versão em arquivos. Publicar e enviar o link são grátis. O custo sempre aparece na tela antes de você confirmar.`,
      },
      {
        q: "Os créditos acumulam de um mês para o outro?",
        a: "Acumulam. Todo período pago soma a franquia inteira do plano ao seu saldo, e o que sobrou do mês anterior continua lá. Créditos de recarga entram por cima e valem 12 meses a partir da compra.",
      },
      {
        q: "Qual a diferença entre plano e recarga?",
        a: "O plano é assinatura: renova sozinho e o crédito sai mais barato. A recarga é compra única, sem assinatura, com o crédito mais caro — serve pra um mês fora da curva, sem mudar de plano.",
      },
      {
        q: "O plano Grátis dá pra fazer o quê?",
        a: `Achar clientes, não montar sites. Ele vem com ${WELCOME_CREDITS} créditos de boas-vindas, uma vez por telefone verificado, que dão ${Math.floor(WELCOME_CREDITS / SEARCH_PRICE)} buscas — e a primeira busca, a da sua cidade, já vem feita quando você entra. Não cobre um site (${SITE_PRICE} créditos): pra gerar, é preciso um plano ou uma recarga.`,
      },
      {
        q: "Como eu pago?",
        a: "Pix ou cartão de crédito, pela Asaas, dentro do próprio Pagefy — nada redireciona pra outro site. No Pix, o QR Code e o código aparecem na tela e os créditos entram assim que o pagamento cai. No cartão, a aprovação é na hora, e o plano renova no mesmo cartão.",
      },
      {
        q: "Posso cancelar quando quiser?",
        a: "Pode, e o cancelamento vale para a próxima renovação: o período já pago segue até o fim, com os créditos dele.",
      },
      {
        q: "Se eu assinar e não gostar, vocês devolvem?",
        a: `Sim, dentro de sete dias do pagamento, que é o direito de arrependimento de compra pela internet. Escreva para ${OPERADOR.email}. Se você já tiver gasto parte dos créditos, devolvemos a parte proporcional aos que sobraram — buscas e sites já gerados custaram dinheiro de verdade e não voltam.`,
      },
    ],
  },
  {
    id: "assinatura-parar",
    titulo: "Se a assinatura parar",
    resumo: "O que acontece com os sites já entregues e com o que sobrou na conta.",
    perguntas: [
      {
        q: "Se eu cancelar, os sites dos meus clientes saem do ar?",
        a: "Não. Os sites publicados continuam no ar, com os mesmos links, e o dono do comércio não percebe nada. Cancelar mexe na sua capacidade de produzir sites novos, não no que você já entregou.",
      },
      {
        q: "Perco os créditos que sobraram?",
        a: "Não. O saldo continua na conta, e você gasta quando quiser. O que muda é que ele para de ser reposto todo mês.",
      },
      {
        q: "O que muda na minha conta?",
        a: "Passado o período pago (com alguns dias de folga para a cobrança entrar), a conta volta ao plano Grátis. Seus leads, sites, conversas do gerador e vendas do Financeiro continuam todos lá.",
      },
      {
        q: "E se eu voltar depois de alguns meses?",
        a: "É só assinar de novo. A conta é a mesma, com tudo onde você deixou, e a franquia do plano volta a entrar a cada período pago.",
      },
    ],
  },
  {
    id: "conta",
    titulo: "Conta, dados e suporte",
    resumo: "Login, privacidade e como falar com uma pessoa.",
    perguntas: [
      {
        q: "Como faço login?",
        a: "Só com a conta do Google. Não existe senha própria no Pagefy, então não há senha para vazar nem para esquecer. Depois do login, verificamos seu telefone uma vez — é o que segura os créditos de boas-vindas em um por pessoa.",
      },
      {
        q: "Vocês usam os meus dados para outra coisa?",
        a: `Não. Não há rastreador de terceiros em nenhuma página, nem aqui nem nos sites publicados, e não vendemos nem cedemos dados para publicidade. O que guardamos, por quê e por quanto tempo está inteiro na Política de Privacidade — a lista de lá sai das tabelas que existem de verdade no nosso banco.`,
      },
      {
        q: "Gastei crédito e a ação não funcionou. E agora?",
        a: `Quando uma ação falha por erro nosso, ou você interrompe uma geração antes de ela terminar, os créditos reservados voltam sozinhos para o seu saldo. Se algo ficou estranho no extrato, escreva para ${OPERADOR.email} com o dia e a ação, que a gente confere.`,
      },
      {
        q: "Sou dono de um comércio e recebi um site com os dados do meu negócio.",
        a: `Esse site foi montado por alguém que usa o ${SITE.nome} para oferecer páginas a comércios da região, a partir das informações que o seu negócio publicou no Google. Se você não quiser a página no ar, escreva para ${OPERADOR.email} com o link ou o nome do estabelecimento: tiramos sem pedir explicação.`,
      },
      {
        q: "Como falo com o suporte?",
        a: `Por e-mail, em ${OPERADOR.email}. É uma pessoa respondendo, em português. Cobrança, problema na conta, remoção de dados ou dúvida antes de assinar — pode escrever.`,
      },
    ],
  },
];

const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const totalPerguntas = CATEGORIAS.reduce((soma, c) => soma + c.perguntas.length, 0);

export default function AjudaPage() {
  const indice = CATEGORIAS.map(({ id, titulo }) => ({ id, titulo }));

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <header className="border-b border-line bg-surface pb-14 pt-14 sm:pb-16 sm:pt-16">
          <div className={container}>
            <h1 className="max-w-[16ch] text-[2.3rem] font-semibold leading-[1.06] tracking-[-0.04em] text-ink sm:text-[3.1rem]">
              Como podemos ajudar?
            </h1>
            <p className="mt-5 max-w-[58ch] text-[1.08rem] leading-relaxed text-ink-2">
              {totalPerguntas} respostas sobre a busca, os sites que você entrega, os créditos e o
              que acontece com tudo isso se a assinatura parar. Quem responde o resto é uma pessoa,
              no e-mail lá embaixo.
            </p>
          </div>
        </header>

        <div className={`${container} py-12 sm:py-16`}>
          {/* Mesma estrutura dos Termos: no celular o texto vem primeiro e o
              índice logo depois do começo; no desktop ele fica na coluna da
              esquerda, acompanhando a leitura. */}
          <div className="grid gap-y-10 lg:grid-cols-[15rem_1fr] lg:gap-x-16 lg:gap-y-12">
            <div className="order-2 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1">
              <LegalIndex secoes={indice} />
            </div>

            <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1">
              <p className="max-w-[62ch] rounded-2xl bg-surface-2 px-6 py-5 text-[0.98rem] leading-[1.6] text-ink-2 sm:px-7">
                Toda resposta aqui vale para o Pagefy como ele é hoje. Quando alguma coisa ainda não
                existe, a resposta diz isso com todas as letras em vez de prometer.
              </p>
            </div>

            <div className="order-3 space-y-12 lg:order-none lg:col-start-2 lg:row-start-2 sm:space-y-14">
              {CATEGORIAS.map((categoria) => (
                <section key={categoria.id} id={categoria.id} className="scroll-mt-28">
                  <h2 className="text-[1.35rem] font-semibold tracking-[-0.025em] text-ink sm:text-[1.5rem]">
                    {categoria.titulo}
                  </h2>
                  <p className="mt-2 max-w-[58ch] text-[0.98rem] leading-relaxed text-muted">
                    {categoria.resumo}
                  </p>

                  <div className="mt-5 divide-y divide-line border-y border-line">
                    {categoria.perguntas.map((item) => (
                      <details key={item.q} className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-left font-display text-[1.02rem] font-semibold tracking-[-0.02em] text-ink [&::-webkit-details-marker]:hidden">
                          {item.q}
                          <Plus
                            className="size-5 shrink-0 text-muted transition-transform duration-300 ease-(--ease-out-expo) group-open:rotate-45"
                            aria-hidden="true"
                          />
                        </summary>
                        <p className="max-w-[64ch] pb-5 text-[0.98rem] leading-[1.7] text-ink-2">
                          {item.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              ))}

              {/* Fecho: o que fazer quando a resposta não está aqui. */}
              <section aria-labelledby="ajuda-contato" className="rounded-[28px] border border-line bg-surface px-7 py-9 sm:px-9 sm:py-10">
                <h2
                  id="ajuda-contato"
                  className="text-[1.35rem] font-semibold tracking-[-0.025em] text-ink sm:text-[1.5rem]"
                >
                  Ficou uma dúvida que não está aqui?
                </h2>
                <p className="mt-3 max-w-[58ch] text-[1rem] leading-relaxed text-ink-2">
                  Se você está decidindo se assina, pergunte antes. A gente responde o que a
                  ferramenta faz e também o que ela não faz — é melhor para os dois lados.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href={`mailto:${OPERADOR.email}`}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green px-6 font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97]"
                  >
                    Escrever para a gente
                    <ArrowRight className="size-[18px]" aria-hidden="true" />
                  </a>
                  <Link
                    href="/#perguntas"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-line-strong px-6 font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-surface-2"
                  >
                    Ver as perguntas da página inicial
                  </Link>
                </div>
                <p className="mt-6 text-[0.88rem] text-muted">
                  Também vale ler os{" "}
                  <Link href="/termos" className="font-semibold text-green-ink underline decoration-green/30 transition-colors hover:decoration-green">
                    Termos de uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacidade" className="font-semibold text-green-ink underline decoration-green/30 transition-colors hover:decoration-green">
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
