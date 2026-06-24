interface BancoLogoProps {
  nome: string;
  size?: "sm" | "md";
}

interface BancoConfig {
  bg: string;
  text: string;
  label: string;
  logo: React.ReactNode;
}

function InterLogo() {
  return (
    <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
      <rect width="80" height="28" rx="4" fill="#FF6B00"/>
      <text x="8" y="10" fill="white" fontSize="7" fontWeight="300" fontFamily="Arial">BANCO</text>
      <text x="8" y="22" fill="white" fontSize="13" fontWeight="800" fontFamily="Arial" fontStyle="italic">inter</text>
    </svg>
  );
}

function NubankLogo() {
  return (
    <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
      <rect width="80" height="28" rx="4" fill="#820AD1"/>
      <text x="8" y="19" fill="white" fontSize="13" fontWeight="700" fontFamily="Arial">nu</text>
      <text x="26" y="19" fill="white" fontSize="10" fontWeight="400" fontFamily="Arial">bank</text>
    </svg>
  );
}

function PicPayLogo() {
  return (
    <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
      <rect width="80" height="28" rx="4" fill="#21C25E"/>
      <rect x="8" y="8" width="7" height="7" rx="1" fill="white"/>
      <rect x="10" y="10" width="3" height="3" rx="0.5" fill="#21C25E"/>
      <text x="20" y="19" fill="white" fontSize="11" fontWeight="700" fontFamily="Arial">PicPay</text>
    </svg>
  );
}

function C6Logo() {
  return (
    <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
      <rect width="80" height="28" rx="4" fill="#1A1A2E"/>
      <text x="12" y="20" fill="#FFD700" fontSize="14" fontWeight="800" fontFamily="Arial">C6</text>
      <text x="32" y="20" fill="white" fontSize="10" fontWeight="400" fontFamily="Arial">Bank</text>
    </svg>
  );
}

function ItauLogo() {
  return (
    <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
      <rect width="80" height="28" rx="4" fill="#003399"/>
      <text x="8" y="20" fill="#FF6600" fontSize="13" fontWeight="800" fontFamily="Arial">itaú</text>
    </svg>
  );
}

function BradescoLogo() {
  return (
    <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
      <rect width="80" height="28" rx="4" fill="#CC0000"/>
      <text x="5" y="20" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial">bradesco</text>
    </svg>
  );
}

function CaixaLogo() {
  return (
    <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
      <rect width="80" height="28" rx="4" fill="#0070AF"/>
      <text x="8" y="20" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial">CAIXA</text>
    </svg>
  );
}

function BancoBrasilLogo() {
  return (
    <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
      <rect width="80" height="28" rx="4" fill="#FFCC00"/>
      <text x="8" y="19" fill="#003087" fontSize="10" fontWeight="800" fontFamily="Arial">Banco</text>
      <text x="8" y="27" fill="#003087" fontSize="8" fontWeight="400" fontFamily="Arial">do Brasil</text>
    </svg>
  );
}

function SantanderLogo() {
  return (
    <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
      <rect width="80" height="28" rx="4" fill="#EC0000"/>
      <text x="5" y="20" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial">santander</text>
    </svg>
  );
}

function DefaultBancoLogo({ nome }: { nome: string }) {
  const initials = nome.slice(0, 2).toUpperCase();
  return (
    <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
      <rect width="80" height="28" rx="4" fill="#4B5563"/>
      <text x="8" y="20" fill="white" fontSize="11" fontWeight="700" fontFamily="Arial">{initials}</text>
      <text x="26" y="20" fill="#D1D5DB" fontSize="9" fontWeight="400" fontFamily="Arial">{nome.slice(0, 10)}</text>
    </svg>
  );
}

function detectBanco(nome: string): React.ReactNode {
  const n = nome.toLowerCase();
  if (n.includes("inter"))                          return <InterLogo />;
  if (n.includes("nubank") || n.includes("nu "))    return <NubankLogo />;
  if (n.includes("picpay"))                         return <PicPayLogo />;
  if (n.includes("c6"))                             return <C6Logo />;
  if (n.includes("itaú") || n.includes("itau"))     return <ItauLogo />;
  if (n.includes("bradesco"))                       return <BradescoLogo />;
  if (n.includes("caixa"))                          return <CaixaLogo />;
  if (n.includes("brasil") || n.includes("bb ") || n === "bb") return <BancoBrasilLogo />;
  if (n.includes("santander"))                      return <SantanderLogo />;
  return <DefaultBancoLogo nome={nome} />;
}

export function BancoLogo({ nome, size = "md" }: BancoLogoProps) {
  const altura = size === "sm" ? "h-6" : "h-7";
  return (
    <div className={`${altura} w-auto inline-flex shrink-0`} title={nome}>
      {detectBanco(nome)}
    </div>
  );
}
