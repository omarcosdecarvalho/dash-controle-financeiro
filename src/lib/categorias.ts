export const CATEGORIAS = [
  { value: "alimentacao",   label: "Alimentação",    cor: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "transporte",    label: "Transporte",     cor: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "saude",         label: "Saúde",          cor: "bg-red-100 text-red-800 border-red-200" },
  { value: "assinaturas",   label: "Assinaturas",    cor: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "lazer",         label: "Lazer",          cor: "bg-pink-100 text-pink-800 border-pink-200" },
  { value: "moradia",       label: "Moradia",        cor: "bg-green-100 text-green-800 border-green-200" },
  { value: "vestuario",     label: "Vestuário",      cor: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "educacao",      label: "Educação",       cor: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { value: "financeiro",    label: "Financeiro",     cor: "bg-slate-100 text-slate-800 border-slate-200" },
  { value: "outros",        label: "Outros",         cor: "bg-gray-100 text-gray-700 border-gray-200" },
] as const;

export type CategoriaValue = typeof CATEGORIAS[number]["value"];

export function getCategoriaInfo(value: string) {
  return CATEGORIAS.find(c => c.value === value) ?? CATEGORIAS[CATEGORIAS.length - 1];
}

// Fallback por palavras-chave quando não há API key
const REGRAS: Array<{ categoria: CategoriaValue; termos: string[] }> = [
  {
    categoria: "alimentacao",
    termos: [
      "ifood", "rappi", "mcdonalds", "mcdonald", "burger", "pizza", "restaurante",
      "lanchonete", "padaria", "mercado", "supermercado", "hortifruti", "açougue",
      "pao de acucar", "extra", "carrefour", "atacadao", "assai", "sams club",
      "armazem", "mercearia", "bar ", "boteco", "churrascaria", "sushi", "delivery",
      "subway", "bob's", "habib", "domino", "bobs", "giraffas", "outback",
    ],
  },
  {
    categoria: "transporte",
    termos: [
      "uber", "99pop", "cabify", "lyft", "taxi", "onibus", "metro", "trem",
      "combustivel", "gasolina", "etanol", "posto ", "shell", "ipiranga", "br distribuidora",
      "petrobrás", "estacionamento", "parking", "pedagio", "sem parar", "veloe",
      "autopass", "move", "brt", "bilhete", "sptrans", "emtu",
    ],
  },
  {
    categoria: "saude",
    termos: [
      "farmacia", "drogaria", "drogasil", "pacheco", "droga", "ultrafarma",
      "medico", "hospital", "clinica", "laboratorio", "exame", "consulta",
      "odonto", "dentista", "plano de saude", "unimed", "amil", "bradesco saude",
      "sulamerica", "hapvida", "fisio", "terapia", "psicologo", "psiquiatra",
    ],
  },
  {
    categoria: "assinaturas",
    termos: [
      "netflix", "spotify", "amazon prime", "disney", "hbo", "paramount",
      "apple", "microsoft", "google one", "youtube", "twitch", "crunchyroll",
      "globoplay", "telecine", "deezer", "adobe", "github", "heroku",
      "aws ", "azure", "digitalocean", "dropbox", "icloud", "chatgpt", "openai",
      "antivirus", "norton", "kaspersky", "avast", "clear sale",
    ],
  },
  {
    categoria: "lazer",
    termos: [
      "cinema", "teatro", "show", "ingresso", "ticketmaster", "eventim",
      "sympla", "clube", "academia", "smartfit", "bluefit", "bio ritmo",
      "jogo", "steam", "playstation", "xbox", "nintendo", "epic games",
      "livraria", "saraiva", "cultura", "submarino", "americanas",
      "viagem", "hotel", "airbnb", "booking", "decolar", "passagem", "latam", "gol ", "azul",
    ],
  },
  {
    categoria: "moradia",
    termos: [
      "aluguel", "condominio", "iptu", "luz ", "energia", "enel", "cemig",
      "copel", "celpe", "agua ", "saneamento", "sabesp", "embasa",
      "gas ", "comgas", "net ", "claro", "vivo", "tim ", "oi ", "internet",
      "telefone", "seguro residencial", "reforma", "material de construcao",
      "leroy", "telhanorte", "castorama",
    ],
  },
  {
    categoria: "vestuario",
    termos: [
      "zara", "renner", "riachuelo", "c&a", "cea", "marisa", "hering",
      "track ", "farm ", "arezzo", "anacapri", "nike", "adidas", "puma",
      "roupas", "calcado", "sapato", "tenis", "sandalia", "bolsa",
      "moda", "fashion", "le biscuit",
    ],
  },
  {
    categoria: "educacao",
    termos: [
      "escola", "colegio", "faculdade", "universidade", "cursinho",
      "alura", "udemy", "coursera", "duolingo", "lingoda",
      "material escolar", "apostila", "livro", "mensalidade escolar",
      "cfc", "autoescola",
    ],
  },
  {
    categoria: "financeiro",
    termos: [
      "parcela", "emprestimo", "financiamento", "credito", "debito",
      "anuidade", "tarifa", "juros", "seguro ", "previdencia",
      "investimento", "corretora", "xp ", "rico ", "nubank", "inter ",
      "bradesco", "itau", "santander", "caixa", "bb ", "banco do brasil",
      "sicoob", "sicredi", "cooperativa",
    ],
  },
];

export function categorizarPorKeyword(descricao: string): CategoriaValue {
  const texto = descricao.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const regra of REGRAS) {
    for (const termo of regra.termos) {
      if (texto.includes(termo)) return regra.categoria;
    }
  }
  return "outros";
}
