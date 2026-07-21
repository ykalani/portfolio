export function getAllWindowDefinitions(baseWindows, generatedWindows) {
  return [...baseWindows, ...generatedWindows];
}

export function getWindowDefinition(baseWindows, generatedWindows, id) {
  return getAllWindowDefinitions(baseWindows, generatedWindows)
    .find((definition) => definition.id === id) || null;
}

export function getNextActiveWindowId(state, definitions) {
  return definitions
    .filter((definition) => state.windows[definition.id]?.open && !state.windows[definition.id]?.minimized)
    .sort((left, right) => state.windows[right.id].zIndex - state.windows[left.id].zIndex)[0]?.id || "";
}

function canManageWindow(state, id, definitions) {
  return Boolean(
    state.windows[id]
    && getWindowDefinition([], definitions, id),
  );
}

export function openWindowState(state, id, definitions) {
  if (!canManageWindow(state, id, definitions)) {
    return false;
  }

  const windowState = state.windows[id];
  windowState.open = true;
  windowState.minimized = false;
  windowState.zIndex = ++state.zCounter;
  state.activeWindowId = id;
  return true;
}

export function focusWindowState(state, id, definitions) {
  if (!canManageWindow(state, id, definitions) || !state.windows[id].open) {
    return false;
  }

  state.windows[id].minimized = false;
  state.windows[id].zIndex = ++state.zCounter;
  state.activeWindowId = id;
  return true;
}

export function minimizeWindowState(state, id, definitions) {
  if (
    !canManageWindow(state, id, definitions)
    || !state.windows[id].open
    || state.windows[id].minimized
  ) {
    return false;
  }

  state.windows[id].minimized = true;
  state.activeWindowId = getNextActiveWindowId(state, definitions);
  return true;
}

export function closeWindowState(state, id, definitions) {
  if (!canManageWindow(state, id, definitions) || !state.windows[id].open) {
    return false;
  }

  state.windows[id].open = false;
  state.windows[id].minimized = false;
  state.windows[id].zIndex = 0;
  state.activeWindowId = getNextActiveWindowId(state, definitions);
  return true;
}
