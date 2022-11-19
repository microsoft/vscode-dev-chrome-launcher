const form = document.querySelector("form");
const stableButton = document.getElementById("buildChoice1");
const insidersButton = document.getElementById("buildChoice2");

// Using sync storage so other browser sessions will have the settings
function save_options(data) {
  const build = data.getAll("build")[0];

  chrome.storage.sync.set({
    vsCodeBuild: build
  }, function () {
    console.log(`Preferences saved: ${build}`);
  });
}

// Display the user's chosen settings
function restore_options() {
  chrome.storage.sync.get({
    vsCodeBuild: 'vscode.dev'
  }, function (items) {
    if (items.vsCodeBuild == 'vscode.dev') {
      stableButton.checked = true;
    }
    else {
      insidersButton.checked = true;
    }
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
form.addEventListener(
  "submit",
  (event) => {
    const data = new FormData(form);
    save_options(data);
    event.preventDefault();
  },
  false
);
