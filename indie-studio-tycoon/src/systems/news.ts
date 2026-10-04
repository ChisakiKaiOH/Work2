import type { NewsCategory, NewsItem } from "../types";
import { createId } from "../utils/id";

export const NEWS_FEED_MAX = 60;

export function makeNews(month: number, headline: string, category: NewsCategory): NewsItem {
  return { id: createId("news"), month, headline, category };
}

export function newsForRivalRelease(companyName: string, gameName: string, month: number): NewsItem {
  return makeNews(month, `${companyName} pubblica "${gameName}"`, "Industry");
}

export function newsForCompetitorBankruptcy(companyName: string, month: number): NewsItem {
  return makeNews(month, `${companyName} dichiara bancarotta e chiude i battenti`, "Market");
}

export function newsForRivalAcquisition(acquirerName: string, targetName: string, month: number): NewsItem {
  return makeNews(month, `${acquirerName} acquisisce ${targetName}`, "Acquisition");
}

export function newsForPlayerAcquisition(studioName: string, targetName: string, month: number): NewsItem {
  return makeNews(month, `${studioName} acquisisce ${targetName}`, "Acquisition");
}

export function newsForMarketTrend(label: string, month: number): NewsItem {
  return makeNews(month, `Tendenze di mercato: ${label}`, "Market");
}

export function newsForAwardWin(studioName: string, gameName: string, categoryLabel: string, month: number): NewsItem {
  return makeNews(month, `"${gameName}" di ${studioName} vince ${categoryLabel} ai Global Game Awards`, "Awards");
}

export function newsForRivalAwardWin(companyName: string, gameName: string, categoryLabel: string, month: number): NewsItem {
  return makeNews(month, `"${gameName}" di ${companyName} vince ${categoryLabel} ai Global Game Awards`, "Awards");
}

export function newsForPlayerTopTen(studioName: string, month: number): NewsItem {
  return makeNews(month, `${studioName} entra nella TOP 10 mondiale degli studi di sviluppo`, "Studio");
}

export function newsForGlobalEvent(headline: string, month: number): NewsItem {
  return makeNews(month, headline, "Market");
}

export function trimNews(news: NewsItem[]): NewsItem[] {
  return news.slice(-NEWS_FEED_MAX);
}
