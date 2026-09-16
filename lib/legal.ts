/**
 * Identificação de quem opera o Pagefy e datas dos documentos legais.
 *
 * Fica num arquivo só porque os Termos e a Política de Privacidade repetem os
 * mesmos dados, e porque virar CNPJ depois é mudar aqui e mais nada.
 *
 * O Decreto 7.962/2013 (comércio eletrônico) exige nome e CPF/CNPJ visíveis no
 * site, e a LGPD exige o controlador identificado na política — por isso estes
 * dados aparecem nos dois documentos.
 */
export const OPERADOR = {
  /** Nome civil completo de quem responde pelo serviço. */
  nome: "André Pieri",
  /** Já formatado: é assim que aparece nos dois documentos. */
  cpf: "000.000.000-00",
  /** Cidade e UF do domicílio, usada também no foro dos Termos. */
  cidade: "Dourados",
  uf: "MS",
  /** Caixa única; suporte@, privacidade@ e contato@ chegam todas nela. */
  email: "contato@pagefy.app",
} as const;

export const SITE = {
  nome: "Pagefy",
  dominio: "pagefy.app",
  url: "https://pagefy.app",
} as const;

/** Data da última alteração de cada documento, em ISO e por extenso. */
export const TERMOS_ATUALIZADO = { iso: "2026-09-15", extenso: "15 de setembro de 2026" } as const;
export const PRIVACIDADE_ATUALIZADO = { iso: "2026-09-15", extenso: "15 de setembro de 2026" } as const;

/** "André Pieri, CPF 000.000.000-00, em Dourados/MS" — usado nos dois documentos. */
export const QUEM_OPERA = `${OPERADOR.nome}, inscrito no CPF sob o nº ${OPERADOR.cpf}, com domicílio em ${OPERADOR.cidade}/${OPERADOR.uf}`;
