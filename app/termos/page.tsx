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
import { OPERADOR, QUEM_OPERA, SITE, TERMOS_ATUALIZADO } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termos de uso | Pagefy",
  description:
    "As regras de uso do Pagefy: conta, créditos, planos, pagamento, cancelamento e a responsabilidade de quem vende os sites gerados.",
  alternates: { canonical: "/termos" },
};

const SECOES: LegalSection[] = [
  {
    id: "quem-opera",
    titulo: "Quem opera o Pagefy",
    corpo: (
      <>
        <P>
          O {SITE.nome} é operado por {QUEM_OPERA}, e fica em{" "}
          <A href={SITE.url}>{SITE.dominio}</A>. Contato por escrito:{" "}
          <A href={`mailto:${OPERADOR.email}`}>{OPERADOR.email}</A>.
        </P>
        <P>
          Estes Termos são o contrato entre você e o {SITE.nome}. Criar conta, usar o site ou pagar
          por qualquer coisa aqui significa que você leu e concorda com eles. Se não concordar, não
          use o serviço.
        </P>
      </>
    ),
  },
  {
    id: "o-que-e",
    titulo: "O que o Pagefy faz, e o que ele não faz",
    corpo: (
      <>
        <P>
          O {SITE.nome} é uma ferramenta de trabalho para quem quer vender sites a comércios locais.
          Ele faz três coisas: busca no Google Places comércios de uma cidade, bairro ou ramo que
          não têm site cadastrado; gera uma página pronta para cada um com o nome, endereço,
          telefone e fotos que o próprio comércio publicou no Google; e publica essa página num link
          público (<code className="font-mono text-[0.9em] text-ink-2">{SITE.dominio}/p/…</code>) que
          você mostra ao dono.
        </P>
        <P>O que ele não faz, e não promete:</P>
        <Lista>
          <Item>
            <strong className="font-semibold text-ink">Não vende por você.</strong> A conversa com o
            dono do comércio, o preço que você cobra e o fechamento são seus. O {SITE.nome} não
            garante nenhuma venda, nenhum retorno e nenhum faturamento.
          </Item>
          <Item>
            <strong className="font-semibold text-ink">Não garante que o comércio não tem site.</strong>{" "}
            A busca enxerga o que o dono cadastrou no perfil do Google. Um site que existe e nunca
            foi cadastrado lá não aparece, e um site cadastrado e já fora do ar continua contando.
            Antes do primeiro site nós fazemos uma conferência automática na web e avisamos se
            acharmos um site do comércio, mas ela também pode falhar.
          </Item>
          <Item>
            <strong className="font-semibold text-ink">Não fala com o dono do comércio.</strong> Nada
            é enviado automaticamente para ele. O link só chega até onde você levar.
          </Item>
          <Item>
            <strong className="font-semibold text-ink">Não hospeda sistemas.</strong> As páginas
            geradas são estáticas: não têm formulário, login, carrinho, agendamento nem qualquer
            coisa que mude sozinha. Contato é sempre link (WhatsApp, telefone, rota, Instagram).
          </Item>
          <Item>
            <strong className="font-semibold text-ink">Não liga um domínio próprio ao site.</strong>{" "}
            A página publicada mora, sempre, num endereço nosso:{" "}
            <code className="font-mono text-[0.9em] text-ink-2">{SITE.dominio}/p/…</code>. Não existe,
            em nenhum plano, a opção de conectar um domínio dentro do Pagefy, e não há data para isso
            mudar.
          </Item>
        </Lista>
        <P>
          <strong className="font-semibold text-ink">O que dá para fazer, e não depende de nós:</strong>{" "}
          registrar um domínio (<code className="font-mono text-[0.9em] text-ink-2">padariadoze.com.br</code>
          ) e configurar, no painel do próprio registrador, um redirecionamento para o link do site.
          Quem digitar o domínio cai na página certa, sem contratar hospedagem. Depois que a página
          abre, o endereço na barra do navegador volta a ser o do {SITE.nome}: o domínio funciona
          como porta de entrada, não como capa. Esse domínio é contratado e pago por você ou pelo
          dono do comércio, direto com o registrador; o {SITE.nome} não participa dessa contratação
          e não responde por ela.
        </P>
        <P>
          Já tirar o site do {SITE.nome} e hospedá-lo em outro lugar exige baixá-lo em arquivos — e
          nesse caso as fotos do Google não vão junto, como explica{" "}
          <A href="#conteudo">De quem é o que aparece na tela</A>.
        </P>
      </>
    ),
  },
  {
    id: "conta",
    titulo: "Conta e acesso",
    corpo: (
      <>
        <P>
          A conta é criada com login do Google, e é a única forma de entrar. Você precisa ter 18 anos
          ou mais e capacidade civil para contratar. A conta é pessoal: você responde pelo que
          acontece nela e por manter o acesso à sua conta Google protegido.
        </P>
        <P>
          Verificamos seu telefone depois do login. Isso existe porque os créditos de boas-vindas são
          uma vez por telefone verificado — criar várias contas para repetir o bônus é uso indevido e
          permite o bloqueio de todas elas.
        </P>
        <P>
          Você pode encerrar sua conta quando quiser, pelo{" "}
          <A href={`mailto:${OPERADOR.email}`}>{OPERADOR.email}</A>. Encerrar a conta apaga seus
          dados na forma descrita na <A href="/privacidade">Política de Privacidade</A> e não devolve
          créditos já comprados.
        </P>
      </>
    ),
  },
  {
    id: "creditos",
    titulo: "Créditos",
    corpo: (
      <>
        <P>
          Tudo no {SITE.nome} é pago em créditos, e o custo aparece na tela antes de qualquer ação
          que gaste. Os preços atuais:
        </P>
        <Definicoes>
          <Definicao termo="Busca de comércios">30 créditos por busca nova. Uma busca repetida da mesma cidade e ramo em até 6 horas usa o resultado guardado e não cobra de novo.</Definicao>
          <Definicao termo="Site novo">150 créditos, cobrados quando você confirma o primeiro pedido no gerador.</Definicao>
          <Definicao termo="Ajuste no site">40 créditos por pedido. Conversas longas custam mais um múltiplo disso, porque cada pedido relê a conversa inteira; o valor exato aparece antes de você confirmar.</Definicao>
          <Definicao termo="Baixar o site em arquivos">100 créditos por versão do site. Baixar a mesma versão de novo é grátis.</Definicao>
          <Definicao termo="Publicar e enviar o link">Grátis.</Definicao>
        </Definicoes>
        <P>
          Créditos não são dinheiro, não rendem, não são transferíveis entre contas e não são
          convertidos em espécie. Créditos de recarga valem 12 meses a partir da compra. Créditos de
          plano entram a cada período pago e se acumulam; se o plano acabar, o saldo que sobrou
          continua na conta, que volta para o Grátis.
        </P>
        <P>
          Se uma ação paga falhar por erro nosso, ou se você interromper uma geração antes de ela
          terminar, os créditos reservados voltam para o seu saldo.
        </P>
        <P>
          Os preços em créditos podem mudar quando o custo das ferramentas que usamos mudar. A
          alteração vale para as ações feitas depois dela, nunca para trás, e o valor novo aparece na
          tela antes de você confirmar.
        </P>
      </>
    ),
  },
  {
    id: "planos-pagamento",
    titulo: "Planos, recargas e pagamento",
    corpo: (
      <>
        <P>
          O plano Grátis não cobra nada e vem com 120 créditos de boas-vindas, uma vez por telefone
          verificado. Os planos pagos são mensais ou semestrais e dão uma quantidade de créditos por
          mês; as recargas são compras avulsas de créditos, sem assinatura. Os valores e o que cada
          um inclui estão na <A href="/#precos">página de preços</A>, que é a versão vigente.
        </P>
        <P>
          Os pagamentos são processados pela Asaas (Pix ou cartão de crédito), dentro do próprio
          {" "}{SITE.nome}. Nós não guardamos os dados do seu cartão: eles passam pelo nosso servidor
          apenas para chegar à Asaas, na mesma requisição, sem serem gravados nem registrados em log.
          O CPF ou CNPJ pedido na compra fica com a Asaas.
        </P>
        <P>
          Assinatura mensal renova a cada mês e a semestral a cada seis meses, no mesmo meio de
          pagamento, até você cancelar. Cada renovação paga credita a franquia do plano. Se a
          cobrança não for paga, a conta volta para o Grátis no fim do período já pago.
        </P>
        <P>
          Se um pagamento for estornado, contestado ou devolvido, os créditos que ele gerou saem do
          saldo, mesmo que isso deixe o saldo negativo.
        </P>
      </>
    ),
  },
  {
    id: "cancelamento",
    titulo: "Cancelamento e arrependimento",
    corpo: (
      <>
        <P>
          Você pode cancelar a assinatura a qualquer momento. O cancelamento vale para a próxima
          renovação: o período já pago segue até o fim, com os créditos dele.
        </P>
        <P>
          Compra feita pela internet tem sete dias de arrependimento, contados do pagamento (art. 49
          do Código de Defesa do Consumidor). Dentro desse prazo, escreva para{" "}
          <A href={`mailto:${OPERADOR.email}`}>{OPERADOR.email}</A> e devolvemos o valor. Se você já
          tiver gasto parte dos créditos, devolvemos a parte proporcional aos créditos não usados —
          buscas e sites já gerados custaram dinheiro real e não voltam.
        </P>
      </>
    ),
  },
  {
    id: "sua-responsabilidade",
    titulo: "A sua responsabilidade com os sites gerados",
    corpo: (
      <>
        <P>
          Esta é a parte mais importante destes Termos. Você usa o {SITE.nome} para montar a página
          de um comércio que ainda não pediu nada a ninguém, e é você quem leva essa página ao dono.
          Ao fazer isso, você assume que:
        </P>
        <Lista>
          <Item>
            A página é uma proposta comercial sua, não um site oficial do comércio. Você não vai
            apresentá-la como se o dono a tivesse encomendado, nem se passar por ele, nem falar em
            nome dele.
          </Item>
          <Item>
            Os dados que aparecem na página (nome, endereço, telefone, horário, fotos) são os que o
            próprio comércio publicou no Google. Conferir se estão certos antes de mostrar é com
            você.
          </Item>
          <Item>
            Você não vai inventar preço, promoção, prêmio, certificação, urgência ou qualquer
            informação que o comércio não tenha divulgado.
          </Item>
          <Item>
            Se o dono pedir para tirar a página do ar, você tira. Nós também atendemos esse pedido
            quando ele chega direto para nós.
          </Item>
          <Item>
            Ramos com publicidade regulada (saúde, odontologia, veterinária, estética, farmácia,
            bebida alcoólica) seguem as regras do conselho ou do órgão que os fiscaliza. Isso é
            responsabilidade de quem publica.
          </Item>
          <Item>
            Quando você entrega o site ao dono, a relação passa a ser entre vocês dois: preço,
            prazo, nota fiscal, garantia e suporte são seus. O {SITE.nome} não é parte desse negócio.
          </Item>
        </Lista>
      </>
    ),
  },
  {
    id: "uso-proibido",
    titulo: "O que não pode",
    corpo: (
      <>
        <P>Dentro do {SITE.nome}, e nas páginas geradas por ele, é proibido:</P>
        <Lista>
          <Item>
            Colocar dados de pagamento na página gerada (chave Pix, conta bancária, link de
            cobrança). O gerador recusa, e uma página com esses dados não é publicada.
          </Item>
          <Item>Se passar por outra marca, empresa ou pessoa, ou copiar conteúdo de terceiros.</Item>
          <Item>
            Anunciar atividade ilegal, conteúdo sexual, discurso de ódio, difamação ou dados
            pessoais de terceiros.
          </Item>
          <Item>
            Tentar burlar os limites do serviço: várias contas para repetir o bônus, automatizar o
            uso, raspar as buscas, ou contornar os limites por IP e por conta.
          </Item>
          <Item>
            Usar o serviço para prospecção em massa não solicitada que viole a lei aplicável, ou
            enviar mensagem a quem já pediu para não ser contatado.
          </Item>
          <Item>
            Revender, sublicenciar ou expor o acesso ao {SITE.nome} como se fosse serviço próprio.
            Revender os <em>sites</em> que você gera é justamente o uso esperado; revender o acesso à
            ferramenta, não.
          </Item>
        </Lista>
        <P>
          Descumprir esta seção permite suspender ou encerrar a conta, tirar páginas do ar e reter
          créditos ligados ao uso indevido, sem devolução.
        </P>
      </>
    ),
  },
  {
    id: "conteudo",
    titulo: "De quem é o que aparece na tela",
    corpo: (
      <>
        <Definicoes>
          <Definicao termo="O site gerado">
            É seu, e do cliente para quem você vender. Não reivindicamos direito sobre o HTML gerado
            nem cobramos nada para você usá-lo onde quiser.
          </Definicao>
          <Definicao termo="As fotos do Google">
            Não são nossas nem suas. Os termos do Google Maps Platform não permitem redistribuir
            essas imagens, então elas só aparecem enquanto o site está hospedado no {SITE.nome}. No
            download em arquivos elas saem, e no lugar vão espaços numerados para o dono pôr as
            fotos dele.
          </Definicao>
          <Definicao termo="O Pagefy">
            A plataforma, a marca, o código e o design são nossos. Você recebe o direito de usar o
            serviço enquanto a conta estiver ativa, e nada além disso.
          </Definicao>
          <Definicao termo="O que você envia">
            Imagens e textos que você manda no gerador continuam seus. Você nos dá apenas a
            permissão necessária para guardá-los e exibi-los no site que você mesmo está montando.
          </Definicao>
        </Definicoes>
      </>
    ),
  },
  {
    id: "disponibilidade",
    titulo: "Disponibilidade e mudanças no serviço",
    corpo: (
      <>
        <P>
          O {SITE.nome} é oferecido como está, sem garantia de funcionamento ininterrupto. Ele
          depende de serviços de terceiros (Google, Anthropic, Asaas, Vercel, Railway) e pode ficar
          indisponível por manutenção, falha desses serviços ou força maior.
        </P>
        <P>
          Podemos alterar, incluir ou retirar funções. Mudança que reduza de forma relevante o que
          você já pagou é avisada com pelo menos 30 dias de antecedência, por e-mail ou dentro do
          app, e nesse caso você pode cancelar e receber de volta a parte proporcional não usada.
        </P>
      </>
    ),
  },
  {
    id: "responsabilidade",
    titulo: "Limite de responsabilidade",
    corpo: (
      <>
        <P>
          Respondemos pelos danos diretos que causarmos, nos limites da lei brasileira, até o total
          que você pagou ao {SITE.nome} nos 12 meses anteriores ao fato. Nada aqui afasta direitos
          que o Código de Defesa do Consumidor garante a você.
        </P>
        <P>
          Não respondemos por lucro que você esperava e não teve, por venda que não fechou, por
          conteúdo que você publicou nas páginas geradas, nem pela relação entre você e o comércio
          que contratar o seu serviço.
        </P>
      </>
    ),
  },
  {
    id: "dados",
    titulo: "Dados pessoais",
    corpo: (
      <P>
        O que coletamos, por quê, com quem dividimos e por quanto tempo guardamos está na{" "}
        <A href="/privacidade">Política de Privacidade</A>, que faz parte destes Termos.
      </P>
    ),
  },
  {
    id: "alteracoes",
    titulo: "Alterações nestes Termos",
    corpo: (
      <P>
        Podemos alterar este documento. A data de atualização no topo sempre diz qual é a versão
        vigente, e mudança relevante é avisada por e-mail ou dentro do app com pelo menos 30 dias de
        antecedência. Continuar usando o serviço depois disso significa aceitar a versão nova; se não
        aceitar, você pode encerrar a conta.
      </P>
    ),
  },
  {
    id: "foro",
    titulo: "Lei aplicável e foro",
    corpo: (
      <P>
        Vale a lei brasileira. Fica eleito o foro da comarca de {OPERADOR.cidade}/{OPERADOR.uf} para
        resolver o que não se resolver por conversa, ressalvado o direito do consumidor de escolher o
        foro do seu próprio domicílio.
      </P>
    ),
  },
];

export default function TermosPage() {
  return (
    <LegalDocument
      titulo="Termos de uso"
      resumo="As regras do Pagefy em português comum: o que a ferramenta faz, quanto custa, o que acontece se você cancelar e o que é responsabilidade sua quando o site chega ao dono do comércio."
      atualizado={TERMOS_ATUALIZADO}
      essencial={[
        "O Pagefy encontra comércios sem site e monta a página de cada um. Quem vende é você: não prometemos venda, retorno nem faturamento.",
        "Tudo é pago em créditos, e o preço aparece na tela antes de qualquer ação que gaste.",
        "Você pode cancelar quando quiser, e tem sete dias de arrependimento em qualquer compra.",
        "A página gerada é uma proposta sua. Não se apresente como o dono do comércio, e tire o site do ar se ele pedir.",
      ]}
      secoes={SECOES}
      irmao={{ href: "/privacidade", label: "Política de Privacidade" }}
    />
  );
}
