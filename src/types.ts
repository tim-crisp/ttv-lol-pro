// From https://stackoverflow.com/a/51419293
export type KeyOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: any;
};

// From https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/proxy/ProxyInfo
export interface ProxyInfo {
  type: "direct" | "http" | "https" | "socks" | "socks4";
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  proxyDNS?: boolean;
  failoverTimeout?: number;
  proxyAuthorizationHeader?: string;
  connectionIsolationKey?: string;
}

export const enum AdType {
  PREROLL = "preroll",
  MIDROLL = "midroll",
}

export interface AdLogEntry {
  adType: AdType;
  channel: string | null;
  isPurpleScreen: boolean;
  proxy: string | null;
  passportLevel: number;
  anonymousMode: boolean;
  timestamp: number;
  videoWeaverHost: string;
  videoWeaverUrl: string;
}

export interface StreamStatus {
  proxied: boolean;
  proxyHost?: string;
  proxyCountry?: string;
  reason: string;
  stats?: {
    proxied: number;
    notProxied: number;
  };
}

export interface DnsResponse {
  host: string;
  ips: string[];
  timestamp: number;
  ttl: number;
}

export const enum MessageType {
  ContentScriptMessage = "TLP_ContentScriptMessage",
  PageScriptMessage = "TLP_PageScriptMessage",
  WorkerScriptMessage = "TLP_WorkerScriptMessage",
  GetStoreState = "TLP_GetStoreState",
  GetStoreStateResponse = "TLP_GetStoreStateResponse",
  EnableFullMode = "TLP_EnableFullMode",
  EnableFullModeResponse = "TLP_EnableFullModeResponse",
  DisableFullMode = "TLP_DisableFullMode",
  UsherResponse = "TLP_UsherResponse",
  NewPlaybackAccessToken = "TLP_NewPlaybackAccessToken",
  NewPlaybackAccessTokenResponse = "TLP_NewPlaybackAccessTokenResponse",
  ClearStats = "TLP_ClearStats",
}

export const enum ProxyRequestType {
  Passport = "TLP_Passport",
  Usher = "TLP_Usher",
  VideoWeaver = "TLP_VideoWeaver",
  GraphQL = "TLP_GraphQL",
  GraphQLToken = "TLP_GraphQLToken",
  GraphQLIntegrity = "TLP_GraphQLIntegrity",
  TwitchWebpage = "TLP_TwitchWebpage",
}

export type ProxyRequestParams =
  | {
      isChromium: true;
      optimizedProxiesEnabled: boolean;
      passportLevel: number;
      fullModeEnabled?: boolean;
    }
  | {
      isChromium: false;
      optimizedProxiesEnabled: boolean;
      passportLevel: number;
      isFlagged?: boolean;
    };
