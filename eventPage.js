//#region globals
const REPO_MAP_LOCAL_STORAGE_KEY = 'repoMap';
const GITHUB_COM = 'github.com';
const GITHUB_DEV = 'github.dev';
const VSCODE_DEV = 'vscode.dev';
const INSIDERS_VSCODE_DEV = 'insiders.vscode.dev';
const invalidGitHubRepositoryOwners = [
  'blog',
  'explore',
  'showcases',
  'trending',
  'stars',
  'contact',
  'about',
  'orgs',
  'codespaces',
  'settings',
  'marketplace',
  'pulls',
  'issues',
  'notifications',
  'account',
  'discussions',
  'sponsors',
  'login',
  'auth',
  'codesearch',
  'enterprise',
  'enterprises',
  'security',
  'team',
  'customer-stories',
  'readme',
  'pricing',
  'features'
];
let defaultSuggestionURL = '';

//#endregion

//#region URL transformation helpers

function redirect(tab) {
  const url = dotComToDotDev(tab.url);
  chrome.tabs.update({ url: url !== undefined ? url.toString() : `https://${INSIDERS_VSCODE_DEV}` });
}

function dotComToDotDev(url) {
  try {
    url = new URL(url);
    if (url.hostname.endsWith(GITHUB_COM)) {
      url.hostname = INSIDERS_VSCODE_DEV;
      url.pathname = `/github${url.pathname}`;
      return url.toString();
    }
  } catch {}
  return undefined;
}

function shouldRedirect(url) {
  try {
    const parser = new URL(url);
    // Do not redirect to vscode.dev if we are already on vscode.dev, github.dev, or Codespaces
    return !parser.hostname.endsWith(GITHUB_DEV) && !parser.hostname.endsWith(VSCODE_DEV);
  } catch {
    return false;
  }
}

function parseRepoFromUrl(url) {
  let owner, repoName, fullName;

  try {
    const parser = new URL(url);

    if (parser.hostname == GITHUB_COM || (parser.hostname === GITHUB_DEV)) {
      var paths = parser.pathname.split('/');
      if (paths.length >= 3) {
        owner = paths[1];
        repoName = paths[2];
        fullName = owner + '/' + repoName;
      }
    } else if (parser.hostname === VSCODE_DEV || parser.hostname === INSIDERS_VSCODE_DEV) {
      var paths = parser.pathname.split('/');
      if (paths[1] === 'github' && paths.length >= 4) {
        owner = paths[2];
        repoName = paths[3];
        fullName = owner + '/' + repoName;
      }
    }
  } catch {}

  return { owner, repoName, fullName };
}

//#endregion

//#region Helpers for suggesting recently-visited GitHub repos

// Build a hashmap of accessed repos
function buildRepoMap(cb) {
  chrome.history.search({
    text: 'github',
    startTime: 0,
    maxResults: 1000000
  }, function(hits) {
      var repoMap = {};

      hits.forEach((hit) => {
        const { owner, repoName, fullName } = parseRepoFromUrl(hit.url);
        if (!owner || !repoName || !fullName) {
          return;
        }

        addRepoToMap(repoMap, owner, repoName, fullName);
      });

      cb(repoMap);
  });
}

// After building repoMap, set it in local storage
function buildAndSetRepoMap() {
  buildRepoMap(function(repoMap) {
    chrome.storage.local.set({ repoMap: repoMap }, function() {
      console.log('RepoMap built successfully');
    });
  });
}

function addRepoToMap(repoMap, owner, repoName, fullName) {
  fullName = fullName.toLowerCase();
  if (!repoMap[fullName] && !invalidGitHubRepositoryOwners.includes(owner)) {
    repoMap[fullName] = {
      url: 'https://github.com/' + fullName,
      owner: owner,
      repoName: repoName
    }
    return true;
  }

  return false;
}

//#endregion

//#region Chrome extension API event listeners
chrome.action.onClicked.addListener((tab) => redirect(tab));

chrome.commands.onCommand.addListener((command) => {
  if (command === "launchVSCode") {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && shouldRedirect(tab.url)) {
        redirect(tab);
      }
    });
  }
});

