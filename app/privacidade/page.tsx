import type { Metadata } from "next";
import {
  A,
  Definicao,
  Definicoes,
  Item,
  LegalDocument,
  Lista,
  P,
  type LegalSection,
} from "../_components/legal-document";
import { OPERADOR, PRIVACIDADE_ATUALIZADO, QUEM_OPERA, SITE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidade | Pagefy",
  description:
    "Quais dados o Pagefy guarda, por que guarda, com quem divide, por quanto tempo mantém e como você pede acesso, correção ou exclusão.",
  alternates: { canonical: "/privacidade" },
};

const SECOES: LegalSection[] = [
  {
    id: "controlador",
    titulo: "Quem é o responsável pelos seus dados",
    corpo: (
      <>
        <P>
          O controlador dos dados tratados no {SITE.nome} é {QUEM_OPERA}. Também é ele quem responde
          como encarregado, no e-mail{" "}
          <A href={`mailto:${OPERADOR.email}`}>{OPERADOR.email}</A>.
        </P>
        <P>
          Esta política vale para <A href={SITE.url}>{SITE.dominio}</A>, para o aplicativo em{" "}
          <code className="font-mono text-[0.9em] text-ink-2">{SITE.dominio}/app</code> e para as
          páginas publicadas em{" "}
          <code className="font-mono text-[0.9em] text-ink-2">{SITE.dominio}/p/…</code>. Ela segue a
          Lei Geral de Proteção de Dados (Lei 13.709/2018).
        </P>
      </>
    ),
  },
  {
    id: "o-que-guardamos",
    titulo: "O que guardamos, e por quê",
    corpo: (
      <>
        <P>
          Esta lista é a lista inteira: ela sai das tabelas que existem no nosso banco, não de um
          modelo genérico.
        </P>
        <Definicoes>
          <Definicao termo="Sua conta">
            Nome, e-mail, foto de perfil e o identificador da sua conta Google, recebidos do Google
            no login. Sem isso não há como ter conta, já que entrar só é possível pelo Google.
            Base legal: execução do contrato.
          </Definicao>
          <Definicao termo="Seu telefone">
            O número e a data em que ele foi verificado. Ele existe para segurar o bônus de
            boas-vindas em um por pessoa. Base legal: legítimo interesse em evitar abuso do plano
            gratuito.
          </Definicao>
          <Definicao termo="Plano, saldo e extrato">
            Qual plano você tem, quando renova, seu saldo de créditos e cada entrada e saída, com o
            motivo. É o que permite cobrar certo e mostrar o extrato. Base legal: execução do
            contrato.
          </Definicao>
          <Definicao termo="Pagamentos">
            Valor, status, data e o identificador da cobrança na Asaas. Os dados do cartão e o seu
            CPF ou CNPJ ficam com a Asaas: eles passam pelo nosso servidor apenas para chegar lá, na
            mesma requisição, sem serem gravados nem registrados em log. Base legal: execução do
            contrato e obrigação legal.
          </Definicao>
          <Definicao termo="Suas buscas">
            Cidade, ramo, quantos resultados vieram e quanto custou. Serve para o histórico e para
            entender o custo do serviço. Base legal: execução do contrato.
          </Definicao>
          <Definicao termo="Seus leads, sites e vendas">
            O que você salvou no app: leads com nome, telefone e endereço do comércio, o estágio de
            cada um, os sites gerados, a conversa e o HTML de cada rascunho no gerador, e as vendas
            que você anotou no Financeiro. São as suas anotações de trabalho; guardamos para
            devolver a você em qualquer dispositivo. Base legal: execução do contrato.
          </Definicao>
          <Definicao termo="Sites publicados">
            O HTML da página, o nome do comércio, o endereço público (slug), a contagem de visitas e
            o resumo criptográfico da chave de edição. A contagem é um número só, sem nada sobre
            quem visitou. Base legal: execução do contrato.
          </Definicao>
          <Definicao termo="Custos de API">
            Uma linha por chamada paga a Google ou Anthropic, com a sua conta associada, para saber
            quanto cada ação custa. Sem conteúdo da chamada. Base legal: legítimo interesse em
            manter o serviço viável.
          </Definicao>
          <Definicao termo="Registros de acesso">
            Como em qualquer servidor web, os acessos ficam em log com data, rota, IP e navegador. É
            o que o Marco Civil da Internet exige guardar. Base legal: obrigação legal.
          </Definicao>
        </Definicoes>
      </>
    ),
  },
  {
    id: "o-que-nao-guardamos",
    titulo: "O que não guardamos",
    corpo: (
      <>
        <P>Vale dizer com todas as letras, porque é o oposto do que se espera de um site:</P>
        <Lista>
          <Item>
            <strong className="font-semibold text-ink">Nenhum rastreador de terceiros.</strong> Não
            há Google Analytics, pixel de rede social, mapa de calor ou ferramenta de gravação de
            sessão, nem aqui nem nas páginas publicadas. As páginas em{" "}
            <code className="font-mono text-[0.9em] text-ink-2">/p/…</code> rodam com uma política de
            segurança que bloqueia qualquer script externo e qualquer chamada de rede.
          </Item>
          <Item>
            <strong className="font-semibold text-ink">Nenhum dado de cartão.</strong> Nada do cartão
            é gravado ou registrado em log no nosso servidor.
          </Item>
          <Item>
            <strong className="font-semibold text-ink">Nenhuma senha.</strong> O login é do Google;
            nós nunca vemos a sua senha.
          </Item>
          <Item>
            <strong className="font-semibold text-ink">Nenhum perfil de publicidade.</strong> Não
            vendemos, alugamos nem cedemos dados para publicidade, e não montamos perfis para
            terceiros.
          </Item>
        </Lista>
      </>
    ),
  },
  {
    id: "ip",
    titulo: "O que fazemos com o seu IP",
    corpo: (
      <>
        <P>Três usos, e nenhum deles guarda o IP num banco:</P>
        <Lista>
          <Item>
            Descobrir a cidade aproximada para abrir o mapa da tela inicial já na sua região. A
            consulta vai para um serviço de geolocalização por IP (geojs.io) e a resposta fica em
            memória por 24 horas.
          </Item>
          <Item>
            Segurar limites por IP em rotas que consomem cota paga do Google, para que ninguém
            queime a cota de todos. A contagem fica em memória e some quando o servidor reinicia.
          </Item>
          <Item>
            Cumprir a guarda de registros de acesso do Marco Civil, nos logs do servidor.
          </Item>
        </Lista>
      </>
    ),
  },
  {
    id: "cookies",
    titulo: "Cookies e o que fica no seu navegador",
    corpo: (
      <>
        <P>
          Só existe um cookie, e ele é necessário para o serviço funcionar. Por isso não há banner
          de consentimento: não há nada opcional para consentir.
        </P>
        <Definicoes>
          <Definicao termo="pagefy_session">
            O cookie da sessão. Guarda o identificador da sua conta e uma assinatura que prova que
            ele veio de nós. É HttpOnly (o JavaScript da página não consegue lê-lo), vale para{" "}
            {SITE.dominio} e subdomínios, e dura 30 dias.
          </Definicao>
          <Definicao termo="pagefy-theme">
            Não é cookie, é uma preferência guardada no seu navegador: se você escolheu o tema claro
            ou escuro. Nunca sai do seu aparelho.
          </Definicao>
          <Definicao termo="Cópia do seu perfil">
            Nome e foto ficam na memória da aba (sessionStorage) só para a tela não piscar
            deslogada enquanto carrega. Fechou a aba, some.
          </Definicao>
        </Definicoes>
      </>
    ),
  },
  {
    id: "comercios",
    titulo: "Os dados dos comércios que aparecem nas buscas",
    corpo: (
      <>
        <P>
          Nome, endereço, telefone, nota e fotos dos comércios vêm da API do Google Places, e são
          informações que o próprio estabelecimento publicou. Nós as guardamos em cache temporário,
          com prazo de validade, como os termos do Google Maps Platform exigem — o que fica sem prazo
          é apenas o identificador do lugar.
        </P>
        <P>
          Quando você salva um comércio como lead, esses dados passam a ser a sua anotação de
          trabalho e ficam na sua conta até você apagar o lead.
        </P>
        <P>
          É dono de um comércio e quer a página dele fora do ar, ou os dados dele fora do{" "}
          {SITE.nome}? Escreva para <A href={`mailto:${OPERADOR.email}`}>{OPERADOR.email}</A> com o
          link ou o nome do estabelecimento e nós tiramos.
        </P>
      </>
    ),
  },
  {
    id: "compartilhamento",
    titulo: "Com quem dividimos, e onde isso fica",
    corpo: (
      <>
        <P>
          Só com quem faz o serviço funcionar, e só o necessário. A maior parte da nossa
          infraestrutura fica nos Estados Unidos, o que é uma transferência internacional de dados
          (art. 33 da LGPD), feita com base na execução do contrato com você e nas cláusulas
          contratuais de cada fornecedor.
        </P>
        <Definicoes>
          <Definicao termo="Google (EUA)">
            Login (Identity Services) e busca de comércios (Places API). Recebe o que é necessário
            para autenticar você e para fazer a busca.
          </Definicao>
          <Definicao termo="Anthropic (EUA)">
            Gera e ajusta os sites. Recebe o seu pedido escrito no gerador, os dados do comércio e
            as imagens que você enviar. Não recebe seu nome, e-mail, telefone nem dados de
            pagamento.
          </Definicao>
          <Definicao termo="Asaas (Brasil)">
            Processa os pagamentos. Recebe nome, e-mail, CPF ou CNPJ e os dados do cartão ou do Pix.
          </Definicao>
          <Definicao termo="Railway (EUA)">
            Hospeda o servidor, o banco de dados e as imagens que você envia.
          </Definicao>
          <Definicao termo="Vercel (EUA)">Hospeda o site que você está lendo agora.</Definicao>
          <Definicao termo="geojs.io">
            Recebe um IP e devolve a cidade aproximada. Nada além do IP é enviado.
          </Definicao>
        </Definicoes>
        <P>
          Fora isso, só dividimos dados por ordem judicial ou exigência legal. Se um dia o {SITE.nome}{" "}
          for vendido ou incorporado, você será avisado antes de qualquer transferência.
        </P>
      </>
    ),
  },
  {
    id: "prazos",
    titulo: "Por quanto tempo guardamos",
    corpo: (
      <Definicoes>
        <Definicao termo="Conta e conteúdo da conta">
          Enquanto a conta existir. Pediu para encerrar, apagamos em até 30 dias.
        </Definicao>
        <Definicao termo="Registros de pagamento">
          Cinco anos depois da transação, por obrigação fiscal e para defesa em eventual discussão
          de cobrança. Continuam guardados mesmo depois de a conta ser encerrada.
        </Definicao>
        <Definicao termo="Registros de acesso">
          Seis meses, o mínimo do Marco Civil da Internet.
        </Definicao>
        <Definicao termo="Cache de comércios do Google">
          Com prazo curto de validade, apagado automaticamente quando vence.
        </Definicao>
        <Definicao termo="Sites publicados">
          Até você despublicar, apagar o site ou encerrar a conta.
        </Definicao>
      </Definicoes>
    ),
  },
  {
    id: "seguranca",
    titulo: "Como protegemos",
    corpo: (
      <>
        <Lista>
          <Item>
            Todo o tráfego é HTTPS, sem versão sem criptografia: o domínio{" "}
            <code className="font-mono text-[0.9em] text-ink-2">.app</code> só existe em HTTPS.
          </Item>
          <Item>
            O banco de dados não é acessível pela internet: só o nosso servidor alcança ele, pela
            rede interna.
          </Item>
          <Item>
            O cookie de sessão é assinado, HttpOnly e Secure, e só é aceito vindo do nosso próprio
            endereço.
          </Item>
          <Item>
            As páginas publicadas passam por uma limpeza que remove script externo, rastreador,
            redirecionamento e formulário, e rodam com política de segurança restrita.
          </Item>
          <Item>Chaves e segredos ficam fora do código, só nos painéis de quem hospeda.</Item>
        </Lista>
        <P>
          Nenhum sistema é perfeito. Se acontecer um incidente que possa trazer risco ou dano
          relevante a você, avisamos você e a ANPD, como manda o art. 48 da LGPD.
        </P>
      </>
    ),
  },
  {
    id: "direitos",
    titulo: "Seus direitos, e como usá-los",
    corpo: (
      <>
        <P>
          O art. 18 da LGPD garante a você: confirmar se tratamos seus dados; acessar o que temos;
          corrigir o que estiver errado; pedir anonimização, bloqueio ou eliminação de dado
          desnecessário ou tratado fora da lei; pedir portabilidade; saber com quem dividimos; e
          revogar consentimento quando ele for a base do tratamento.
        </P>
        <P>
          Para exercer qualquer um deles, escreva para{" "}
          <A href={`mailto:${OPERADOR.email}`}>{OPERADOR.email}</A> do e-mail da sua conta.
          Respondemos em até 15 dias. Alguns dados não podem ser apagados enquanto durar uma
          obrigação legal — os registros de pagamento e de acesso são os casos.
        </P>
        <P>
          Se a nossa resposta não resolver, você pode reclamar à Autoridade Nacional de Proteção de
          Dados, em <A href="https://www.gov.br/anpd">gov.br/anpd</A>.
        </P>
      </>
    ),
  },
  {
    id: "menores",
    titulo: "Crianças e adolescentes",
    corpo: (
      <P>
        O {SITE.nome} é uma ferramenta de trabalho e não se destina a menores de 18 anos. Não
        coletamos dados de crianças ou adolescentes de propósito. Se descobrirmos uma conta assim,
        ela é encerrada e os dados apagados.
      </P>
    ),
  },
  {
    id: "visitantes",
    titulo: "Quem só abre o link de um site publicado",
    corpo: (
      <>
        <P>
          O dono do comércio, ou qualquer pessoa que receba o link{" "}
          <code className="font-mono text-[0.9em] text-ink-2">{SITE.dominio}/p/…</code>, não precisa
          de conta e não é rastreado. A visita entra numa contagem simples de acessos, sem nada que
          identifique quem abriu, nenhum cookie é criado, e a página não pode chamar nenhum serviço
          externo.
        </P>
        <P>
          Se você é dono do comércio e não quer a página no ar, escreva para{" "}
          <A href={`mailto:${OPERADOR.email}`}>{OPERADOR.email}</A>: tiramos sem pedir explicação.
        </P>
      </>
    ),
  },
  {
    id: "alteracoes",
    titulo: "Mudanças nesta política",
    corpo: (
      <P>
        Quando esta política mudar, a data no topo muda junto. Mudança relevante no que fazemos com
        os seus dados é avisada por e-mail ou dentro do app antes de passar a valer.
      </P>
    ),
  },
];

export default function PrivacidadePage() {
  return (
    <LegalDocument
      titulo="Política de Privacidade"
      resumo="Quais dados o Pagefy guarda, por que guarda, com quem divide e por quanto tempo mantém. A lista abaixo sai das tabelas que existem de verdade no nosso banco."
      atualizado={PRIVACIDADE_ATUALIZADO}
      essencial={[
        "Guardamos o necessário para a conta funcionar e para cobrar certo: seu perfil do Google, telefone, saldo de créditos, pagamentos e o que você salvou no app.",
        "Não há rastreador de terceiros em nenhuma página, nem aqui nem nos sites publicados, e não existe banner de cookie porque só há um cookie e ele é obrigatório.",
        "Dados do cartão e seu CPF ficam com a Asaas, nunca no nosso banco.",
        "Você pode pedir acesso, correção ou exclusão a qualquer momento, e nós respondemos em até 15 dias.",
      ]}
      secoes={SECOES}
      irmao={{ href: "/termos", label: "Termos de uso" }}
    />
  );
}
