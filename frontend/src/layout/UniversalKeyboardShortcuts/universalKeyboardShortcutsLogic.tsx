import { actions, afterMount, beforeUnmount, connect, kea, path, reducers } from 'kea'

import { panelLayoutLogic } from '../panel-layout/panelLayoutLogic'
import type { universalKeyboardShortcutsLogicType } from './universalKeyboardShortcutsLogicType'

export type UniversalKeyboardShortcutCategory = 'nav' | 'product' | 'sidepanel'
export interface UniversalKeyboardShortcutItem {
    // The ref to the element to focus on
    ref: React.RefObject<HTMLElement>
    // The name of the shortcut used for reference
    name: string
    // The category of the shortcut, used to group shortcuts in the UI
    category: UniversalKeyboardShortcutCategory
    // The keybind to use for the shortcut
    keybind: string[]
    // Describe what the shortcut does
    intent: string
    // The type of interaction to trigger
    interaction: 'click' | 'focus'
}

export const universalKeyboardShortcutsLogic = kea<universalKeyboardShortcutsLogicType>([
    path(['layout', 'universalKeyboardShortcuts', 'universalKeyboardShortcutsLogic']),
    connect({
        values: [panelLayoutLogic, ['panelTreeRef']],
    }),
    actions({
        registerKeyboardShortcut: (keyboardShortcut: UniversalKeyboardShortcutItem) => ({ keyboardShortcut }),
        unregisterKeyboardShortcut: (name: string) => ({ name }),
        showKeyboardShortcuts: (show: boolean) => ({ show }),
    }),
    reducers({
        isKeyboardShortcutsVisible: [
            false,
            {
                showKeyboardShortcuts: (_, { show }) => show,
            },
        ],
        registeredKeyboardShortcuts: [
            [] as UniversalKeyboardShortcutItem[],
            {
                registerKeyboardShortcut: (state, { keyboardShortcut }) => [...state, keyboardShortcut],
                unregisterKeyboardShortcut: (state, { name }) => state.filter((shortcut) => shortcut.name !== name),
            },
        ],
    }),
    afterMount(({ actions, values, cache }) => {
        // register keyboard shortcuts
        cache.onKeyDown = (event: KeyboardEvent) => {
            if (event.shiftKey && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                actions.showKeyboardShortcuts(true)

                // We use & store 'command' instead of 'meta'/'ctrl' because it's more consistent with the rest of the app
                // 'ctrl' is supported as functional keybind, just not here for comparison purposes
                const keybind = [`command`, `shift`, `${event.key}`]

                const thisRegisteredKeyboardShortcut = values.registeredKeyboardShortcuts.find(
                    (shortcut) => shortcut.keybind.join('+') === keybind.join('+')
                )

                if (thisRegisteredKeyboardShortcut) {
                    if (thisRegisteredKeyboardShortcut.interaction === 'click') {
                        thisRegisteredKeyboardShortcut.ref.current?.click()
                    } else if (thisRegisteredKeyboardShortcut.interaction === 'focus') {
                        thisRegisteredKeyboardShortcut.ref.current?.focus()
                    }
                }
            }
        }
        cache.onKeyUp = (event: KeyboardEvent) => {
            if (!event.shiftKey && !event.metaKey) {
                actions.showKeyboardShortcuts(false)
            }
        }

        // Hide keyboard shortcuts when the window is blurred
        cache.onBlur = () => actions.showKeyboardShortcuts(false)

        window.addEventListener('keydown', cache.onKeyDown)
        window.addEventListener('keyup', cache.onKeyUp)
        window.addEventListener('blur', cache.onBlur)
    }),
    beforeUnmount(({ cache }) => {
        // unregister keyboard shortcuts
        window.removeEventListener('keydown', cache.onKeyDown)
        window.removeEventListener('keyup', cache.onKeyUp)
        window.removeEventListener('blur', cache.onBlur)
    }),
])
