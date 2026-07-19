import { DEFAULT_LOCALE, Locale } from "../config/env";

type Dict = Record<string, string>;

// Flat dotted keys keep lookup simple; params are {name} style.
const en: Dict = {
  "errors.unauthorized": "You need to sign in to do that.",
  "errors.forbidden": "You do not have access to this resource.",
  "errors.notFound": "Not found.",
  "errors.validation": "Some of the information is invalid.",
  "errors.internal": "Something went wrong on our side. Please try again.",
  "errors.emailInUse": "That email is already registered.",
  "errors.invalidCredentials": "Wrong email or password.",
  "errors.tokenInvalid": "Your session is invalid. Please sign in again.",
  "errors.tokenExpired": "Your session expired. Please sign in again.",
  "errors.rateLimited": "Too many requests. Please slow down.",
  "errors.queryQuota": "You have reached today's question limit ({cap}). Try again tomorrow.",
  "errors.ingestQuota": "You have reached today's upload limit ({cap}). Try again tomorrow.",
  "errors.fileTooLarge": "That file is too large. The limit is {mb} MB.",
  "errors.unsupportedType": "That file type is not supported.",
  "errors.emptyDocument": "We could not read any text from that source.",
  "errors.docTooLarge": "That document is too long. The limit is {chars} characters.",
  "errors.kbNotFound": "Knowledge base not found.",
  "errors.docNotFound": "Document not found.",
  "errors.sessionNotFound": "Conversation not found.",
  "errors.widgetDisabled": "This assistant is not available.",
  "errors.llmUnavailable": "The assistant is temporarily unavailable. Please try again.",
  "errors.badUrl": "That URL could not be fetched.",
  "chat.noAnswer":
    "I could not find an answer to that in these documents.",
};

const es: Dict = {
  "errors.unauthorized": "Debes iniciar sesion para hacer eso.",
  "errors.forbidden": "No tienes acceso a este recurso.",
  "errors.notFound": "No encontrado.",
  "errors.validation": "Parte de la informacion no es valida.",
  "errors.internal": "Algo salio mal de nuestro lado. Intentalo de nuevo.",
  "errors.emailInUse": "Ese correo ya esta registrado.",
  "errors.invalidCredentials": "Correo o contrasena incorrectos.",
  "errors.tokenInvalid": "Tu sesion no es valida. Inicia sesion de nuevo.",
  "errors.tokenExpired": "Tu sesion expiro. Inicia sesion de nuevo.",
  "errors.rateLimited": "Demasiadas solicitudes. Ve mas despacio.",
  "errors.queryQuota": "Alcanzaste el limite de preguntas de hoy ({cap}). Intenta manana.",
  "errors.ingestQuota": "Alcanzaste el limite de cargas de hoy ({cap}). Intenta manana.",
  "errors.fileTooLarge": "Ese archivo es muy grande. El limite es {mb} MB.",
  "errors.unsupportedType": "Ese tipo de archivo no es compatible.",
  "errors.emptyDocument": "No pudimos leer texto de esa fuente.",
  "errors.docTooLarge": "Ese documento es muy largo. El limite es {chars} caracteres.",
  "errors.kbNotFound": "Base de conocimiento no encontrada.",
  "errors.docNotFound": "Documento no encontrado.",
  "errors.sessionNotFound": "Conversacion no encontrada.",
  "errors.widgetDisabled": "Este asistente no esta disponible.",
  "errors.llmUnavailable": "El asistente no esta disponible por ahora. Intentalo de nuevo.",
  "errors.badUrl": "No se pudo acceder a esa URL.",
  "chat.noAnswer": "No encontre una respuesta a eso en estos documentos.",
};

const pt: Dict = {
  "errors.unauthorized": "Voce precisa entrar para fazer isso.",
  "errors.forbidden": "Voce nao tem acesso a este recurso.",
  "errors.notFound": "Nao encontrado.",
  "errors.validation": "Algumas informacoes sao invalidas.",
  "errors.internal": "Algo deu errado do nosso lado. Tente novamente.",
  "errors.emailInUse": "Esse e-mail ja esta cadastrado.",
  "errors.invalidCredentials": "E-mail ou senha incorretos.",
  "errors.tokenInvalid": "Sua sessao e invalida. Entre novamente.",
  "errors.tokenExpired": "Sua sessao expirou. Entre novamente.",
  "errors.rateLimited": "Muitas solicitacoes. Va mais devagar.",
  "errors.queryQuota": "Voce atingiu o limite de perguntas de hoje ({cap}). Tente amanha.",
  "errors.ingestQuota": "Voce atingiu o limite de envios de hoje ({cap}). Tente amanha.",
  "errors.fileTooLarge": "Esse arquivo e muito grande. O limite e {mb} MB.",
  "errors.unsupportedType": "Esse tipo de arquivo nao e suportado.",
  "errors.emptyDocument": "Nao conseguimos ler texto dessa fonte.",
  "errors.docTooLarge": "Esse documento e muito longo. O limite e {chars} caracteres.",
  "errors.kbNotFound": "Base de conhecimento nao encontrada.",
  "errors.docNotFound": "Documento nao encontrado.",
  "errors.sessionNotFound": "Conversa nao encontrada.",
  "errors.widgetDisabled": "Este assistente nao esta disponivel.",
  "errors.llmUnavailable": "O assistente esta indisponivel no momento. Tente novamente.",
  "errors.badUrl": "Nao foi possivel acessar essa URL.",
  "chat.noAnswer": "Nao encontrei uma resposta para isso nestes documentos.",
};

const catalogs: Record<Locale, Dict> = { en, es, pt };

export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const dict = catalogs[locale] ?? catalogs[DEFAULT_LOCALE];
  let msg = dict[key] ?? catalogs[DEFAULT_LOCALE][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return msg;
}
