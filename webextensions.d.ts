/**
 * Use the `browser.storage` API to store, retrieve, and track changes to user data.
 *
 * Permissions: `storage`
 */
declare namespace browser.storage {
    /* storage types */
    interface StorageChange {
        /** The old value of the item, if there was an old value. */
        oldValue?: any
        /** The new value of the item, if there is a new value. */
        newValue?: any
    }

    interface StorageArea {
        /**
         * Gets one or more items from storage.
         * @param [keys] A single key to get, list of keys to get, or a dictionary specifying default values (see description of the object). An empty list or object will return an empty result object. Pass in `null` to get the entire contents of storage.
         */
        get(
            keys?: string | string[] | { [key: string]: any },
        ): Promise<{ [key: string]: any }>
        /**
         * Gets the amount of space (in bytes) being used by one or more items.
         * @param [keys] A single key or list of keys to get the total usage for. An empty list will return 0\. Pass in `null` to get the total usage of all of storage.
         * @deprecated Unsupported on Firefox at this time.
         */
        getBytesInUse?(keys?: string | string[]): Promise<number>
        /**
         * Sets multiple items.
         * @param items An object which gives each key/value pair to update storage with. Any other key/value pairs in storage will not be affected.
         *
         * Primitive values such as numbers will serialize as expected. Values with a `typeof` `"object"` and `"function"` will typically serialize to `{}`, with the exception of `Array` (serializes as expected), `Date`, and `Regex` (serialize using their `String` representation).
         */
        set(items: { [key: string]: any }): Promise<void>
        /**
         * Removes one or more items from storage.
         * @param keys A single key or a list of keys for items to remove.
         */
        remove(keys: string | string[]): Promise<void>
        /** Removes all items from storage. */
        clear(): Promise<void>
        /**
         * Fired when one or more items change.
         * @param changes Object mapping each key that changed to its corresponding `storage.StorageChange` for that item.
         */
        onChanged: WebExtEvent<
            (changes: { [key: string]: StorageChange }) => void
        >
    }

    interface StorageAreaSync {
        /**
         * Gets one or more items from storage.
         * @param [keys] A single key to get, list of keys to get, or a dictionary specifying default values (see description of the object). An empty list or object will return an empty result object. Pass in `null` to get the entire contents of storage.
         */
        get(
            keys?: string | string[] | { [key: string]: any },
        ): Promise<{ [key: string]: any }>
        /**
         * Gets the amount of space (in bytes) being used by one or more items.
         * @param [keys] A single key or list of keys to get the total usage for. An empty list will return 0\. Pass in `null` to get the total usage of all of storage.
         */
        getBytesInUse(keys?: string | string[]): Promise<number>
        /**
         * Sets multiple items.
         * @param items An object which gives each key/value pair to update storage with. Any other key/value pairs in storage will not be affected.
         *
         * Primitive values such as numbers will serialize as expected. Values with a `typeof` `"object"` and `"function"` will typically serialize to `{}`, with the exception of `Array` (serializes as expected), `Date`, and `Regex` (serialize using their `String` representation).
         */
        set(items: { [key: string]: any }): Promise<void>
        /**
         * Removes one or more items from storage.
         * @param keys A single key or a list of keys for items to remove.
         */
        remove(keys: string | string[]): Promise<void>
        /** Removes all items from storage. */
        clear(): Promise<void>
        /**
         * Fired when one or more items change.
         * @param changes Object mapping each key that changed to its corresponding `storage.StorageChange` for that item.
         */
        onChanged: WebExtEvent<
            (changes: { [key: string]: StorageChange }) => void
        >
    }

    /* storage properties */
    /** Items in the `sync` storage area are synced by the browser. */
    const sync: StorageAreaSync

    /** Items in the `local` storage area are local to each machine. */
    const local: StorageArea

    /**
     * Items in the `managed` storage area are set by administrators or native applications, and are read-only for the extension; trying to modify this namespace results in an error.
     */
    const managed: StorageArea

    /* storage events */
    /**
     * Fired when one or more items change.
     * @param changes Object mapping each key that changed to its corresponding `storage.StorageChange` for that item.
     * @param areaName The name of the storage area (`"sync"`, `"local"` or `"managed"`) the changes are for.
     */
    const onChanged: WebExtEvent<
        (changes: { [key: string]: StorageChange }, areaName: string) => void
    >
}
/**
 * Use the `browser.runtime` API to retrieve the background page, return details about the manifest, and listen for and respond to events in the app or extension lifecycle. You can also use this API to convert the relative path of URLs to fully-qualified URLs.
 */
declare namespace browser.runtime {
    /* runtime types */
    /** An object which allows two way communication with other pages. */
    interface Port {
        name: string
        disconnect: () => void
        postMessage: (message: object) => void
        /** This property will **only** be present on ports passed to onConnect/onConnectExternal listeners. */
        sender?: MessageSender | undefined
        error?: Error | undefined
        onMessage: WebExtEvent<(response: object) => void>
        onDisconnect: WebExtEvent<(port: Port) => void>
    }

