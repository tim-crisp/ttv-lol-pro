import Bowser from "bowser";
import browser from "webextension-polyfill";
import $ from "../common/ts/$";
import {
  anonymizeIpAddress,
  anonymizeIpAddresses,
} from "../common/ts/anonymizeIpAddress";
import findChannelFromTwitchTvUrl from "../common/ts/findChannelFromTwitchTvUrl";
import isChannelWhitelisted from "../common/ts/isChannelWhitelisted";
import isChromium from "../common/ts/isChromium";
import store from "../store";
import type { StreamStatus } from "../types";

type WarningBannerType = "noProxies" | "limitedProxy";

//#region HTML Elements
const warningBannerNoProxiesElement = $(
  "#warning-banner-no-proxies"
) as HTMLDivElement;
const warningBannerLimitedProxyElement = $(
  "#warning-banner-limited-proxy"
) as HTMLDivElement;
const streamStatusElement = $("#stream-status") as HTMLDivElement;
const proxiedElement = $("#proxied") as HTMLDivElement;
const channelNameElement = $("#channel-name") as HTMLHeadingElement;
const reasonElement = $("#reason") as HTMLParagraphElement;
const infoContainerElement = $("#info-container") as HTMLDivElement;
const whitelistStatusElement = $("#whitelist-status") as HTMLDivElement;
const whitelistToggleElement = $("#whitelist-toggle") as HTMLInputElement;
const copyDebugInfoButtonElement = $(
  "#copy-debug-info-button"
) as HTMLButtonElement;
const copyDebugInfoButtonDescriptionElement = $(
  "#copy-debug-info-button-description"
) as HTMLParagraphElement;
//#endregion

if (store.readyState === "complete") main();
else store.addEventListener("load", main);

async function main() {
  const proxies = store.state.optimizedProxiesEnabled
    ? store.state.optimizedProxies
    : store.state.normalProxies;

  // TODO: Is this code still needed?
  const isLimitedProxy = false;
  if (proxies.length === 0) {
    setWarningBanner("noProxies");
  } else if (isLimitedProxy) {
    setWarningBanner("limitedProxy");
  }

  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  if (!activeTab || !activeTab.url) return;

  const channelName = findChannelFromTwitchTvUrl(activeTab.url);
  if (!channelName) return;

  setStreamStatusElement(channelName);
  store.addEventListener("change", () => setStreamStatusElement(channelName));
}

function setWarningBanner(type: WarningBannerType) {
  if (type === "noProxies") {
    warningBannerNoProxiesElement.style.display = "block";
    warningBannerLimitedProxyElement.style.display = "none";
  } else if (type === "limitedProxy") {
    warningBannerNoProxiesElement.style.display = "none";
    warningBannerLimitedProxyElement.style.display = "block";
  }
}

function setStreamStatusElement(channelName: string) {
  const channelNameLower = channelName.toLowerCase();
  const status = store.state.streamStatuses[channelNameLower];
  if (status) {
    setProxyStatus(channelNameLower, status);
    setWhitelistStatus(channelNameLower);
    streamStatusElement.style.display = "flex";
  } else {
    streamStatusElement.style.display = "none";
  }
}

