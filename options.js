const buildSelect = document.getElementById('build-select');
const buildSubmit = document.getElementById('build-submit');

// Using sync storage so other browser sessions will have the settings
function save_options() {
  var build = buildSelect.value;

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
    buildSelect.value = items.vsCodeBuild;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
buildSubmit.addEventListener('click', save_options);
