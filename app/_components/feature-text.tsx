// Linha de vantagem dos planos: o que vem entre **asteriscos** (os números,
// o que diferencia o plano) ganha peso e cor cheia; o resto fica no tom normal.
export function FeatureText({ text, strongClassName }: { text: string; strongClassName: string }) {
  return (
    <>
      {text.split("**").map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className={`font-semibold ${strongClassName}`}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