    /** An object containing information about the script context that sent a message or request. */
    interface MessageSender {
        /**
         * The `tabs.Tab` which opened the connection, if any. This property will **only** be present when the connection was opened from a tab (including content scripts), and **only** if the receiver is an extension, not an app.
         */
        tab?: tabs.Tab | undefined
        /**
         * The frame that opened the connection. 0 for top-level frames, positive for child frames. This will only be set when `tab` is set.
         */
        frameId?: number | undefined
        /** The ID of the extension or app that opened the connection, if any. */
        id?: string | undefined
        /**
         * The URL of the page or frame that opened the connection. If the sender is in an iframe, it will be iframe's URL not the URL of the page which hosts it.
         */
        url?: string | undefined
        /**
         * The TLS channel ID of the page or frame that opened the connection, if requested by the extension or app, and if available.
         * @deprecated Unsupported on Firefox at this time.
         */
        tlsChannelId?: string | undefined
    }

    /** The operating system the browser is running on. */
    type PlatformOs = "mac" | "win" | "android" | "cros" | "linux" | "openbsd"

    /** The machine's processor architecture. */
    type PlatformArch =
        | "aarch64"
        | "arm"
        | "ppc64"
        | "s390x"
        | "sparc64"
        | "x86-32"
        | "x86-64"
        | "noarch"

    /** An object containing information about the current platform. */
    interface PlatformInfo {
        /** The operating system the browser is running on. */
        os: PlatformOs
        /** The machine's processor architecture. */
        arch: PlatformArch
        /**
         * The native client architecture. This may be different from arch on some platforms.
         * @deprecated Unsupported on Firefox at this time.
         */
        nacl_arch?: PlatformNaclArch | undefined
    }

    /** An object containing information about the current browser. */
    interface BrowserInfo {
        /** The name of the browser, for example 'Firefox'. */
        name: string
        /** The name of the browser vendor, for example 'Mozilla'. */
        vendor: string
        /** The browser's version, for example '42.0.0' or '0.8.1pre'. */
        version: string
        /** The browser's build ID/date, for example '20160101'. */
        buildID: string
    }

    /** Result of the update check. */
    type RequestUpdateCheckStatus =
        | "throttled"
        | "no_update"
        | "update_available"

    /** The reason that this event is being dispatched. */
    type OnInstalledReason = "install" | "update" | "browser_update"

    /**
     * The reason that the event is being dispatched. 'app_update' is used when the restart is needed because the application is updated to a newer version. 'os_update' is used when the restart is needed because the browser/OS is updated to a newer version. 'periodic' is used when the system runs for more than the permitted uptime set in the enterprise policy.
     */
    type OnRestartRequiredReason = "app_update" | "os_update" | "periodic"

    type PlatformNaclArch = "arm" | "x86-32" | "x86-64"

    /** This will be defined during an API method callback if there was an error */
    interface _LastError {
        /** Details about the error which occurred. */
        message?: string | undefined
    }

    /** If an update is available, this contains more information about the available update. */
    interface _RequestUpdateCheckReturnDetails {
        /** The version of the available update. */
        version: string
    }

    interface _ConnectConnectInfo {
        /** Will be passed into onConnect for processes that are listening for the connection event. */
        name?: string | undefined
        /**
         * Whether the TLS channel ID will be passed into onConnectExternal for processes that are listening for the connection event.
         */
        includeTlsChannelId?: boolean | undefined
    }

    interface _SendMessageOptions {
        /**
         * Whether the TLS channel ID will be passed into onMessageExternal for processes that are listening for the connection event.
         * @deprecated Unsupported on Firefox at this time.
         */
        includeTlsChannelId?: boolean | undefined
    }

    type DirectoryEntry = any

    interface _OnInstalledDetails {
        /** The reason that this event is being dispatched. */
        reason: OnInstalledReason
        /**
         * Indicates the previous version of the extension, which has just been updated. This is present only if 'reason' is 'update'.
         */
        previousVersion?: string | undefined
        /** Indicates whether the addon is installed as a temporary extension. */
        temporary: boolean
        /**
         * Indicates the ID of the imported shared module extension which updated. This is present only if 'reason' is 'shared_module_update'.
         * @deprecated Unsupported on Firefox at this time.
         */
        id?: string | undefined
    }

    /** The manifest details of the available update. */
    interface _OnUpdateAvailableDetails {
        /** The version number of the available update. */
        version: string
    }

    /* runtime properties */
    /** This will be defined during an API method callback if there was an error */
    const lastError: _LastError | undefined

    /** The ID of the extension/app. */
    const id: string

