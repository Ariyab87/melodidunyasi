import { HttpsProxyAgent } from "https-proxy-agent";

export function getProxyAgent() {
  if (process.env.PROXY_URL) {
    console.log('🔍 [PROXY] Using proxy:', process.env.PROXY_URL);
    return new HttpsProxyAgent(process.env.PROXY_URL);
  }
  console.log('🔍 [PROXY] No proxy configured');
  return undefined;
}

export function getProxyInfo() {
  return {
    configured: !!process.env.PROXY_URL,
    url: process.env.PROXY_URL || null,
    agent: getProxyAgent()
  };
}