function setProxyStatus(channelNameLower: string, status: StreamStatus) {
  const isWhitelisted = isChannelWhitelisted(channelNameLower);
  // Proxied
  if (status.proxied) {
    proxiedElement.classList.remove("error");
    proxiedElement.classList.remove("idle");
    proxiedElement.classList.add("success");
    proxiedElement.title = "Last request proxied";
  } else if (
    !status.proxied &&
    status.proxyHost &&
    store.state.optimizedProxiesEnabled &&
    store.state.optimizedProxies.length > 0 &&
    !isWhitelisted
  ) {
    proxiedElement.classList.remove("error");
    proxiedElement.classList.remove("success");
    proxiedElement.classList.add("idle");
    proxiedElement.title = "Idle (optimized proxies enabled)";
  } else {
    proxiedElement.classList.remove("success");
    proxiedElement.classList.remove("idle");
    proxiedElement.classList.add("error");
    proxiedElement.title = "Last request not proxied";
  }
  // Channel name
  channelNameElement.textContent = channelNameLower;
  // Reason
  if (status.reason) {
    reasonElement.textContent = status.reason;
    reasonElement.style.display = "";
  } else {
    reasonElement.style.display = "none";
  }
  // Info
  let messages = [];
  if (status.proxyHost) {
    messages.push(`Proxy: ${anonymizeIpAddress(status.proxyHost)}`);
  }
  if (status.proxyCountry) {
    messages.push(`Country: ${status.proxyCountry}`);
  }
  if (store.state.optimizedProxiesEnabled) {
    messages.push("Using optimized proxies");
  }
  infoContainerElement.innerHTML = "";
  infoContainerElement.style.display = "none";
  for (const message of messages) {
    const smallElement = document.createElement("small");
    smallElement.textContent = message;
    smallElement.className = "info";
    infoContainerElement.appendChild(smallElement);
    infoContainerElement.style.display = "flex";
  }
}

function setWhitelistStatus(channelNameLower: string) {
  const whitelistedChannelsLower = store.state.whitelistedChannels.map(id =>
    id.toLowerCase()
  );
  const isWhitelisted = whitelistedChannelsLower.includes(channelNameLower);
  whitelistStatusElement.setAttribute("data-whitelisted", `${isWhitelisted}`);
  whitelistToggleElement.checked = isWhitelisted;
  whitelistToggleElement.addEventListener("change", e => {
    const target = e.target as HTMLInputElement;
    const isWhitelisted = target.checked;
    if (isWhitelisted) {
      // Add channel name to whitelist.
      store.state.whitelistedChannels.push(channelNameLower);
    } else {
      // Remove channel name from whitelist.
      store.state.whitelistedChannels = store.state.whitelistedChannels.filter(
        id => id !== channelNameLower
      );
    }
    whitelistStatusElement.setAttribute("data-whitelisted", `${isWhitelisted}`);
    browser.tabs.reload();
  });
}

copyDebugInfoButtonElement.addEventListener("click", async e => {
  const extensionInfo = await browser.management.getSelf();
  const userAgentParser = Bowser.getParser(window.navigator.userAgent);

  const debugInfo = [
    `${extensionInfo.name} v${extensionInfo.version}`,
    `- Install type: ${extensionInfo.installType}`,
    `- Browser: ${userAgentParser.getBrowserName()} ${userAgentParser.getBrowserVersion()}`,
    `- OS: ${userAgentParser.getOSName()} ${userAgentParser.getOSVersion()}`,
    `- Passport level: ${store.state.passportLevel}`,
    `- Anonymous mode: ${store.state.anonymousMode}`,
    `- Optimized proxies enabled: ${store.state.optimizedProxiesEnabled}`,
    `- Optimized proxies: ${JSON.stringify(
      e.shiftKey
        ? store.state.optimizedProxies
        : anonymizeIpAddresses(store.state.optimizedProxies)
    )}`,
    `- Normal proxies: ${JSON.stringify(
      e.shiftKey
        ? store.state.normalProxies
        : anonymizeIpAddresses(store.state.normalProxies)
    )}`,
    isChromium
      ? `- Should extension be active: ${store.state.chromiumProxyActive}`
      : "",
    isChromium
      ? `- Number of opened Twitch tabs: ${store.state.openedTwitchTabs.length}`
      : "",
    `- Last ad log entry: ${
      store.state.adLog.length
        ? JSON.stringify({
            ...store.state.adLog[store.state.adLog.length - 1],
            videoWeaverUrl: undefined,
          })
        : "N/A"
    }`,
  ].join("\n");

  try {
    await navigator.clipboard.writeText(debugInfo);
    copyDebugInfoButtonDescriptionElement.textContent = "Copied to clipboard!";
  } catch (error) {
    console.error(error);
    copyDebugInfoButtonDescriptionElement.textContent =
      "Failed to copy to clipboard.";
  }
});