    /* runtime functions */
    /**
     * Retrieves the JavaScript 'window' object for the background page running inside the current extension/app. If the background page is an event page, the system will ensure it is loaded before calling the callback. If there is no background page, an error is set.
     */
    function getBackgroundPage(): Promise<Window>

    /**
     * Open your Extension's options page, if possible.
     *
     * The precise behavior may depend on your manifest's `options_ui` or `options_page` key, or what the browser happens to support at the time.
     *
     * If your Extension does not declare an options page, or the browser failed to create one for some other reason, the callback will set `lastError`.
     */
    function openOptionsPage(): Promise<void>

    /**
     * Returns details about the app or extension from the manifest. The object returned is a serialization of the full manifest file.
     */
    function getManifest(): _manifest.WebExtensionManifest

    /**
     * Converts a relative path within an app/extension install directory to a fully-qualified URL.
     * @param path A path to a resource within an app/extension expressed relative to its install directory.
     * @returns The fully-qualified URL to the resource.
     */
    function getURL(path: string): string

    /**
     * Get the frameId of any window global or frame element.
     * @param target A WindowProxy or a Browsing Context container element (IFrame, Frame, Embed, Object) for the target frame.
     * @returns The frameId of the target frame, or -1 if it doesn't exist.
     */
    function getFrameId(target: any): number

    /**
     * Sets the URL to be visited upon uninstallation. This may be used to clean up server-side data, do analytics, and implement surveys. Maximum 255 characters.
     * @param [url] URL to be opened after the extension is uninstalled. This URL must have an http: or https: scheme. Set an empty string to not open a new tab upon uninstallation.
     */
    function setUninstallURL(url?: string): Promise<void>

    /** Reloads the app or extension. */
    function reload(): void

    /**
     * Requests an update check for this app/extension.
     * @deprecated Unsupported on Firefox at this time.
     */
    function requestUpdateCheck(): Promise<object>

    /**
     * Restart the device when the app runs in kiosk mode. Otherwise, it's no-op.
     * @deprecated Unsupported on Firefox at this time.
     */
    function restart(): void

    /**
     * Attempts to connect to connect listeners within an extension/app (such as the background page), or other extensions/apps. This is useful for content scripts connecting to their extension processes, inter-app/extension communication, and web messaging. Note that this does not connect to any listeners in a content script. Extensions may connect to content scripts embedded in tabs via `tabs.connect`.
     * @returns Port through which messages can be sent and received. The port's `runtime.Port onDisconnect` event is fired if the extension/app does not exist.
     */
    function connect(): Port
    /**
     * Attempts to connect to connect listeners within an extension/app (such as the background page), or other extensions/apps. This is useful for content scripts connecting to their extension processes, inter-app/extension communication, and web messaging. Note that this does not connect to any listeners in a content script. Extensions may connect to content scripts embedded in tabs via `tabs.connect`.
     * @param extensionId The ID of the extension or app to connect to. If omitted, a connection will be attempted with your own extension. Required if sending messages from a web page for web messaging.
     * @returns Port through which messages can be sent and received. The port's `runtime.Port onDisconnect` event is fired if the extension/app does not exist.
     */
    function connect(
        extensionId: string,
        connectInfo?: _ConnectConnectInfo,
    ): Port
    /**
     * Attempts to connect to connect listeners within an extension/app (such as the background page), or other extensions/apps. This is useful for content scripts connecting to their extension processes, inter-app/extension communication, and web messaging. Note that this does not connect to any listeners in a content script. Extensions may connect to content scripts embedded in tabs via `tabs.connect`.
     * @returns Port through which messages can be sent and received. The port's `runtime.Port onDisconnect` event is fired if the extension/app does not exist.
     */
    function connect(connectInfo: _ConnectConnectInfo): Port

    /**
     * Connects to a native application in the host machine.
     *
     * Not allowed in: Devtools pages
     * @param application The name of the registered application to connect to.
     * @returns Port through which messages can be sent and received with the application
     */
    function connectNative(application: string): Port

    /**
     * Sends a single message to event listeners within your extension/app or a different extension/app. Similar to `runtime.connect` but only sends a single message, with an optional response. If sending to your extension, the `runtime.onMessage` event will be fired in each page, or `runtime.onMessageExternal`, if a different extension. Note that extensions cannot send messages to content scripts using this method. To send messages to content scripts, use `tabs.sendMessage`.
     */
    function sendMessage(
        message: any,
        options?: _SendMessageOptions,
    ): Promise<any>
    /**
     * Sends a single message to event listeners within your extension/app or a different extension/app. Similar to `runtime.connect` but only sends a single message, with an optional response. If sending to your extension, the `runtime.onMessage` event will be fired in each page, or `runtime.onMessageExternal`, if a different extension. Note that extensions cannot send messages to content scripts using this method. To send messages to content scripts, use `tabs.sendMessage`.
     * @param extensionId The ID of the extension/app to send the message to. If omitted, the message will be sent to your own extension/app. Required if sending messages from a web page for web messaging.
     */
    function sendMessage(
        extensionId: string,
        message: any,
        options?: _SendMessageOptions,
    ): Promise<any>

