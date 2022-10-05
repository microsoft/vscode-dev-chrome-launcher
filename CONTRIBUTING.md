# Contributing to this extension

## Development

This is a Chrome web extension. You can read more about the Chrome extension format and API [here](https://developer.chrome.com/docs/extensions/reference/).

To install this extension for development,
1. Clone this repository to your local machine with
```sh
git clone https://github.com/microsoft/vscode-dev-chrome-launcher.git
```
2. In your Chrome browser, navigate to [chrome://extensions](chrome://extensions). In Edge, navigate to [edge://extensions](edge://extensions).
3. Click 'Load unpacked' and select the folder you cloned this repo into to install the extension.

## Release process

All Chrome extensions are manually published via the Chrome web store developer dashboard. To publish an update to this extension:
1. Increment the version number in the [manifest.json](https://github.com/microsoft/vscode-dev-chrome-launcher/blob/40c65da7531a55f8953e381531c82ac81c038515/manifest.json#L5)
2. Upload the extension package to the Chrome web store developer dashboard
3. Select to publish to test accounts after the update has passed review
4. Test the extension e.g. through the standard VS Code endgame testing process
5. Select to publish to all users after the extension has passed testing

⚠️ Note that the Chrome web store may take up to three weeks to review each update before publishing.