chrome.runtime.onStartup.addListener(buildAndSetRepoMap);
chrome.runtime.onInstalled.addListener(buildAndSetRepoMap);

chrome.omnibox.onDeleteSuggestion.addListener(function(text) {
  chrome.storage.local.get(REPO_MAP_LOCAL_STORAGE_KEY, function(storageObj) {
    const repoMap = storageObj.repoMap;
    delete repoMap[text];
    chrome.storage.local.set({ repoMap: repoMap }, function() {
      console.log('RepoMap updated successfully in local storage');
    });
  })
});

chrome.omnibox.onInputChanged.addListener(function(input, suggest) {
  input = input.trim().toLowerCase();

  const isSingleKeyword = input.split(' ').length === 1 && input !== '';

  chrome.storage.local.get(REPO_MAP_LOCAL_STORAGE_KEY, function(storageObj) {
    // Go through repoMap, find suggestions based on keyword
    var repoMap = storageObj.repoMap ?? {};
    var suggestions = [];

    for (const fullName in repoMap) {
      const repo = repoMap[fullName];
      const suggestion = {
        content: dotComToDotDev(repo.url),
        description: fullName,
        deletable: true
      };

      // See if we have multiple or just a single keyword
      if (isSingleKeyword) {
        // Single keyword
        const keyword = input.trim().toLowerCase();

        // Put exact match in the front of suggestions
        if (repo.repoName.toLowerCase() == keyword) {
          suggestions.unshift(suggestion);
        } else if (fullName.toLowerCase().includes(keyword)) {
          suggestions.push(suggestion);
        }
      } else {
        // Multiple keywords
        const keywords = input.trim().toLowerCase().split(' ');

        const inFullName = function(keyword) {
          return fullName.toLowerCase().includes(keyword);
        };

        if (keywords.filter((keyword) => !inFullName(keyword)).length === 0) {
          suggestions.push(suggestion);
        }
      }
    }

    // Use the first suggestion as default
    let defaultSuggestionDescription;
    if (suggestions.length > 0) {
      defaultSuggestionDescription = '<match>' + suggestions[0].description + '</match>';
      defaultSuggestionURL = suggestions[0].content;
      suggestions = suggestions.slice(1);
    } else if (isSingleKeyword && input.split('/').filter((segment) => segment.trim() !== '').length === 2) {
      const url = 'https://insiders.vscode.dev/github/' + input;
      defaultSuggestionDescription = '<match>Open ' + url + '"</match>';
      defaultSuggestionURL = url;
    } else {
      defaultSuggestionDescription = '<match>No match found. Search GitHub with "' +
                                     input + '"</match>';
      defaultSuggestionURL = 'https://github.com/search?q=' + input.replace(' ', '+');
    }

    chrome.omnibox.setDefaultSuggestion({
      description: defaultSuggestionDescription
    });

    suggest(suggestions);
  });
});

chrome.omnibox.onInputEntered.addListener(function(input) {
  let url; 

  if (input === undefined) {
    // Launch root vscode.dev instance, equivalent to typing `code` in CLI
    url = 'https://insiders.vscode.dev';
  } else if (input.startsWith('https://github.com/') || input.startsWith('https://insiders.vscode.dev')) {
    // If input is a valid Github or vscode.dev URL, the user has selected something else than the default option
    url = input;
  } else {
    url = defaultSuggestionURL;
  }

  if (!url) {
    return;
  }

  chrome.tabs.query({ highlighted: true }, function(tab) {
    chrome.tabs.update(tab.id, { url });
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
  if (changeInfo.url) {
    const { owner, repoName, fullName } = parseRepoFromUrl(changeInfo.url);
    if (!owner || !repoName || !fullName) {
      return;
    }
    
    chrome.storage.local.get(REPO_MAP_LOCAL_STORAGE_KEY, function(storageObj) {
      const repoMap = storageObj.repoMap;
      const didUpdateMap = addRepoToMap(repoMap, owner, repoName, fullName);
      if (didUpdateMap) {
        console.log('Adding ' + fullName + ' to repoMap in local storage');

        chrome.storage.local.set({ repoMap: repoMap }, function() {
          console.log('RepoMap updated successfully in local storage');
        });
      }
    });
  }
});

//#endregion