    /**
     * Send a single message to a native application.
     *
     * Not allowed in: Devtools pages
     * @param application The name of the native messaging host.
     * @param message The message that will be passed to the native messaging host.
     */
    function sendNativeMessage(application: string, message: any): Promise<any>

    /** Returns information about the current browser. */
    function getBrowserInfo(): Promise<BrowserInfo>

    /** Returns information about the current platform. */
    function getPlatformInfo(): Promise<PlatformInfo>

    /**
     * Returns a DirectoryEntry for the package directory.
     * @deprecated Unsupported on Firefox at this time.
     */
    function getPackageDirectoryEntry(): Promise<DirectoryEntry>

    /* runtime events */
    /**
     * Fired when a profile that has this extension installed first starts up. This event is not fired for incognito profiles.
     */
    const onStartup: WebExtEvent<() => void>

    /**
     * Fired when the extension is first installed, when the extension is updated to a new version, and when the browser is updated to a new version.
     */
    const onInstalled: WebExtEvent<(details: _OnInstalledDetails) => void>

    /**
     * Sent to the event page just before it is unloaded. This gives the extension opportunity to do some clean up. Note that since the page is unloading, any asynchronous operations started while handling this event are not guaranteed to complete. If more activity for the event page occurs before it gets unloaded the onSuspendCanceled event will be sent and the page won't be unloaded.
     */
    const onSuspend: WebExtEvent<() => void>

    /** Sent after onSuspend to indicate that the app won't be unloaded after all. */
    const onSuspendCanceled: WebExtEvent<() => void>

    /**
     * Fired when an update is available, but isn't installed immediately because the app is currently running. If you do nothing, the update will be installed the next time the background page gets unloaded, if you want it to be installed sooner you can explicitly call `runtime.reload`. If your extension is using a persistent background page, the background page of course never gets unloaded, so unless you call `runtime.reload` manually in response to this event the update will not get installed until the next time the browser itself restarts. If no handlers are listening for this event, and your extension has a persistent background page, it behaves as if `runtime.reload` is called in response to this event.
     * @param details The manifest details of the available update.
     */
    const onUpdateAvailable: WebExtEvent<
        (details: _OnUpdateAvailableDetails) => void
    >

    /**
     * Fired when an update for the browser is available, but isn't installed immediately because a browser restart is required.
     * @deprecated Please use `runtime.onRestartRequired`.
     */
    const onBrowserUpdateAvailable: WebExtEvent<() => void> | undefined

    /** Fired when a connection is made from either an extension process or a content script. */
    const onConnect: WebExtEvent<(port: Port) => void>

    /** Fired when a connection is made from another extension. */
    const onConnectExternal: WebExtEvent<(port: Port) => void>

    /**
     * Fired when a message is sent from either an extension process or a content script.
     * @param message The message sent by the calling script.
     * @param sendResponse Function to call (at most once) when you have a response. The argument should be any JSON-ifiable object. If you have more than one `onMessage` listener in the same document, then only one may send a response. This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response asynchronously (this will keep the message channel open to the other end until `sendResponse` is called).
     * @returns Return true from the event listener if you wish to call `sendResponse` after the event listener returns.
     */
    const onMessage: WebExtEvent<
        (
            message: any,
            sender: MessageSender,
            sendResponse: (response?: any) => void,
        ) => boolean | Promise<any> | void
    >

    /**
     * Fired when a message is sent from another extension/app. Cannot be used in a content script.
     * @param message The message sent by the calling script.
     * @param sendResponse Function to call (at most once) when you have a response. The argument should be any JSON-ifiable object. If you have more than one `onMessage` listener in the same document, then only one may send a response. This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response asynchronously (this will keep the message channel open to the other end until `sendResponse` is called).
     * @returns Return true from the event listener if you wish to call `sendResponse` after the event listener returns.
     */
    const onMessageExternal: WebExtEvent<
        (
            message: any,
            sender: MessageSender,
            sendResponse: (response?: any) => void,
        ) => boolean | Promise<any> | void
    >

    /**
     * Fired when an app or the device that it runs on needs to be restarted. The app should close all its windows at its earliest convenient time to let the restart to happen. If the app does nothing, a restart will be enforced after a 24-hour grace period has passed. Currently, this event is only fired for Chrome OS kiosk apps.
     * @param reason The reason that the event is being dispatched.
     * @deprecated Unsupported on Firefox at this time.
     */
    const onRestartRequired:
        | WebExtEvent<(reason: OnRestartRequiredReason) => void>
        | undefined
}
