
import tabHelper from "~services/tabHelper";

// chrome.runtime.sendMessage 转为 promise 用法
export function sendMessageByPromise<T>(payload: any) {
    return new Promise<T>((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(payload, (data) => {
          resolve(data);
        });
      } catch (error) {
        reject(error);
      }
    });
}
  
export async function sendCurrentTabMessage(payload: Record<string, any>) {
    console.log(payload);
    const tab = await tabHelper.getActiveTab(true);
    console.log(tab, 'tab');
    chrome.tabs.sendMessage(tab.id, payload);
}
  