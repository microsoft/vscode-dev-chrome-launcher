# Firefox Extension

Firefox's support for manifest v3 web extensions is still in preview. As a result, there are a a few caveats:
- The preview must be enabled by following these [instructions](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/)
- Firefox does not support service workers yet (see [this](https://blog.mozilla.org/addons/2022/05/18/manifest-v3-in-firefox-recap-next-steps/) for details). It is using background scripts for now, which means the manifest file is not compatible with the Chromium one and vice versa
- Manifest files can't reference files in their parent directory
- Firefox requires add-on IDs to use browser sync storage, but Chromium doesn't support `browser_specific_settings` in the manifest

So for simplicity's sake, we are keeping two copies of the source code (which is compatible with both browser engines) in each directory. We'll unite them once the manifest compatibility is sorted out.
