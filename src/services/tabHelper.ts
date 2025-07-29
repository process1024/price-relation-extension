export const isBackgroundScript = () => {
  return typeof window === "undefined";
};

const getActiveTab = (isBgScript?: boolean): Promise<chrome.tabs.Tab> =>
  new Promise((res, rej) => {
    try {
      if (isBgScript) {
        chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
          res(activeTab);
        });
      } else {
        chrome.runtime.sendMessage({ type: "getActiveTab" }, (activeTab: chrome.tabs.Tab) => {
          res(activeTab);
        });
      }
    } catch (error) {
      rej(error);
    }
  });

export function updateTab(url) {
  chrome.tabs.update({ url });
}

export function createTab(url) {
  chrome.tabs.create({ url });
}

export default { getActiveTab, isBackgroundScript, updateTab, createTab };
