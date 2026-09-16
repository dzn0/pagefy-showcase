"use client";

import { useEffect, useRef, useState } from "react";

// Uma tela do gerador (notebook ou celular), na largura real do aparelho.
//
// O HTML é escrito aos poucos, conforme a IA manda, por document.write no
// próprio iframe, que é sandbox só com scripts (origem opaca): o site gerado
// roda isolado e não alcança o app nem o localStorage dele. document.open()
// apaga os listeners da janela, então o de mensagens se registra de novo
// logo depois de cada abertura.
//
// Links: o documento escrito herda a URL do app (/app/sites/<slug>), então um
// href="#sobre" ou "/contato" carregaria o próprio app dentro da prévia (e ele,
// sem login no iframe isolado, fica em "Redirecionando…"). O clique é
// interceptado: âncora rola até a seção, link do mesmo endereço não sai do
// lugar, link de fora abre em outra aba. tel:, mailto: etc. seguem normais.
const BOOT = `<!doctype html><html><head><style>html,body{margin:0;background:#fff}</style></head><body><script>
var y=0;
function c(e){
var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;if(!a||e.defaultPrevented)return;
var r=a.getAttribute("href")||"";
if(r.charAt(0)==="#"){e.preventDefault();var id=r.slice(1);try{id=decodeURIComponent(id)}catch(_){}
var el=id?(document.getElementById(id)||document.getElementsByName(id)[0]):null;
if(el)el.scrollIntoView({behavior:"smooth",block:"start"});else if(!id||id==="top"||id==="inicio")scrollTo({top:0,behavior:"smooth"});return;}
if(a.protocol!=="http:"&&a.protocol!=="https:")return;
e.preventDefault();
if(a.host!==location.host)window.open(a.href,"_blank","noopener");}
function on(){addEventListener("message",h);document.addEventListener("click",c);}
function h(e){var d=e.data||{};
if(d.t==="open"){y=d.keep?window.scrollY:0;document.open();on();}
else if(d.t==="write"){document.write(d.s);}
else if(d.t==="close"){document.close();if(y)setTimeout(function(){scrollTo(0,y)},80);}}
on();
parent.postMessage({pfPreviewReady:true},"*");
</script></body></html>`;

export type PreviewDoc = {
  /** Muda quando começa um documento novo (site novo ou edição aplicada). */
  key: number;
  html: string;
  /** Ainda chegando: não fecha o documento. */
  streaming: boolean;
  /** Mantém a rolagem (edição do mesmo site). */
  keepScroll?: boolean;
};

// Preenche a caixa em tamanho real (a moldura do aparelho reduz tudo junto).
export function PreviewFrame({ doc, title }: { doc: PreviewDoc | null; title: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(0);
  const written = useRef({ key: -1, len: 0, closed: true });

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source === frameRef.current?.contentWindow && (event.data as { pfPreviewReady?: boolean })?.pfPreviewReady) {
        // Iframe (re)carregado: tudo precisa ser escrito de novo.
        written.current = { key: -1, len: 0, closed: true };
        setReady((n) => n + 1);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const target = frameRef.current?.contentWindow;
    if (!ready || !target || !doc) return;
    const post = (message: object) => target.postMessage(message, "*");
    if (doc.key !== written.current.key) {
      post({ t: "open", keep: doc.keepScroll ?? false });
      written.current = { key: doc.key, len: 0, closed: false };
    }
    const current = written.current;
    if (doc.html.length > current.len) {
      post({ t: "write", s: doc.html.slice(current.len) });
      current.len = doc.html.length;
    }
    if (!doc.streaming && !current.closed) {
      post({ t: "close" });
      current.closed = true;
    }
  }, [doc, ready]);

  return (
    <iframe
      ref={frameRef}
      title={title}
      srcDoc={BOOT}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      className="block size-full border-0 bg-(--os-screen)"
      style={{ visibility: doc ? "visible" : "hidden" }}
    />
  );
}
