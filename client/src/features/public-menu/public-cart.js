import { useEffect, useState } from "react";

function readStorage(key) {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function buildPublicScopeKey(businessSlug, sourceSlug) {
  return `${businessSlug || "unknown"}:${sourceSlug || "unknown"}`;
}

export function usePublicCart(scopeKey) {
  const storageKey = `serveflow-cart:${scopeKey}`;
  const [cartState, setCartState] = useState(() => readStorage(storageKey) || { items: [], orderNote: "" });

  useEffect(() => {
    setCartState(readStorage(storageKey) || { items: [], orderNote: "" });
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(cartState));
  }, [cartState, storageKey]);

  const total = cartState.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const itemCount = cartState.items.reduce((sum, item) => sum + item.quantity, 0);

  function addItem(menuItem) {
    setCartState((currentState) => {
      const existingItem = currentState.items.find((item) => item.id === menuItem.id);

      if (existingItem) {
        return {
          ...currentState,
          items: currentState.items.map((item) =>
            item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        };
      }

      return {
        ...currentState,
        items: [
          ...currentState.items,
          {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            imageUrl: menuItem.imageUrl,
            quantity: 1,
            itemNote: ""
          }
        ]
      };
    });
  }

  function updateQuantity(menuItemId, nextQuantity) {
    setCartState((currentState) => {
      if (nextQuantity <= 0) {
        return {
          ...currentState,
          items: currentState.items.filter((item) => item.id !== menuItemId)
        };
      }

      return {
        ...currentState,
        items: currentState.items.map((item) =>
          item.id === menuItemId ? { ...item, quantity: nextQuantity } : item
        )
      };
    });
  }

  function updateItemNote(menuItemId, itemNote) {
    setCartState((currentState) => ({
      ...currentState,
      items: currentState.items.map((item) =>
        item.id === menuItemId ? { ...item, itemNote } : item
      )
    }));
  }

  function setOrderNote(orderNote) {
    setCartState((currentState) => ({
      ...currentState,
      orderNote
    }));
  }

  function syncWithMenu(menuItems) {
    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      return;
    }

    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

    setCartState((currentState) => {
      let hasChanges = false;

      const nextItems = currentState.items.map((item) => {
        const liveMenuItem = menuItemsById.get(item.id);

        if (!liveMenuItem) {
          return item;
        }

        if (
          item.name === liveMenuItem.name &&
          item.price === liveMenuItem.price &&
          item.imageUrl === liveMenuItem.imageUrl
        ) {
          return item;
        }

        hasChanges = true;

        return {
          ...item,
          name: liveMenuItem.name,
          price: liveMenuItem.price,
          imageUrl: liveMenuItem.imageUrl
        };
      });

      return hasChanges
        ? {
            ...currentState,
            items: nextItems
          }
        : currentState;
    });
  }

  function clearCart() {
    setCartState({
      items: [],
      orderNote: ""
    });
  }

  return {
    items: cartState.items,
    orderNote: cartState.orderNote,
    itemCount,
    total,
    addItem,
    updateQuantity,
    updateItemNote,
    setOrderNote,
    syncWithMenu,
    clearCart
  };
}

export function persistSuccessfulOrder(scopeKey, order) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(`serveflow-last-order:${scopeKey}`, JSON.stringify(order));
}

export function readSuccessfulOrder(scopeKey) {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.sessionStorage.getItem(`serveflow-last-order:${scopeKey}`);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
